#!/usr/bin/env python3
"""
Test the glucose ML processor with actual data files
"""

from glucose_ml_processor import run_cross_session_experiments
import os

def test_real_data_processing():
    """Test processing with the actual data files"""
    
    print("Testing glucose ML processor with real data...")
    
    # Check if data files exist
    files_to_check = [
        'eigen_blood/first_session/first_fnirs_log.csv',
        'eigen_blood/first_session/first_cgm_log.csv',
        'eigen_blood/second_session/second_fnirs_log.csv',
        'eigen_blood/second_session/second_cgm_log.csv'
    ]
    
    for file_path in files_to_check:
        if not os.path.exists(file_path):
            print(f"Warning: {file_path} not found")
            return False
        else:
            print(f"✓ Found: {file_path}")
    
    print("\nRunning cross-session experiments...")
    
    try:
        # Run the experiments
        results = run_cross_session_experiments()
        print("\n🎉 Experiments completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error running experiments: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_real_data_processing()
    if success:
        print("\n✅ Real data processing test passed!")
    else:
        print("\n❌ Real data processing test failed!")