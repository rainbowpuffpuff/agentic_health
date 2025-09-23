
import os
from flask import Flask, request, jsonify
import pandas as pd
from io import StringIO
import numpy as np

app = Flask(__name__)

def calculate_score(fnirs_data, glucose_level):
    """
    Calculates a deterministic score based on fNIRS and glucose data.
    This logic is ported from the Genkit prompt.
    """
    logs = []
    fnirs_score = 0
    plausibility_score = 0
    
    # 1. fNIRS Data Quality
    logs.append("Starting fNIRS data quality check.")
    lines = fnirs_data.strip().split('\n')
    num_lines = len(lines)
    
    if num_lines > 500:
        fnirs_score += 20
        logs.append(f"Data length > 500 lines. Score +20. Current fNIRS score: {fnirs_score}")
    elif 200 <= num_lines <= 500:
        fnirs_score += 10
        logs.append(f"Data length 200-500 lines. Score +10. Current fNIRS score: {fnirs_score}")
    else:
        fnirs_score += 5
        logs.append(f"Data length < 200 lines. Score +5. Current fNIRS score: {fnirs_score}")

    try:
        df = pd.read_csv(StringIO(fnirs_data))
        logs.append("Successfully parsed fNIRS data into a DataFrame.")
        # Signal Noise (simple outlier detection)
        # Using a simple Interquartile Range (IQR) method for outlier detection
        numeric_cols = df.select_dtypes(include=np.number).columns
        if not numeric_cols.empty:
            Q1 = df[numeric_cols].quantile(0.25)
            Q3 = df[numeric_cols].quantile(0.75)
            IQR = Q3 - Q1
            outliers = ((df[numeric_cols] < (Q1 - 1.5 * IQR)) | (df[numeric_cols] > (Q3 + 1.5 * IQR))).sum().sum()
            noise_penalty = min(outliers * 2, 20) # Deduct 2 points per outlier, max 20
            fnirs_score -= noise_penalty
            logs.append(f"Detected {outliers} outliers. Applying noise penalty of -{noise_penalty}. Current fNIRS score: {fnirs_score}")
        else: # No numeric data
             fnirs_score -= 20
             logs.append("No numeric data found. Applying penalty of -20. Current fNIRS score: {fnirs_score}")


        # Formatting check
        if df.shape[1] < 2: # Assuming at least 2 columns for well-structured data
            fnirs_score -= 20 # Messy format
            logs.append(f"Data has fewer than 2 columns. Applying format penalty of -20. Current fNIRS score: {fnirs_score}")
        
    except Exception as e:
        # Penalize heavily if data is not parsable as CSV
        fnirs_score -= 40
        logs.append(f"Failed to parse data as CSV. Applying penalty of -40. Error: {e}. Current fNIRS score: {fnirs_score}")


    fnirs_score = max(0, fnirs_score) # Ensure score isn't negative
    logs.append(f"Final fNIRS Data Quality score (capped at 60): {min(60, fnirs_score)}")

    # 2. Data Plausibility
    logs.append("Starting Data Plausibility check.")
    # Glucose Range Score
    if 70 <= glucose_level <= 180:
        if 90 <= glucose_level <= 110:
            plausibility_score += 20
            logs.append(f"Glucose level {glucose_level} is optimal. Score +20. Current plausibility score: {plausibility_score}")
        else:
            plausibility_score += 15 # Good range but not optimal
            logs.append(f"Glucose level {glucose_level} is in good range. Score +15. Current plausibility score: {plausibility_score}")
    else:
        plausibility_score += 5 # Less common/useful data
        logs.append(f"Glucose level {glucose_level} is outside optimal range. Score +5. Current plausibility score: {plausibility_score}")

    # Fictional Data-Glucose Correlation
    if 'df' in locals() and not df.select_dtypes(include=np.number).empty:
        # Use standard deviation of the first numeric column as a proxy for variability
        variability = df.select_dtypes(include=np.number).iloc[:,0].std()
        logs.append(f"fNIRS data variability (std dev) is {variability:.2f}.")
        
        is_stable_glucose = 80 <= glucose_level <= 120
        
        if is_stable_glucose and variability < 10: # Low variability matches stable glucose
            plausibility_score += 20
            logs.append(f"Good correlation: Stable glucose and low fNIRS variability. Score +20. Current plausibility score: {plausibility_score}")
        elif not is_stable_glucose and variability > 15: # High variability matches non-stable glucose
            plausibility_score += 20
            logs.append(f"Good correlation: Non-stable glucose and high fNIRS variability. Score +20. Current plausibility score: {plausibility_score}")
        elif is_stable_glucose and variability > 15: # Mismatch
            plausibility_score += 5
            logs.append(f"Mismatched correlation: Stable glucose but high fNIRS variability. Score +5. Current plausibility score: {plausibility_score}")
        elif not is_stable_glucose and variability < 10: # Mismatch
            plausibility_score += 5
            logs.append(f"Mismatched correlation: Non-stable glucose but low fNIRS variability. Score +5. Current plausibility score: {plausibility_score}")
        else: # Average correlation
            plausibility_score += 10
            logs.append(f"Average correlation. Score +10. Current plausibility score: {plausibility_score}")
    else:
        # Cannot determine correlation if data is not parsable
        plausibility_score += 0
        logs.append("Could not parse fNIRS data to check correlation. Score +0. Current plausibility score: {plausibility_score}")

    logs.append(f"Final Data Plausibility score (capped at 40): {min(40, plausibility_score)}")
    # Total Score Calculation
    total_score = min(60, fnirs_score) + min(40, plausibility_score)
    total_score = int(max(0, min(100, total_score)))
    logs.append(f"Total calculated score: {total_score}")
    
    # Reward Calculation
    reward = total_score // 10
    logs.append(f"Calculated reward: {reward}")

    # Reason Generation
    reason = ""
    if total_score > 85:
        reason = "Great submission! The fNIRS data was clean and showed strong correlation with the provided glucose level."
    elif total_score > 60:
        reason = "Good data, but some noise was detected in the fNIRS signal. A cleaner signal next time could improve your score."
    else:
        reason = "Thank you for the contribution. The data had some formatting or quality issues which impacted the score."
    logs.append(f"Generated reason: '{reason}'")

    return {
        "contributionScore": total_score,
        "reward": reward,
        "reason": reason,
        "logs": logs
    }


@app.route('/score', methods=['POST'])
def score_endpoint():
    """
    API endpoint to score data contribution.
    Expects JSON payload with 'fnirsData' and 'glucoseLevel'.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    fnirs_data = data.get('fnirsData')
    glucose_level = data.get('glucoseLevel')

    if not fnirs_data or glucose_level is None:
        return jsonify({"error": "Missing 'fnirsData' or 'glucoseLevel' in request"}), 400

    try:
        # The agent would fetch the data from Swarm using the CID, but for now we pass it directly.
        result = calculate_score(fnirs_data, float(glucose_level))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": "Failed to process data", "details": str(e)}), 500

@app.route('/verify-rest', methods=['POST'])
def verify_rest_endpoint():
    """
    API endpoint to verify a user's "Proof of Rest".
    Expects JSON payload with 'photoDataUri'.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    photo_data_uri = data.get('photoDataUri')

    if not photo_data_uri:
        return jsonify({"error": "Missing 'photoDataUri' in request"}), 400
    
    # In a real TEE, we would perform actual image analysis here.
    # For this simulation, we'll just check if the data URI looks like a valid image.
    if 'data:image' in photo_data_uri and 'base64' in photo_data_uri:
        # The agent, after successful verification, would then sign and send a transaction
        # to the main application smart contract to trigger the reward payout.
        # We simulate this success response.
        return jsonify({
            "isSleepingSurface": True,
            "reason": "Agent verified a valid sleeping surface image was provided.",
            "next_step": "Agent can now sign a transaction to call 'withdraw' on the smart contract for the user."
        })
    else:
        return jsonify({
            "isSleepingSurface": False,
            "reason": "The provided image data was not a valid data URI.",
        })


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))

