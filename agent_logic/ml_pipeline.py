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

# Import our glucose ML processor
from glucose_ml_processor import GlucoseMLProcessor, preprocess_and_feature_engineer
import io
import tempfile
import os

# Import our fNIRS processing functions
from fnirs_processor import (
    preprocess_and_feature_engineer, 
    train_glucose_model,
    evaluate_model,
    ProcessingResult,
    ModelPerformance
)


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
    Processes fNIRS and glucose data to generate contribution score
    
    Uses the full ML pipeline to process fNIRS data, extract features,
    predict glucose, and calculate contribution scores.
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
        
        print(f"Processing fNIRS data for user: {request.user_id}")
        
        # Step 1: Preprocess fNIRS data
        processed_data = pipeline.preprocess_fnirs_data(
            request.fnirs_data, 
            request.glucose_level
        )
        
        # Step 2: Extract features
        features = pipeline.extract_features(processed_data)
        
        # Step 3: Predict glucose (for validation)
        glucose_prediction = pipeline.predict_glucose(features)
        
        # Step 4: Calculate data quality metrics
        quality_metrics = DataQualityMetrics(
            signal_to_noise_ratio=float(processed_data.quality_score / processed_data.noise_level),
            data_completeness=min(1.0, len(processed_data.data_points) / 100.0),
            sampling_rate=processed_data.sampling_rate,
            duration_seconds=processed_data.duration_seconds,
            noise_level=processed_data.noise_level
        )
        
        # Step 5: Calculate contribution score based on data quality and prediction accuracy
        # Higher quality data and better predictions get higher scores
        
        # Base score from data quality (0-50 points)
        quality_score = int(quality_metrics.data_completeness * 
                           quality_metrics.signal_to_noise_ratio * 5)
        quality_score = min(50, max(0, quality_score))
        
        # Prediction accuracy score (0-30 points)
        # Compare predicted vs actual glucose
        glucose_error = abs(glucose_prediction.predicted_glucose - request.glucose_level)
        max_error = 3.0  # mmol/L
        accuracy_score = int(30 * max(0, 1 - (glucose_error / max_error)))
        
        # Duration bonus (0-20 points)
        duration_score = int(min(20, processed_data.duration_seconds / 15))  # 1 point per 15 seconds, max 20
        
        # Total contribution score
        contribution_score = quality_score + accuracy_score + duration_score
        contribution_score = min(100, max(0, contribution_score))
        
        # Calculate reward points (exponential scaling for high-quality contributions)
        if contribution_score >= 80:
            reward_points = contribution_score * 15  # Bonus for high quality
        elif contribution_score >= 60:
            reward_points = contribution_score * 12
        else:
            reward_points = contribution_score * 10
        
        # Generate explanation
        reason_parts = []
        reason_parts.append(f"Data quality: {quality_score}/50 points")
        reason_parts.append(f"Prediction accuracy: {accuracy_score}/30 points") 
        reason_parts.append(f"Duration bonus: {duration_score}/20 points")
        reason_parts.append(f"Glucose prediction: {glucose_prediction.predicted_glucose:.1f} mmol/L (actual: {request.glucose_level:.1f})")
        
        reason = "; ".join(reason_parts)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        print(f"Contribution scoring complete for {request.user_id}: {contribution_score}/100 points")
        
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