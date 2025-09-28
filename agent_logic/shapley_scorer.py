#!/usr/bin/env python3
"""
Data Shapley Implementation for fNIRS Glucose Prediction

This module implements real Data Shapley value calculation for fair reward
distribution based on data contribution quality in biomedical ML.

Two modes:
1. Within-session: Chunks from same session (easier, faster)
2. Between-session: Cross-session validation (harder, more realistic)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import random
from typing import List, Dict, Tuple, Optional
import time
from dataclasses import dataclass

# Import existing ML components
from glucose_ml_processor import GlucoseMLProcessor, preprocess_and_feature_engineer
from data_file_manager import DataFileManager

@dataclass
class DataChunk:
    """Represents a chunk of fNIRS + glucose data (simulates user contribution)"""
    fnirs_data: np.ndarray
    glucose_data: np.ndarray
    start_time: float
    duration: float
    chunk_id: int
    session_id: str
    
    def __eq__(self, other):
        """Custom equality based on chunk_id and session_id"""
        if not isinstance(other, DataChunk):
            return False
        return self.chunk_id == other.chunk_id and self.session_id == other.session_id
    
    def __hash__(self):
        """Make DataChunk hashable for use in sets"""
        return hash((self.chunk_id, self.session_id))

class ShapleyScorer:
    """
    Real Data Shapley implementation for fNIRS glucose prediction
    
    Uses coalition sampling to calculate fair rewards based on 
    actual contribution to model performance improvement.
    """
    
    def __init__(self, chunk_size_minutes: float = 5.0):
        self.chunk_size_minutes = chunk_size_minutes
        self.chunk_size_samples = int(chunk_size_minutes * 60 * 10)  # 10 Hz sampling
        self.ml_processor = GlucoseMLProcessor()
        self.data_manager = DataFileManager('eigen_blood')
        
    def load_and_chunk_data(self) -> Tuple[List[DataChunk], List[DataChunk]]:
        """Load both sessions and split into chunks"""
        print("Loading fNIRS data files...")
        
        # Ensure data files are available
        session1_files = ['first_session/first_fnirs_log.csv']
        session2_files = ['second_session/second_fnirs_log.csv']
        
        self.data_manager.ensure_files_available(session1_files + session2_files)
        
        # Load session data
        session1_data = self._load_session_data('first_session/first_fnirs_log.csv', 'session1')
        session2_data = self._load_session_data('second_session/second_fnirs_log.csv', 'session2')
        
        # Split into chunks
        session1_chunks = self._split_into_chunks(session1_data, 'session1')
        session2_chunks = self._split_into_chunks(session2_data, 'session2')
        
        print(f"Created {len(session1_chunks)} chunks from Session 1")
        print(f"Created {len(session2_chunks)} chunks from Session 2")
        
        return session1_chunks, session2_chunks
    
    def _load_session_data(self, filepath: str, session_id: str) -> pd.DataFrame:
        """Load and preprocess session data"""
        try:
            # The data manager creates merged files in temp directory
            # Check both the original path and temp path
            possible_paths = [
                f'eigen_blood/{filepath}',
                f'temp_merged_files/{filepath.split("/")[-1]}',  # Just filename
                filepath  # Direct path
            ]
            
            data = None
            for path in possible_paths:
                try:
                    data = pd.read_csv(path)
                    print(f"Successfully loaded data from: {path}")
                    break
                except FileNotFoundError:
                    continue
            
            if data is None:
                raise FileNotFoundError(f"Could not find data file at any of: {possible_paths}")
            
            # Basic preprocessing - ensure we have the required columns
            # Clean column names (remove extra spaces)
            data.columns = data.columns.str.strip()
            
            required_cols = ['Time', 'S1_D1_740nm_LP', 'S1_D1_850nm_LP']
            if not all(col in data.columns for col in required_cols):
                print(f"Available columns: {list(data.columns[:10])}...")  # Show first 10 columns
                raise ValueError(f"Missing required columns in {filepath}")
            
            # Add glucose data (simulated for now - in real app this comes from CGM)
            # For demo purposes, create realistic glucose variation
            np.random.seed(42 if session_id == 'session1' else 123)
            base_glucose = 6.0 + np.random.normal(0, 0.5, len(data))
            data['glucose'] = np.clip(base_glucose, 4.0, 10.0)
            
            return data
            
        except Exception as e:
            print(f"Error loading {filepath}: {e}")
            raise
    
    def _split_into_chunks(self, data: pd.DataFrame, session_id: str) -> List[DataChunk]:
        """Split session data into time-based chunks"""
        chunks = []
        chunk_id = 0
        
        for start_idx in range(0, len(data), self.chunk_size_samples):
            end_idx = min(start_idx + self.chunk_size_samples, len(data))
            chunk_data = data.iloc[start_idx:end_idx]
            
            # Only keep chunks that are at least 80% of expected size
            if len(chunk_data) >= self.chunk_size_samples * 0.8:
                # Extract fNIRS signals
                fnirs_signals = chunk_data[['S1_D1_740nm_LP', 'S1_D1_850nm_LP']].values
                glucose_values = chunk_data['glucose'].values
                
                chunk = DataChunk(
                    fnirs_data=fnirs_signals,
                    glucose_data=glucose_values,
                    start_time=chunk_data['Time'].iloc[0],
                    duration=len(chunk_data) / 10.0,  # 10 Hz sampling
                    chunk_id=chunk_id,
                    session_id=session_id
                )
                chunks.append(chunk)
                chunk_id += 1
        
        return chunks
    
    def calculate_within_session_shapley(self, session_chunks: List[DataChunk], 
                                       target_chunk_id: int, 
                                       num_coalitions: int = 100) -> float:
        """
        Calculate Shapley value within a single session
        
        Easier case: Train and test on different chunks from same session
        """
        print(f"Calculating within-session Shapley for chunk {target_chunk_id}...")
        
        target_chunk = session_chunks[target_chunk_id]
        other_chunks = [c for c in session_chunks if c.chunk_id != target_chunk_id]
        
        if len(other_chunks) < 2:
            return 0.0  # Need at least 2 other chunks
        
        shapley_value = 0.0
        
        for i in range(num_coalitions):
            # Sample random coalition size (1 to len(other_chunks)-1)
            coalition_size = random.randint(1, max(1, len(other_chunks) - 1))
            
            # Sample random coalition of other chunks
            coalition = random.sample(other_chunks, coalition_size)
            
            # Reserve one chunk for testing (not in coalition or target)
            remaining_chunks = [c for c in other_chunks if c not in coalition]
            if not remaining_chunks:
                continue
            test_chunk = random.choice(remaining_chunks)
            
            # Performance WITHOUT target chunk
            perf_without = self._train_and_evaluate(coalition, [test_chunk])
            
            # Performance WITH target chunk
            coalition_with_target = coalition + [target_chunk]
            perf_with = self._train_and_evaluate(coalition_with_target, [test_chunk])
            
            # Marginal contribution
            marginal_contribution = perf_with - perf_without
            shapley_value += marginal_contribution
        
        return shapley_value / num_coalitions
    
    def calculate_between_session_shapley(self, session1_chunks: List[DataChunk],
                                        session2_chunks: List[DataChunk],
                                        target_chunk_id: int,
                                        num_coalitions: int = 50) -> float:
        """
        Calculate Shapley value between sessions
        
        Harder case: Train on Session 1 chunks, test on Session 2
        More realistic for cross-session generalization
        """
        print(f"Calculating between-session Shapley for chunk {target_chunk_id}...")
        
        target_chunk = session1_chunks[target_chunk_id]
        other_chunks = [c for c in session1_chunks if c.chunk_id != target_chunk_id]
        
        if len(other_chunks) < 1:
            return 0.0
        
        # Use all of Session 2 as test set
        test_chunks = session2_chunks
        
        shapley_value = 0.0
        
        for i in range(num_coalitions):
            # Sample random coalition from other Session 1 chunks
            coalition_size = random.randint(1, len(other_chunks))
            coalition = random.sample(other_chunks, coalition_size)
            
            # Performance WITHOUT target chunk
            perf_without = self._train_and_evaluate(coalition, test_chunks)
            
            # Performance WITH target chunk
            coalition_with_target = coalition + [target_chunk]
            perf_with = self._train_and_evaluate(coalition_with_target, test_chunks)
            
            # Marginal contribution
            marginal_contribution = perf_with - perf_without
            shapley_value += marginal_contribution
        
        return shapley_value / num_coalitions
    
    def _train_and_evaluate(self, train_chunks: List[DataChunk], 
                          test_chunks: List[DataChunk]) -> float:
        """Train model on training chunks, evaluate on test chunks"""
        try:
            # Combine training data
            if not train_chunks:
                return -1.0  # Very bad performance for empty training set
            
            train_features_list = []
            train_glucose_list = []
            
            # Extract features and corresponding glucose for each chunk
            for chunk in train_chunks:
                chunk_features = self._extract_simple_features(chunk.fnirs_data)
                if len(chunk_features) == 0:
                    continue
                    
                # Create corresponding glucose values (average over each window)
                window_size = 60
                chunk_glucose = []
                for start_idx in range(0, len(chunk.glucose_data), window_size):
                    end_idx = min(start_idx + window_size, len(chunk.glucose_data))
                    window_glucose = chunk.glucose_data[start_idx:end_idx]
                    
                    if len(window_glucose) >= window_size * 0.5:
                        chunk_glucose.append(np.mean(window_glucose))
                
                if len(chunk_glucose) == len(chunk_features):
                    train_features_list.append(chunk_features)
                    train_glucose_list.extend(chunk_glucose)
            
            if not train_features_list:
                return -1.0
                
            train_features = np.vstack(train_features_list)
            train_glucose = np.array(train_glucose_list)
            
            # Same for test data
            test_features_list = []
            test_glucose_list = []
            
            for chunk in test_chunks:
                chunk_features = self._extract_simple_features(chunk.fnirs_data)
                if len(chunk_features) == 0:
                    continue
                    
                window_size = 60
                chunk_glucose = []
                for start_idx in range(0, len(chunk.glucose_data), window_size):
                    end_idx = min(start_idx + window_size, len(chunk.glucose_data))
                    window_glucose = chunk.glucose_data[start_idx:end_idx]
                    
                    if len(window_glucose) >= window_size * 0.5:
                        chunk_glucose.append(np.mean(window_glucose))
                
                if len(chunk_glucose) == len(chunk_features):
                    test_features_list.append(chunk_features)
                    test_glucose_list.extend(chunk_glucose)
            
            if not test_features_list:
                return -1.0
                
            test_features = np.vstack(test_features_list)
            test_glucose = np.array(test_glucose_list)
            
            # Train simple model (faster than full pipeline)
            model = RandomForestRegressor(n_estimators=50, random_state=42, max_depth=10)
            model.fit(train_features, train_glucose)
            
            # Evaluate
            predictions = model.predict(test_features)
            r2 = r2_score(test_glucose, predictions)
            
            return max(r2, -1.0)  # Clip to reasonable range
            
        except Exception as e:
            print(f"Error in train_and_evaluate: {e}")
            return -1.0
    
    def _extract_simple_features(self, fnirs_data: np.ndarray) -> np.ndarray:
        """Extract basic statistical features from fNIRS signals"""
        if len(fnirs_data) == 0:
            return np.array([]).reshape(0, 8)
        
        # Create features for each time window (e.g., every 60 samples = 6 seconds at 10Hz)
        window_size = 60
        features_list = []
        
        for start_idx in range(0, len(fnirs_data), window_size):
            end_idx = min(start_idx + window_size, len(fnirs_data))
            window_data = fnirs_data[start_idx:end_idx]
            
            if len(window_data) < window_size * 0.5:  # Skip very small windows
                continue
                
            window_features = []
            
            # For each channel (740nm, 850nm)
            for channel in range(window_data.shape[1]):
                signal = window_data[:, channel]
                
                # Basic statistics
                window_features.extend([
                    np.mean(signal),
                    np.std(signal),
                    np.min(signal),
                    np.max(signal)
                ])
            
            features_list.append(window_features)
        
        if not features_list:
            return np.array([]).reshape(0, 8)
            
        return np.array(features_list)
    
    def run_shapley_experiment(self, mode: str = 'within') -> Dict:
        """
        Run complete Shapley experiment
        
        Args:
            mode: 'within' for within-session, 'between' for between-session
        """
        print(f"\n🧮 Running {mode}-session Data Shapley experiment...")
        start_time = time.time()
        
        # Load and chunk data
        session1_chunks, session2_chunks = self.load_and_chunk_data()
        
        results = {
            'mode': mode,
            'session1_chunks': len(session1_chunks),
            'session2_chunks': len(session2_chunks),
            'shapley_values': {},
            'statistics': {}
        }
        
        # Calculate Shapley values for first few chunks (demo)
        num_chunks_to_test = min(5, len(session1_chunks))
        shapley_values = []
        
        for chunk_id in range(num_chunks_to_test):
            if mode == 'within':
                shapley_val = self.calculate_within_session_shapley(
                    session1_chunks, chunk_id, num_coalitions=20
                )
            else:  # between
                shapley_val = self.calculate_between_session_shapley(
                    session1_chunks, session2_chunks, chunk_id, num_coalitions=20
                )
            
            results['shapley_values'][chunk_id] = shapley_val
            shapley_values.append(shapley_val)
            
            print(f"  Chunk {chunk_id}: Shapley = {shapley_val:.4f}")
        
        # Calculate statistics
        results['statistics'] = {
            'mean_shapley': np.mean(shapley_values),
            'std_shapley': np.std(shapley_values),
            'min_shapley': np.min(shapley_values),
            'max_shapley': np.max(shapley_values),
            'total_time': time.time() - start_time
        }
        
        print(f"✅ {mode.title()}-session Shapley experiment completed in {results['statistics']['total_time']:.1f}s")
        print(f"   Mean Shapley value: {results['statistics']['mean_shapley']:.4f}")
        print(f"   Shapley range: [{results['statistics']['min_shapley']:.4f}, {results['statistics']['max_shapley']:.4f}]")
        
        return results

def run_demo_experiments():
    """Run both within-session and between-session Shapley experiments"""
    print("🎯 Data Shapley Demo with Real fNIRS Data")
    print("=" * 50)
    
    scorer = ShapleyScorer(chunk_size_minutes=3.0)  # Smaller chunks for demo
    
    # Run within-session experiment
    within_results = scorer.run_shapley_experiment('within')
    
    print("\n" + "=" * 50)
    
    # Run between-session experiment  
    between_results = scorer.run_shapley_experiment('between')
    
    print("\n🎉 Data Shapley experiments completed!")
    print(f"Within-session mean Shapley: {within_results['statistics']['mean_shapley']:.4f}")
    print(f"Between-session mean Shapley: {between_results['statistics']['mean_shapley']:.4f}")
    
    return within_results, between_results

if __name__ == "__main__":
    run_demo_experiments()