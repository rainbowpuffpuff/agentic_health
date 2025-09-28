#!/usr/bin/env python3
"""
Comprehensive ML Pipeline Testing Suite

This single test file covers all ML pipeline functionality:
1. Basic infrastructure tests
2. Real data processing tests  
3. API endpoint tests with realistic data
4. Cross-session experiment validation
"""

import json
import sys
import os
import numpy as np
from fastapi.testclient import TestClient

# Import our modules
from ml_pipeline import ml_app, MLPipeline
from glucose_ml_processor import run_cross_session_experiments, preprocess_and_feature_engineer

def test_infrastructure():
    """Test basic ML pipeline infrastructure"""
    print("🔧 Testing ML Pipeline Infrastructure...")
    
    try:
        # Test pipeline initialization
        pipeline = MLPipeline()
        print(f"  ✅ Pipeline initialized (Models loaded: {pipeline.models_loaded})")
        
        # Test API app creation
        client = TestClient(ml_app)
        print("  ✅ FastAPI client created")
        
        return True
    except Exception as e:
        print(f"  ❌ Infrastructure test failed: {e}")
        return False

def test_health_endpoints():
    """Test health and info endpoints"""
    print("\n🏥 Testing Health Endpoints...")
    
    client = TestClient(ml_app)
    
    try:
        # Test health endpoint
        health_response = client.get("/api/health")
        assert health_response.status_code == 200
        health_data = health_response.json()
        print(f"  ✅ Health: {health_data['status']} (Models: {health_data['models_loaded']})")
        
        # Test pipeline info endpoint
        info_response = client.get("/api/pipeline-info")
        assert info_response.status_code == 200
        info_data = info_response.json()
        print(f"  ✅ Pipeline Info: v{info_data['pipeline_version']} ({len(info_data['models_available'])} models)")
        
        return True
    except Exception as e:
        print(f"  ❌ Health endpoints test failed: {e}")
        return False

def test_real_data_processing():
    """Test processing with actual fNIRS data files"""
    print("\n📊 Testing Real Data Processing...")
    
    # Check if data files exist
    files_to_check = [
        'eigen_blood/first_session/first_fnirs_log.csv',
        'eigen_blood/first_session/first_cgm_log.csv',
        'eigen_blood/second_session/second_fnirs_log.csv',
        'eigen_blood/second_session/second_cgm_log.csv'
    ]
    
    for file_path in files_to_check:
        if not os.path.exists(file_path):
            print(f"  ❌ Missing data file: {file_path}")
            return False
    
    print("  ✅ All data files found")
    
    try:
        # Test single session processing
        from glucose_ml_processor import S1_FNIRS_PATH, S1_CGM_PATH, S1_CGM_COLUMN
        result = preprocess_and_feature_engineer(S1_FNIRS_PATH, S1_CGM_PATH, S1_CGM_COLUMN)
        print(f"  ✅ Session 1 processed: {result.n_epochs} epochs, {len(result.feature_names)} features")
        
        return True
    except Exception as e:
        print(f"  ❌ Real data processing failed: {e}")
        return False

def generate_realistic_fnirs_data(duration_seconds=120, sampling_rate=10):
    """Generate realistic fNIRS data for API testing"""
    
    n_samples = int(duration_seconds * sampling_rate)
    time_points = np.linspace(0, duration_seconds, n_samples)
    
    # Generate realistic fNIRS signals with physiological patterns
    base_signal_740 = 0.5 + 0.1 * np.sin(2 * np.pi * time_points / 30) + np.random.normal(0, 0.02, n_samples)
    base_signal_850 = 0.6 + 0.08 * np.cos(2 * np.pi * time_points / 25) + np.random.normal(0, 0.02, n_samples)
    
    # Create CSV with multiple channels (needed for processing)
    lines = ["Time,S1_D1_740nm_LP,S1_D1_850nm_LP,S2_D5_740nm_LP,S2_D5_850nm_LP,S3_D6_740nm_LP,S3_D6_850nm_LP"]
    
    for i, t in enumerate(time_points):
        # Add channel variations
        s1_740 = base_signal_740[i] + np.random.normal(0, 0.01)
        s1_850 = base_signal_850[i] + np.random.normal(0, 0.01)
        s2_740 = base_signal_740[i] + np.random.normal(0, 0.01) + 0.02
        s2_850 = base_signal_850[i] + np.random.normal(0, 0.01) + 0.02
        s3_740 = base_signal_740[i] + np.random.normal(0, 0.01) - 0.01
        s3_850 = base_signal_850[i] + np.random.normal(0, 0.01) - 0.01
        
        lines.append(f"{t:.2f},{s1_740:.4f},{s1_850:.4f},{s2_740:.4f},{s2_850:.4f},{s3_740:.4f},{s3_850:.4f}")
    
    return "\n".join(lines)

def test_api_endpoints():
    """Test API endpoints with realistic data"""
    print("\n🌐 Testing API Endpoints...")
    
    client = TestClient(ml_app)
    
    try:
        # Generate realistic test data
        fnirs_data = generate_realistic_fnirs_data(duration_seconds=180, sampling_rate=10)
        
        test_request = {
            "fnirs_data": fnirs_data,
            "glucose_level": 6.2,
            "user_id": "test_user.testnet"
        }
        
        # Test score contribution endpoint
        response = client.post("/api/score-contribution", json=test_request)
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ API Success: Score {data['contribution_score']}/100, Rewards {data['reward_points']}")
            print(f"     Processing time: {data['processing_time']:.3f}s")
            
            # Validate response structure
            required_fields = ["contribution_score", "reward_points", "reason", "processing_time", "data_quality_metrics"]
            for field in required_fields:
                assert field in data, f"Missing field: {field}"
            
            # Validate score ranges
            assert 0 <= data['contribution_score'] <= 100, "Score out of range"
            assert data['reward_points'] >= 0, "Negative reward points"
            
            return True
        else:
            print(f"  ❌ API Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"  ❌ API test failed: {e}")
        return False

def test_cross_session_experiments():
    """Test full cross-session ML experiments (optional - takes longer)"""
    print("\n🔬 Testing Cross-Session ML Experiments...")
    
    try:
        print("  Running cross-session experiments (this may take a few minutes)...")
        results = run_cross_session_experiments()
        
        # Check that we got results
        if len(results) == 2:
            r1, r2 = results
            print(f"  ✅ Experiment 1 (S1→S2): R² = {r1['performance'].r2:.3f}")
            print(f"  ✅ Experiment 2 (S2→S1): R² = {r2['performance'].r2:.3f}")
            
            # Check that models were saved
            assert os.path.exists(r1['model_path']), "Model 1 not saved"
            assert os.path.exists(r2['model_path']), "Model 2 not saved"
            
            return True
        else:
            print("  ❌ Unexpected number of experiment results")
            return False
            
    except Exception as e:
        print(f"  ❌ Cross-session experiments failed: {e}")
        return False

def run_all_tests(include_experiments=False):
    """Run all tests in sequence"""
    print("🧪 ML Pipeline Comprehensive Test Suite")
    print("=" * 50)
    
    tests = [
        ("Infrastructure", test_infrastructure),
        ("Health Endpoints", test_health_endpoints),
        ("Real Data Processing", test_real_data_processing),
        ("API Endpoints", test_api_endpoints),
    ]
    
    if include_experiments:
        tests.append(("Cross-Session Experiments", test_cross_session_experiments))
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"  ❌ {test_name} crashed: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Test Results Summary:")
    
    passed = 0
    total = len(results)
    
    for test_name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status} {test_name}")
        if success:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! ML Pipeline is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return False

if __name__ == "__main__":
    # Check command line arguments
    include_experiments = "--experiments" in sys.argv or "-e" in sys.argv
    
    if include_experiments:
        print("Note: Including cross-session experiments (this will take several minutes)")
    else:
        print("Note: Skipping cross-session experiments (use --experiments to include them)")
    
    success = run_all_tests(include_experiments=include_experiments)
    sys.exit(0 if success else 1)