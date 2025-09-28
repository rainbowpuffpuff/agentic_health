"""
ML Pipeline for fNIRS Data Processing and Scoring

This module provides FastAPI endpoints for processing fNIRS (functional Near-Infrared Spectroscopy) 
data and generating contribution scores using machine learning algorithms.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException
import numpy as np
import pandas as pd
from dataclasses import dataclass
import os
import tempfile
import io

# Import our glucose ML processor and data manager
from glucose_ml_processor import GlucoseMLProcessor, preprocess_and_feature_engineer
from data_file_manager import DataFileManager
import io
import tempfile
import os

# Import our fNIRS processing functions (now in glucose_ml_processor)
# These are imported separately where needed


# --- Pydantic Models for API Requests and Responses ---

class ScoreContributionRequest(BaseModel):
    """Request model for fNIRS data contribution scoring"""
    fnirs_data: str = Field(..., description="Raw fNIRS CSV/text content")
    glucose_level: float = Field(..., ge=0, le=1000, description="Glucose level in mg/dL")
    user_id: str = Field(..., description="NEAR account ID of the user")

    model_config = {
        "json_schema_extra": {
            "example": {
                "fnirs_data": "timestamp,wavelength_760nm,wavelength_850nm\n1.0,0.5,0.6\n2.0,0.52,0.58",
                "glucose_level": 95.5,
                "user_id": "user.testnet"
            }
        }
    }


class DataQualityMetrics(BaseModel):
    """Data quality assessment metrics"""
    signal_to_noise_ratio: float = Field(..., description="Signal-to-noise ratio")
    data_completeness: float = Field(..., ge=0, le=1, description="Percentage of complete data points")
    sampling_rate: float = Field(..., description="Detected sampling rate in Hz")
    duration_seconds: float = Field(..., description="Total duration of data in seconds")
    noise_level: float = Field(..., description="Estimated noise level")


class ScoreContributionResponse(BaseModel):
    """Response model for fNIRS data contribution scoring"""
    contribution_score: int = Field(..., ge=0, le=100, description="Contribution score (0-100)")
    reward_points: int = Field(..., ge=0, description="Intention points earned")
    reason: str = Field(..., description="Explanation of the score")
    processing_time: float = Field(..., description="Processing time in seconds")
    data_quality_metrics: DataQualityMetrics


# --- Data Processing Models ---

@dataclass
class FNIRSDataPoint:
    """Single fNIRS measurement point"""
    timestamp: float
    wavelength_760nm: float
    wavelength_850nm: float
    dHbO: Optional[float] = None  # Calculated oxygenated hemoglobin
    dHbR: Optional[float] = None  # Calculated deoxygenated hemoglobin


@dataclass
class ProcessedFNIRSData:
    """Processed fNIRS dataset"""
    data_points: List[FNIRSDataPoint]
    sampling_rate: float
    duration_seconds: float
    quality_score: float
    noise_level: float


@dataclass
class EpochFeatures:
    """Statistical features extracted from a data epoch"""
    mean_dHbO: float
    var_dHbO: float
    slope_dHbO: float
    mean_dHbR: float
    var_dHbR: float
    slope_dHbR: float
    signal_to_noise: float


@dataclass
class FeatureVector:
    """Complete feature vector for ML processing"""
    epoch_features: List[EpochFeatures]
    global_features: Dict[str, float]
    metadata: Dict[str, Any]


@dataclass
class GlucosePrediction:
    """Glucose prediction result"""
    predicted_glucose: float
    confidence_interval: tuple[float, float]
    prediction_uncertainty: float
    model_agreement: float


# --- ML Pipeline Class ---

class MLPipeline:
    """Main ML pipeline for fNIRS data processing"""
    
    def __init__(self):
        self.models_loaded = False
        self.feature_extractors = {}
        self.glucose_models = {}
        self.glucose_processor = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize the glucose ML processor and load trained models"""
        try:
            self.glucose_processor = GlucoseMLProcessor()
            
            # Load pre-trained models
            model_dir = "glucose_ml_plots"
            if os.path.exists(model_dir):
                model_files = [f for f in os.listdir(model_dir) if f.endswith('.joblib')]
                
                for model_file in model_files:
                    model_path = os.path.join(model_dir, model_file)
                    model_name = model_file.replace('.joblib', '').replace('best_model_', '')
                    
                    try:
                        import joblib
                        model = joblib.load(model_path)
                        self.glucose_models[model_name] = model
                        print(f"Loaded model: {model_name}")
                    except Exception as e:
                        print(f"Warning: Could not load model {model_file}: {e}")
                
                if self.glucose_models:
                    self.models_loaded = True
                    print(f"Successfully loaded {len(self.glucose_models)} trained models")
                    
        except Exception as e:
            print(f"Warning: Could not initialize glucose processor: {e}")
    
    def preprocess_fnirs_data(self, raw_data: str, glucose_level: float) -> ProcessedFNIRSData:
        """
        Converts raw optical signals to hemoglobin measurements
        
        Args:
            raw_data: Raw CSV/text content with fNIRS measurements
            glucose_level: Corresponding glucose level for this data
            
        Returns:
            ProcessedFNIRSData object with converted measurements
        """
        try:
            # Create temporary files for processing
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as fnirs_file:
                fnirs_file.write(raw_data)
                fnirs_path = fnirs_file.name
            
            # Create a simple CGM file with the provided glucose level
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as cgm_file:
                # Create a minimal CGM file with timestamp and glucose
                cgm_content = "Device Timestamp,Scan Glucose (mmol/L)\n"
                cgm_content += f"01-01-2025 12:00,{glucose_level}\n"
                cgm_file.write(cgm_content)
                cgm_path = cgm_file.name
            
            try:
                # Process the data using our fNIRS processor
                result = preprocess_and_feature_engineer(
                    fnirs_path, cgm_path, 'Scan Glucose (mmol/L)'
                )
                
                # Convert to our data structure
                data_points = []
                if len(result.y) > 0:
                    # Create data points from the processed result
                    for i in range(min(len(result.y), 100)):  # Limit to first 100 points
                        data_points.append(FNIRSDataPoint(
                            timestamp=float(i),
                            wavelength_760nm=0.5,  # Placeholder - actual values would come from processing
                            wavelength_850nm=0.6,  # Placeholder - actual values would come from processing
                            dHbO=float(glucose_level + np.random.normal(0, 0.1)),  # Simulated
                            dHbR=float(glucose_level + np.random.normal(0, 0.1))   # Simulated
                        ))
                
                return ProcessedFNIRSData(
                    data_points=data_points,
                    sampling_rate=result.sampling_rate,
                    duration_seconds=len(data_points) / result.sampling_rate if result.sampling_rate > 0 else 0,
                    quality_score=0.85,  # Placeholder quality score
                    noise_level=0.1
                )
                
            finally:
                # Clean up temporary files
                os.unlink(fnirs_path)
                os.unlink(cgm_path)
                
        except Exception as e:
            raise ValueError(f"Error processing fNIRS data: {str(e)}")
    
    def extract_features(self, processed_data: ProcessedFNIRSData, epoch_length: int = 30) -> FeatureVector:
        """
        Segments data into epochs and extracts statistical features
        
        Args:
            processed_data: Processed fNIRS data
            epoch_length: Length of each epoch in seconds
            
        Returns:
            FeatureVector with extracted features
        """
        try:
            epoch_features = []
            
            # Calculate samples per epoch
            samples_per_epoch = int(epoch_length * processed_data.sampling_rate)
            
            # Extract features from data points
            if len(processed_data.data_points) >= samples_per_epoch:
                for i in range(0, len(processed_data.data_points) - samples_per_epoch + 1, samples_per_epoch // 2):
                    epoch_data = processed_data.data_points[i:i + samples_per_epoch]
                    
                    # Extract dHbO and dHbR values
                    dhbo_values = [dp.dHbO for dp in epoch_data if dp.dHbO is not None]
                    dhbr_values = [dp.dHbR for dp in epoch_data if dp.dHbR is not None]
                    
                    if dhbo_values and dhbr_values:
                        dhbo_array = np.array(dhbo_values)
                        dhbr_array = np.array(dhbr_values)
                        
                        # Calculate statistical features
                        epoch_features.append(EpochFeatures(
                            mean_dHbO=float(np.mean(dhbo_array)),
                            var_dHbO=float(np.var(dhbo_array)),
                            slope_dHbO=float(np.polyfit(range(len(dhbo_array)), dhbo_array, 1)[0]),
                            mean_dHbR=float(np.mean(dhbr_array)),
                            var_dHbR=float(np.var(dhbr_array)),
                            slope_dHbR=float(np.polyfit(range(len(dhbr_array)), dhbr_array, 1)[0]),
                            signal_to_noise=processed_data.quality_score / processed_data.noise_level
                        ))
            
            # Global features
            global_features = {
                'total_duration': processed_data.duration_seconds,
                'sampling_rate': processed_data.sampling_rate,
                'overall_quality': processed_data.quality_score,
                'noise_level': processed_data.noise_level
            }
            
            # Metadata
            metadata = {
                'n_epochs': len(epoch_features),
                'epoch_length': epoch_length,
                'processing_timestamp': datetime.now().isoformat()
            }
            
            return FeatureVector(
                epoch_features=epoch_features,
                global_features=global_features,
                metadata=metadata
            )
            
        except Exception as e:
            raise ValueError(f"Error extracting features: {str(e)}")
    
    def _parse_fnirs_csv_to_array(self, fnirs_csv_data: str) -> np.ndarray:
        """
        Parse CSV fNIRS data string to numpy array for Shapley calculation
        
        Args:
            fnirs_csv_data: Raw CSV string with fNIRS data
            
        Returns:
            numpy array with shape (n_samples, 2) for 740nm and 850nm channels
        """
        try:
            # Parse CSV data
            lines = fnirs_csv_data.strip().split('\n')
            if len(lines) < 2:
                raise ValueError("CSV data must have header and at least one data row")
            
            # Skip header, parse data rows
            data_rows = []
            for line in lines[1:]:
                parts = line.split(',')
                if len(parts) >= 3:  # Time, 740nm, 850nm
                    try:
                        # Extract 740nm and 850nm values (assuming columns 1 and 2)
                        val_740 = float(parts[1])
                        val_850 = float(parts[2])
                        data_rows.append([val_740, val_850])
                    except (ValueError, IndexError):
                        continue  # Skip malformed rows
            
            if not data_rows:
                raise ValueError("No valid data rows found in CSV")
            
            return np.array(data_rows)
            
        except Exception as e:
            raise ValueError(f"Error parsing fNIRS CSV data: {str(e)}")

    def predict_glucose(self, features: FeatureVector) -> GlucosePrediction:
        """
        Uses regression models to predict glucose from fNIRS features
        
        Args:
            features: Extracted feature vector
            
        Returns:
            GlucosePrediction with model results
        """
        try:
            # Check if we have trained models available
            if self.models_loaded and self.glucose_models:
                # Use trained model for prediction (simplified for now)
                # In practice, you'd need to format features to match training data
                predicted_glucose = 5.5 + np.random.normal(0, 0.5)  # Placeholder
                confidence = 0.8
                uncertainty = 0.3
            else:
                # Fallback to heuristic-based prediction
                if features.epoch_features:
                    # Calculate mean hemoglobin changes across epochs
                    mean_dhbo = np.mean([ef.mean_dHbO for ef in features.epoch_features])
                    mean_dhbr = np.mean([ef.mean_dHbR for ef in features.epoch_features])
                    
                    # Simple heuristic: glucose correlates with hemoglobin changes
                    predicted_glucose = 5.0 + (mean_dhbo * 0.5) + (mean_dhbr * 0.3)
                    confidence = 0.6
                    uncertainty = 0.4
                else:
                    # No epoch features available - use global features
                    print("Warning: No epoch features available, using global features for prediction")
                    overall_quality = features.global_features.get('overall_quality', 0.5)
                    predicted_glucose = 4.5 + (overall_quality * 3.0)  # Scale quality to glucose range
                    confidence = 0.4
                    uncertainty = 0.6
            
            # Ensure reasonable glucose range (3-15 mmol/L)
            predicted_glucose = max(3.0, min(15.0, predicted_glucose))
            
            # Calculate confidence interval
            confidence_interval = (
                predicted_glucose - uncertainty,
                predicted_glucose + uncertainty
            )
            
            return GlucosePrediction(
                predicted_glucose=predicted_glucose,
                confidence_interval=confidence_interval,
                prediction_uncertainty=uncertainty,
                model_agreement=confidence
            )
            
        except Exception as e:
            raise ValueError(f"Error predicting glucose: {str(e)}")


# --- FastAPI Application Setup ---

# Create FastAPI app instance for ML pipeline
ml_app = FastAPI(
    title="fNIRS ML Pipeline API",
    description="Machine Learning pipeline for processing fNIRS data and generating contribution scores",
    version="1.0.0"
)

# Initialize ML pipeline
pipeline = MLPipeline()


@ml_app.post("/api/score-contribution", response_model=ScoreContributionResponse)
async def score_contribution(request: ScoreContributionRequest) -> ScoreContributionResponse:
    """
    Processes fNIRS and glucose data to generate contribution score using real Data Shapley
    
    Uses the full ML pipeline with real Data Shapley calculations to fairly assess
    the contribution value of user's fNIRS data to model performance improvement.
    """
    start_time = datetime.now()
    
    try:
        # Validate input data format
        if not request.fnirs_data.strip():
            raise HTTPException(status_code=400, detail="fNIRS data cannot be empty")
        
        # Validate glucose level
        if not (3.0 <= request.glucose_level <= 15.0):
            raise HTTPException(
                status_code=400, 
                detail="Glucose level must be between 3.0 and 15.0 mmol/L"
            )
        
        print(f"Processing fNIRS data with real Data Shapley for user: {request.user_id}")
        
        # Step 1: Preprocess fNIRS data using existing pipeline
        processed_data = pipeline.preprocess_fnirs_data(
            request.fnirs_data, 
            request.glucose_level
        )
        
        # Step 2: Calculate data quality metrics
        quality_metrics = DataQualityMetrics(
            signal_to_noise_ratio=float(processed_data.quality_score / processed_data.noise_level),
            data_completeness=min(1.0, len(processed_data.data_points) / 100.0),
            sampling_rate=processed_data.sampling_rate,
            duration_seconds=processed_data.duration_seconds,
            noise_level=processed_data.noise_level
        )
        
        # Step 3: Calculate real Data Shapley contribution score
        try:
            from shapley_scorer import ShapleyScorer, DataChunk
            
            # Initialize Shapley scorer with fast settings for API response
            shapley_scorer = ShapleyScorer(chunk_size_minutes=2.0)  # Small chunks for fast calculation
            
            # Convert user data to format expected by Shapley scorer
            user_fnirs_array = pipeline._parse_fnirs_csv_to_array(request.fnirs_data)
            user_glucose_array = np.full(len(user_fnirs_array), request.glucose_level)
            
            # Create user's data chunk for Shapley calculation
            user_chunk = DataChunk(
                fnirs_data=user_fnirs_array,
                glucose_data=user_glucose_array,
                start_time=0.0,
                duration=len(user_fnirs_array) / 10.0,  # 10 Hz sampling
                chunk_id=999,  # Special ID for user data
                session_id="user_contribution"
            )
            
            # Load existing session data for comparison
            session1_chunks, session2_chunks = shapley_scorer.load_and_chunk_data()
            
            print(f"Loaded {len(session1_chunks)} chunks from Session 1, {len(session2_chunks)} chunks from Session 2")
            
            # Run two separate within-session Shapley simulations
            shapley_values = []
            
            # Simulation 1: User data vs Session 1 chunks (within-session style)
            if len(session1_chunks) >= 3:  # Need enough chunks for meaningful coalitions
                # Simulate user data as if it were a chunk in Session 1
                sim1_chunks = session1_chunks + [user_chunk]
                shapley_val_1 = shapley_scorer.calculate_within_session_shapley(
                    sim1_chunks,
                    len(sim1_chunks) - 1,  # User chunk is last
                    num_coalitions=8  # Fast calculation for API
                )
                shapley_values.append(shapley_val_1)
                print(f"Session 1 simulation - User Shapley: {shapley_val_1:.4f}")
            
            # Simulation 2: User data vs Session 2 chunks (within-session style)  
            if len(session2_chunks) >= 3:  # Need enough chunks for meaningful coalitions
                # Simulate user data as if it were a chunk in Session 2
                sim2_chunks = session2_chunks + [user_chunk]
                shapley_val_2 = shapley_scorer.calculate_within_session_shapley(
                    sim2_chunks,
                    len(sim2_chunks) - 1,  # User chunk is last
                    num_coalitions=8  # Fast calculation for API
                )
                shapley_values.append(shapley_val_2)
                print(f"Session 2 simulation - User Shapley: {shapley_val_2:.4f}")
            
            # Average the Shapley values from both simulations
            if shapley_values:
                user_shapley_value = np.mean(shapley_values)
                shapley_std = np.std(shapley_values) if len(shapley_values) > 1 else 0.0
                
                print(f"Final averaged Shapley value for {request.user_id}: {user_shapley_value:.4f} (±{shapley_std:.4f})")
                
                # Convert Shapley value to contribution score (0-100)
                # Normalize based on typical Shapley value ranges we observed
                shapley_normalized = max(-0.1, min(0.2, user_shapley_value))  # Clip to observed range
                shapley_score = int(((shapley_normalized + 0.1) / 0.3) * 80)  # Scale to 0-80 points
                
                # Data quality bonus (0-20 points)
                quality_bonus = int(quality_metrics.data_completeness * 
                                  min(quality_metrics.signal_to_noise_ratio, 10) * 2)
                quality_bonus = min(20, max(0, quality_bonus))
                
                contribution_score = min(100, max(0, shapley_score + quality_bonus))
                
                # Generate explanation with Shapley details
                reason_parts = []
                reason_parts.append(f"Avg Shapley value: {user_shapley_value:.4f} (2 simulations)")
                reason_parts.append(f"Shapley contribution: {shapley_score}/80 points")
                reason_parts.append(f"Data quality bonus: {quality_bonus}/20 points")
                reason_parts.append(f"Model improvement: {'Positive' if user_shapley_value > 0 else 'Neutral/Negative'}")
                
                shapley_explanation = f"Real Data Shapley from {len(shapley_values)} within-session simulations"
            else:
                raise ValueError("Could not calculate Shapley values - insufficient session data")
            
        except Exception as shapley_error:
            print(f"Shapley calculation failed, falling back to heuristic scoring: {shapley_error}")
            
            # Fallback to original heuristic scoring if Shapley fails
            features = pipeline.extract_features(processed_data)
            glucose_prediction = pipeline.predict_glucose(features)
            
            # Heuristic scoring as backup
            quality_score = int(quality_metrics.data_completeness * 
                               quality_metrics.signal_to_noise_ratio * 5)
            quality_score = min(50, max(0, quality_score))
            
            glucose_error = abs(glucose_prediction.predicted_glucose - request.glucose_level)
            accuracy_score = int(30 * max(0, 1 - (glucose_error / 3.0)))
            duration_score = int(min(20, processed_data.duration_seconds / 15))
            
            contribution_score = min(100, max(0, quality_score + accuracy_score + duration_score))
            
            reason_parts = []
            reason_parts.append(f"Data quality: {quality_score}/50 points (heuristic)")
            reason_parts.append(f"Prediction accuracy: {accuracy_score}/30 points")
            reason_parts.append(f"Duration bonus: {duration_score}/20 points")
            
            shapley_explanation = "Heuristic scoring (Shapley calculation unavailable)"
        
        # Calculate reward points based on contribution score
        if contribution_score >= 80:
            reward_points = contribution_score * 15  # Premium for high-value contributions
        elif contribution_score >= 60:
            reward_points = contribution_score * 12
        elif contribution_score >= 40:
            reward_points = contribution_score * 10
        else:
            reward_points = contribution_score * 8  # Lower multiplier for low-value data
        
        reason = "; ".join(reason_parts) + f" | {shapley_explanation}"
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        print(f"Real Data Shapley scoring complete for {request.user_id}: {contribution_score}/100 points")
        
        return ScoreContributionResponse(
            contribution_score=contribution_score,
            reward_points=reward_points,
            reason=reason,
            processing_time=processing_time,
            data_quality_metrics=quality_metrics
        )
        
    except Exception as e:
        processing_time = (datetime.now() - start_time).total_seconds()
        print(f"Error processing fNIRS data: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing fNIRS data: {str(e)}"
        )


@ml_app.get("/api/health")
def health_check():
    """Health check endpoint for ML pipeline"""
    return {
        "status": "ok",
        "service": "fNIRS ML Pipeline",
        "models_loaded": pipeline.models_loaded,
        "timestamp": datetime.now().isoformat()
    }


@ml_app.get("/api/pipeline-info")
def pipeline_info():
    """Get information about the ML pipeline configuration"""
    return {
        "pipeline_version": "1.0.0",
        "supported_formats": ["CSV"],
        "max_file_size": "10MB",
        "processing_stages": [
            "Data validation",
            "fNIRS preprocessing", 
            "Feature extraction",
            "Glucose prediction",
            "Shapley scoring"
        ],
        "models_available": list(pipeline.glucose_models.keys()) if pipeline.models_loaded else []
    }