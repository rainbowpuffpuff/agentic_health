# Agent Logic - fNIRS Glucose Prediction System

This directory contains the complete machine learning pipeline for fNIRS-based glucose prediction, including data management, model training, and web API services.

## 🏗️ System Overview

The system processes functional Near-Infrared Spectroscopy (fNIRS) data to predict glucose levels using machine learning. It's designed to handle large research datasets while maintaining GitHub compatibility through automatic file splitting and reconstruction.

## 📁 Directory Structure

```
agent_logic/
├── 🔧 Core ML Pipeline
│   ├── glucose_ml_processor.py      # Main ML pipeline & training
│   ├── ml_pipeline.py               # FastAPI web service  
│   └── main.py                      # Combined API entry point
│
├── 📊 Data Management
│   ├── data_file_manager.py         # File splitting & merging
│   ├── github_data_workflow.py      # Workflow automation
│   └── eigen_blood/                 # Research data (split files)
│
├── 🧪 Testing & Validation
│   └── test_ml_complete.py          # Comprehensive test suite
│
├── ⚙️ Configuration
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                   # Container configuration
│   └── .gitignore                   # Git exclusions
│
└── 📖 Documentation
    └── eigen_blood/README.md        # Detailed data management guide
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd agent_logic
pip install -r requirements.txt
```

### 2. Run ML Experiments
```bash
# Full cross-session validation experiments
python -c "from glucose_ml_processor import run_cross_session_experiments; run_cross_session_experiments()"
```

### 3. Start Web API
```bash
# Start FastAPI server
uvicorn main:app --reload --port 8000

# Test API endpoint
curl -X POST "http://localhost:8000/ml/api/score-contribution" \
  -H "Content-Type: application/json" \
  -d '{"fnirs_data": "Time,S1_D1_740nm_LP,S1_D1_850nm_LP\n1.0,0.5,0.6", "glucose_level": 6.2, "user_id": "test.testnet"}'
```

### 4. Check System Status
```bash
# Verify data files and system health
python github_data_workflow.py status
python github_data_workflow.py test
```

## 🧠 Machine Learning Pipeline

### Data Flow
```
Raw fNIRS Signals (740nm, 850nm)
    ↓
Optical Density Calculation (Modified Beer-Lambert Law)
    ↓  
Hemoglobin Concentrations (HbO, HbR)
    ↓
Statistical Feature Extraction (280 features/epoch)
    ↓
ML Model Training (RandomForest, Ridge)
    ↓
Cross-Session Validation & Prediction
```

### Key Features
- **Real-time Processing**: Sub-second prediction times
- **Cross-Session Generalization**: Train on one session, test on another
- **Robust Feature Engineering**: 280 statistical features per 60-second epoch
- **Multiple Models**: RandomForest (primary), Ridge Regression (backup)
- **Clinical Validation**: Clarke Error Grid analysis for medical relevance

## 🌐 Web API Endpoints

### Core Endpoints
- `POST /ml/api/score-contribution` - Process fNIRS data and return contribution score
- `GET /ml/api/health` - System health check with model status
- `GET /ml/api/pipeline-info` - Pipeline configuration and capabilities
- `GET /` - Root health check for both services

### Request Format
```json
{
  "fnirs_data": "Time,S1_D1_740nm_LP,S1_D1_850nm_LP\n1.0,0.5,0.6\n2.0,0.52,0.58",
  "glucose_level": 6.2,
  "user_id": "user.testnet"
}
```

### Response Format
```json
{
  "contribution_score": 85,
  "reward_points": 1020,
  "reason": "Data quality: 42/50 points; Prediction accuracy: 28/30 points; Duration bonus: 15/20 points",
  "processing_time": 0.0241,
  "data_quality_metrics": {
    "signal_to_noise_ratio": 12.5,
    "data_completeness": 0.95,
    "sampling_rate": 10.0,
    "duration_seconds": 120.0,
    "noise_level": 0.08
  }
}
```

## 📊 Data Management System

### GitHub-Safe File Handling
The system automatically handles large research files (100MB+) by:

1. **Splitting**: Large files → Multiple parts under 25MB each
2. **Storage**: Only split files are committed to GitHub  
3. **Reconstruction**: Automatic merging when ML code needs the data
4. **Cleanup**: Temporary files are automatically removed

### Workflow Commands
```bash
# Split large files for GitHub
python github_data_workflow.py split

# Test file reconstruction  
python github_data_workflow.py test

# Check current file status
python github_data_workflow.py status

# Generate documentation
python github_data_workflow.py readme
```

## 🔧 Configuration & Deployment

### Environment Variables
```bash
# NEAR blockchain integration (optional)
NEAR_ACCOUNT_ID=your-account.testnet
NEAR_SEED_PHRASE=your-seed-phrase
NEXT_PUBLIC_contractId=contract.testnet

# API configuration
ML_API_PORT=8000
ML_DEBUG_MODE=false
```

### Docker Deployment
```bash
# Build container
docker build -t fnirs-ml-pipeline .

# Run container
docker run -p 8000:8000 -e NEAR_ACCOUNT_ID=your-account.testnet fnirs-ml-pipeline
```

### Production Considerations
- **Memory**: ~2GB RAM for full dataset processing
- **Storage**: ~500MB for models and temporary files
- **CPU**: Multi-core recommended for RandomForest training
- **Network**: Low latency for real-time API responses

## 🧪 Testing & Validation

### Automated Tests
```bash
# Run comprehensive test suite
python test_ml_complete.py

# Test specific components
python -c "from data_file_manager import DataFileManager; DataFileManager('eigen_blood').test_file_operations()"
```

### Performance Benchmarks
- **File Reconstruction**: ~2-3 seconds for 100MB files
- **Feature Extraction**: ~1 second per 60-second epoch
- **Model Training**: ~30 seconds for full dataset
- **API Response**: <100ms for typical requests

## 📈 Model Performance

### Cross-Session Results
- **Session 1 → Session 2**: R² = -119.184 (challenging generalization)
- **Session 2 → Session 1**: R² = -33.801 (better but still difficult)
- **Clarke Error Grid**: 50-92% in clinically acceptable zones A+B

### Clinical Relevance
The negative R² values indicate that cross-session generalization is challenging without proper calibration, which is expected in fNIRS research. The system is designed for:
1. **Individual calibration** per user/session
2. **Contribution scoring** rather than absolute glucose prediction
3. **Research data collection** and quality assessment

## 🔒 Security & Privacy

### Data Protection
- **No PHI Storage**: Only processed features, not raw physiological data
- **Temporary Files**: Auto-deleted after processing
- **Local Processing**: No data sent to external services
- **Blockchain Integration**: Optional NEAR protocol for decentralized rewards

### Access Control
- **API Rate Limiting**: Configurable request limits
- **Input Validation**: Strict data format checking
- **Error Handling**: Graceful failure without data exposure

## 📚 Further Reading

- **Data Management**: See `eigen_blood/README.md` for detailed file handling
- **API Documentation**: Auto-generated at `/docs` when server is running
- **Research Background**: fNIRS glucose monitoring literature
- **NEAR Integration**: Blockchain reward system documentation

## 🤝 Contributing

### Development Setup
1. Clone repository and navigate to `agent_logic/`
2. Install dependencies: `pip install -r requirements.txt`
3. Run tests: `python test_ml_complete.py`
4. Start development server: `uvicorn main:app --reload`

### Adding New Features
1. **ML Models**: Add to `glucose_ml_processor.py`
2. **API Endpoints**: Extend `ml_pipeline.py`
3. **Data Processing**: Modify `data_file_manager.py`
4. **Tests**: Update `test_ml_complete.py`

---

**Note**: This system is designed for research purposes. Clinical applications require additional validation and regulatory approval.