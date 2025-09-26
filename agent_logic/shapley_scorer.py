
def score_data_contribution(fnirs_data: str, glucose_level: float) -> dict:
    """
    Analyzes fNIRS and glucose data to provide a contribution score.
    This is a placeholder for a real machine learning model.
    """
    # Mock analysis based on data size and glucose range
    score = 75
    reason = "Good submission. The data appears clean and within expected ranges."
    
    if len(fnirs_data) < 100:
        score -= 20
        reason = "Submission could be improved with a longer fNIRS data sample."
        
    if not (70 <= glucose_level <= 180):
        score -= 15
        reason = "Glucose level is outside the typical range, which may affect model training."

    reward = score // 10

    return {
        "contributionScore": max(0, score),
        "reward": reward,
        "reason": reason
    }
