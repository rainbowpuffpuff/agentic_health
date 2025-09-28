#!/usr/bin/env python3
"""
Test the ML pipeline with real fNIRS data
"""

import json
from ml_pipeline import ml_app
from fastapi.testclient import TestClient

def test_with_sample_fnirs_data():
    """Test the API with sample fNIRS data format"""
    
    client = TestClient(ml_app)
    
    # Create sample fNIRS data in the expected format
    sample_fnirs_data = """Time,S1_D1_740nm_LP,S1_D1_850nm_LP,S2_D5_740nm_LP,S2_D5_850nm_LP
1.0,0.5,0.6,0.52,0.58
2.0,0.51,0.59,0.53,0.57
3.0,0.49,0.61,0.51,0.59
4.0,0.50,0.60,0.52,0.58
5.0,0.48,0.62,0.50,0.60"""
    
    test_request = {
        "fnirs_data": sample_fnirs_data,
        "glucose_level": 5.5,
        "user_id": "test.testnet"
    }
    
    print("Testing ML pipeline with sample fNIRS data...")
    response = client.post("/api/score-contribution", json=test_request)
    
    print(f"Response status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Contribution Score: {data['contribution_score']}")
        print(f"Reward Points: {data['reward_points']}")
        print(f"Reason: {data['reason']}")
        print(f"Processing Time: {data['processing_time']:.4f}s")
        print(f"Data Quality Metrics:")
        for key, value in data['data_quality_metrics'].items():
            print(f"  {key}: {value}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_with_sample_fnirs_data()