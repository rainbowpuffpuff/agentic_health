#!/usr/bin/env python3
"""
Simple test script to verify ML pipeline infrastructure is working
"""

import json
import sys
from ml_pipeline import ScoreContributionRequest, ml_app
from fastapi.testclient import TestClient

def test_ml_pipeline_infrastructure():
    """Test the ML pipeline API infrastructure"""
    
    # Create test client
    client = TestClient(ml_app)
    
    # Test health endpoint
    print("Testing health endpoint...")
    health_response = client.get("/api/health")
    assert health_response.status_code == 200
    health_data = health_response.json()
    print(f"Health check: {health_data}")
    
    # Test pipeline info endpoint
    print("\nTesting pipeline info endpoint...")
    info_response = client.get("/api/pipeline-info")
    assert info_response.status_code == 200
    info_data = info_response.json()
    print(f"Pipeline info: {json.dumps(info_data, indent=2)}")
    
    # Test score contribution endpoint with sample data
    print("\nTesting score contribution endpoint...")
    test_request = {
        "fnirs_data": "timestamp,wavelength_760nm,wavelength_850nm\n1.0,0.5,0.6\n2.0,0.52,0.58\n3.0,0.48,0.62",
        "glucose_level": 95.5,
        "user_id": "test.testnet"
    }
    
    score_response = client.post("/api/score-contribution", json=test_request)
    assert score_response.status_code == 200
    score_data = score_response.json()
    print(f"Score response: {json.dumps(score_data, indent=2)}")
    
    # Validate response structure
    required_fields = ["contribution_score", "reward_points", "reason", "processing_time", "data_quality_metrics"]
    for field in required_fields:
        assert field in score_data, f"Missing required field: {field}"
    
    # Validate score range
    assert 0 <= score_data["contribution_score"] <= 100, "Score must be between 0-100"
    assert score_data["reward_points"] >= 0, "Reward points must be non-negative"
    
    print("\n✅ All ML pipeline infrastructure tests passed!")
    return True

if __name__ == "__main__":
    try:
        test_ml_pipeline_infrastructure()
        print("\n🎉 ML Pipeline infrastructure is ready!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)