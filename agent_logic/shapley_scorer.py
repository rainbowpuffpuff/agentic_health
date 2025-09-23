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
    fnirs_score = 0
    plausibility_score = 0
    
    # 1. fNIRS Data Quality
    lines = fnirs_data.strip().split('\n')
    num_lines = len(lines)
    
    if num_lines > 500:
        fnirs_score += 20
    elif 200 <= num_lines <= 500:
        fnirs_score += 10
    else:
        fnirs_score += 5

    try:
        df = pd.read_csv(StringIO(fnirs_data))
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
        else: # No numeric data
             fnirs_score -= 20


        # Formatting check
        if df.shape[1] < 2: # Assuming at least 2 columns for well-structured data
            fnirs_score -= 20 # Messy format
        
    except Exception:
        # Penalize heavily if data is not parsable as CSV
        fnirs_score -= 40


    fnirs_score = max(0, fnirs_score) # Ensure score isn't negative

    # 2. Data Plausibility
    # Glucose Range Score
    if 70 <= glucose_level <= 180:
        if 90 <= glucose_level <= 110:
            plausibility_score += 20
        else:
            plausibility_score += 15 # Good range but not optimal
    else:
        plausibility_score += 5 # Less common/useful data

    # Fictional Data-Glucose Correlation
    if 'df' in locals() and not df.select_dtypes(include=np.number).empty:
        # Use standard deviation of the first numeric column as a proxy for variability
        variability = df.select_dtypes(include=np.number).iloc[:,0].std()
        
        is_stable_glucose = 80 <= glucose_level <= 120
        
        if is_stable_glucose and variability < 10: # Low variability matches stable glucose
            plausibility_score += 20
        elif not is_stable_glucose and variability > 15: # High variability matches non-stable glucose
            plausibility_score += 20
        elif is_stable_glucose and variability > 15: # Mismatch
            plausibility_score += 5
        elif not is_stable_glucose and variability < 10: # Mismatch
            plausibility_score += 5
        else: # Average correlation
            plausibility_score += 10
    else:
        # Cannot determine correlation if data is not parsable
        plausibility_score += 0


    # Total Score Calculation
    total_score = min(60, fnirs_score) + min(40, plausibility_score)
    total_score = int(max(0, min(100, total_score)))
    
    # Reward Calculation
    reward = total_score // 10

    # Reason Generation
    reason = ""
    if total_score > 85:
        reason = "Great submission! The fNIRS data was clean and showed strong correlation with the provided glucose level."
    elif total_score > 60:
        reason = "Good data, but some noise was detected in the fNIRS signal. A cleaner signal next time could improve your score."
    else:
        reason = "Thank you for the contribution. The data had some formatting or quality issues which impacted the score."

    return {
        "contributionScore": total_score,
        "reward": reward,
        "reason": reason
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


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
