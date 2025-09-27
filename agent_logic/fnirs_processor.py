"""
fNIRS Data Processing Module

Adapted from memes_glucose.py to work with local data files and integrate
with the ML pipeline infrastructure.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
import joblib
from typing import Tuple, Dict, List, Optional
from dataclasses import dataclass

# Required imports for ML
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# ==============================================================================
# --- Configuration for Local Data ---
# ==============================================================================

# --- Local File Paths ---
BASE_DATA_PATH = "../eigen_blood"
S1_FNIRS_PATH = f"{BASE_DATA_PATH}/first_session/first_fnirs_log.csv"
S1_CGM_PATH = f"{BASE_DATA_PATH}/first_session/first_cgm_log.csv"
S1_CGM_COLUMN = 'Scan Glucose (mmol/L)'

S2_FNIRS_PATH = f"{BASE_DATA_PATH}/second_session/second_fnirs_log.csv"
S2_CGM_PATH = f"{BASE_DATA_PATH}/second_session/second_cgm_log.csv"
S2_CGM_COLUMN = 'Scan Glucose (mmol/L)'

# --- ML & Processing Constants ---
SMOOTHING_WINDOW = 30
EPOCH_DURATION_S = 60
EPOCH_OVERLAP_RATIO = 0.5
N_FEATURES_TO_SELECT = 40
N_CV_SPLITS = 5
CV_GAP_EPOCHS = 2

# --- fNIRS Channel Configuration ---
USABLE_CHANNELS = [
    (2,5,'short'),(3,6,'short'),(6,12,'short'),(7,13,'short'),
    (1,2,'long'),(1,6,'long'),(1,9,'long'),(2,6,'long'),(2,7,'long'),
    (3,5,'long'),(3,7,'long'),(4,2,'long'),(4,5,'long'),(4,6,'long'),
    (4,7,'long'),(5,6,'long'),(5,9,'long'),(5,12,'long'),(6,3,'long'),
    (6,5,'long'),(6,13,'long'),(7,3,'long'),(7,9,'long'),(7,12,'long'),
    (8,2,'long'),(8,3,'long'),(8,11,'long'),(8,13,'long'),
]

# --- Optical Properties Constants ---
DPF_WL1 = 6.25  # Differential pathlength factor for 740nm
DPF_WL2 = 4.89  # Differential pathlength factor for 850nm
D_SHORT_CM = 0.8  # Short separation distance in cm
D_LONG_CM = 3.0   # Long separation distance in cm
LN10 = np.log(10)

# Extinction coefficients (molar)
EXT_MOLAR_HBO_WL1 = 803.1 / LN10
EXT_MOLAR_HHB_WL1 = 2278.1 / LN10
EXT_MOLAR_HBO_WL2 = 1058.0 / LN10
EXT_MOLAR_HHB_WL2 = 740.0 / LN10

# Convert to micromolar
EPS_HBO_WL1_uM = EXT_MOLAR_HBO_WL1 / 1.0e6
EPS_HHB_WL1_uM = EXT_MOLAR_HHB_WL1 / 1.0e6
EPS_HBO_WL2_uM = EXT_MOLAR_HBO_WL2 / 1.0e6
EPS_HHB_WL2_uM = EXT_MOLAR_HHB_WL2 / 1.0e6

# Extinction coefficient matrix
E_MATRIX_uM = np.array([
    [EPS_HBO_WL1_uM, EPS_HHB_WL1_uM],
    [EPS_HBO_WL2_uM, EPS_HHB_WL2_uM]
])

try:
    E_INV_MATRIX_uM = np.linalg.inv(E_MATRIX_uM)
except np.linalg.LinAlgError:
    raise RuntimeError("FATAL ERROR: Extinction coefficient matrix is singular.")

# ==============================================================================
# --- Data Classes ---
# ==============================================================================

@dataclass
class ProcessingResult:
    """Result of fNIRS data processing"""
    X: pd.DataFrame  # Feature matrix
    y: np.ndarray   # Target glucose values
    sampling_rate: float
    n_epochs: int
    feature_names: List[str]

@dataclass
class ModelPerformance:
    """Model performance metrics"""
    rmse: float
    mae: float
    r2: float
    predictions: np.ndarray
    true_values: np.ndarray

# ==============================================================================
# --- Helper Functions ---
# ==============================================================================

class BlockedKFold:
    """Custom cross-validation that respects temporal structure"""
    def __init__(self, n_splits=5, gap=0):
        self.n_splits = n_splits
        self.gap = gap
    
    def split(self, X, y=None, groups=None):
        n = len(X)
        k_size = n // self.n_splits
        ids = np.arange(n)
        
        for i in range(self.n_splits):
            start, end = i * k_size, (i + 1) * k_size
            test = ids[start:end]
            
            train_before = ids[0:max(0, start - self.gap)]
            train_after = ids[min(n, end + self.gap):n]
            train = np.concatenate([train_before, train_after])
            
            yield train, test

def plot_clarke_error_grid(y_true_mmol: np.ndarray, y_pred_mmol: np.ndarray, 
                          title: str, save_path: Optional[str] = None) -> Dict[str, int]:
    """
    Plot Clarke Error Grid for glucose prediction evaluation
    
    Args:
        y_true_mmol: True glucose values in mmol/L
        y_pred_mmol: Predicted glucose values in mmol/L
        title: Plot title
        save_path: Optional path to save the plot
        
    Returns:
        Dictionary with zone counts
    """
    # Convert to mg/dL for Clarke grid
    y_true = np.array(y_true_mmol) * 18.0182
    y_pred = np.array(y_pred_mmol) * 18.0182
    
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.scatter(y_true, y_pred, c='k', s=25, zorder=2)
    
    # Formatting
    ax.set_xlabel("Reference Glucose (mg/dL)", fontsize=14)
    ax.set_ylabel("Predicted Glucose (mg/dL)", fontsize=14)
    ax.set_title(title, fontsize=16)
    ax.set_xticks(range(0, 401, 50))
    ax.set_yticks(range(0, 401, 50))
    ax.set_xlim(0, 400)
    ax.set_ylim(0, 400)
    ax.set_facecolor('whitesmoke')
    ax.grid(True, linestyle='--', color='lightgray')
    ax.set_aspect('equal', adjustable='box')
    
    # Perfect prediction line
    x = np.arange(0, 401)
    ax.plot(x, x, 'k-', lw=1.5, zorder=1)
    
    # Zone boundaries
    ax.plot([0, 400], [70, 70], 'k--')
    ax.plot([70, 70], [0, 400], 'k--')
    ax.plot([0, 400], [180, 180], 'k--')
    ax.plot([180, 180], [0, 400], 'k--')
    
    # Calculate zone counts
    zone_counts = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0}
    total_points = len(y_true)
    
    for true, pred in zip(y_true, y_pred):
        if (abs(true - pred) / true < 0.2) or (true < 70 and pred < 70):
            zone_counts['A'] += 1
        elif (true >= 70 and pred <= 50) or (true <= 70 and pred >= 180):
            zone_counts['D'] += 1
        elif (true > 180 and pred < 70) or (true < 70 and pred > 180):
            zone_counts['E'] += 1
        else:
            zone_counts['B'] += 1
    
    # Print zone analysis
    print("\n--- Clarke Error Grid Analysis ---")
    if total_points > 0:
        for zone, count in zone_counts.items():
            percentage = (count / total_points) * 100
            print(f"  Zone {zone}: {count}/{total_points} ({percentage:.2f}%)")
    
    if save_path:
        fig.savefig(save_path, dpi=150, bbox_inches='tight')
    
    plt.show()
    return zone_counts

# ==============================================================================
# --- Core Processing Functions ---
# ==============================================================================

def preprocess_and_feature_engineer(fnirs_path: str, cgm_path: str, 
                                  cgm_column: str) -> ProcessingResult:
    """
    Process fNIRS and CGM data to extract features for ML
    
    Args:
        fnirs_path: Path to fNIRS CSV file
        cgm_path: Path to CGM CSV file  
        cgm_column: Column name for glucose values
        
    Returns:
        ProcessingResult with features and targets
    """
    print(f"Processing fNIRS data from: {fnirs_path}")
    print(f"Processing CGM data from: {cgm_path}")
    
    # Load and clean data
    df_fnirs = pd.read_csv(fnirs_path)
    df_fnirs.columns = df_fnirs.columns.str.strip()
    
    df_cgm = pd.read_csv(cgm_path)
    df_cgm.columns = df_cgm.columns.str.strip()
    
    # Process CGM timestamps
    df_cgm['datetime'] = pd.to_datetime(df_cgm['Device Timestamp'], dayfirst=True)
    df_cgm = df_cgm.sort_values(by='datetime').reset_index(drop=True)
    
    # Convert to relative time in seconds
    first_cgm_time = df_cgm['datetime'].iloc[0]
    df_cgm['Time_sec'] = (df_cgm['datetime'] - first_cgm_time).dt.total_seconds()
    
    # Interpolate glucose values to fNIRS timepoints
    df_fnirs['glucose'] = np.interp(
        x=df_fnirs['Time'], 
        xp=df_cgm['Time_sec'], 
        fp=df_cgm[cgm_column]
    )
    
    # Process each fNIRS channel
    processed_channels = 0
    for s, d, ctype in USABLE_CHANNELS:
        # Determine channel configuration
        pmode = 'LP' if ctype == 'short' else 'RP'
        dval = D_SHORT_CM if ctype == 'short' else D_LONG_CM
        
        # Column names
        cid = f"S{s}_D{d}_{pmode}"
        c740 = f'S{s}_D{d}_740nm_{pmode}'
        c850 = f'S{s}_D{d}_850nm_{pmode}'
        
        # Check if columns exist
        if c740 not in df_fnirs.columns or c850 not in df_fnirs.columns:
            continue
            
        # Calculate optical density changes
        od740 = -np.log10(np.maximum(
            df_fnirs[c740] / np.nanmean(df_fnirs[c740]), 1e-9
        ))
        od850 = -np.log10(np.maximum(
            df_fnirs[c850] / np.nanmean(df_fnirs[c850]), 1e-9
        ))
        
        # Convert to hemoglobin concentrations using modified Beer-Lambert law
        od_matrix = np.vstack((
            od740 / (dval * DPF_WL1),
            od850 / (dval * DPF_WL2)
        ))
        
        hbo, hbr = E_INV_MATRIX_uM @ od_matrix
        
        # Apply smoothing
        df_fnirs[f'{cid}_dHbO_s'] = pd.Series(hbo).rolling(
            SMOOTHING_WINDOW, center=True, min_periods=1
        ).mean()
        df_fnirs[f'{cid}_dHbR_s'] = pd.Series(hbr).rolling(
            SMOOTHING_WINDOW, center=True, min_periods=1
        ).mean()
        
        processed_channels += 1
    
    print(f"Successfully processed {processed_channels} fNIRS channels")
    
    # Extract hemoglobin columns
    hb_cols = [c for c in df_fnirs.columns if '_dHb' in c and '_s' in c]
    print(f"Found {len(hb_cols)} hemoglobin signal columns")
    
    # Calculate sampling rate
    sampling_rate = 1 / df_fnirs['Time'].diff().mean()
    print(f"Detected sampling rate: {sampling_rate:.2f} Hz")
    
    # Epoch-based feature extraction
    samples_per_epoch = int(EPOCH_DURATION_S * sampling_rate)
    step_size = int(samples_per_epoch * (1 - EPOCH_OVERLAP_RATIO))
    
    epochs = []
    labels = []
    
    for i in range(0, len(df_fnirs) - samples_per_epoch + 1, step_size):
        epoch_df = df_fnirs.iloc[i:i + samples_per_epoch]
        features = {}
        
        # Extract statistical features for each hemoglobin signal
        for col in hb_cols:
            signal = epoch_df[col].dropna()
            if len(signal) > 0:
                features.update({
                    f'{col}_mean': signal.mean(),
                    f'{col}_std': signal.std(),
                    f'{col}_skew': signal.skew(),
                    f'{col}_kurtosis': signal.kurtosis(),
                    f'{col}_max_minus_min': signal.max() - signal.min()
                })
        
        epochs.append(features)
        labels.append(epoch_df['glucose'].mean())
    
    # Convert to DataFrame and clean
    X = pd.DataFrame(epochs)
    y = np.array(labels)
    
    # Remove columns with all NaN values
    X.dropna(axis=1, how='all', inplace=True)
    
    # Fill remaining NaN values with column means
    X.fillna(X.mean(), inplace=True)
    
    print(f"Extracted {len(epochs)} epochs with {X.shape[1]} features each")
    
    return ProcessingResult(
        X=X,
        y=y,
        sampling_rate=sampling_rate,
        n_epochs=len(epochs),
        feature_names=list(X.columns)
    )

def train_glucose_model(X_train: pd.DataFrame, y_train: np.ndarray, 
                       model_type: str = "RandomForest") -> Pipeline:
    """
    Train a glucose prediction model
    
    Args:
        X_train: Training features
        y_train: Training targets
        model_type: Type of model to train
        
    Returns:
        Trained sklearn Pipeline
    """
    models = {
        "Ridge": Ridge(alpha=10),
        "RandomForest": RandomForestRegressor(
            n_estimators=100, random_state=42, n_jobs=-1
        )
    }
    
    if model_type not in models:
        raise ValueError(f"Unknown model type: {model_type}")
    
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('selector', SelectKBest(
            f_regression, 
            k=min(N_FEATURES_TO_SELECT, X_train.shape[1])
        )),
        ('regressor', models[model_type])
    ])
    
    print(f"Training {model_type} model...")
    pipeline.fit(X_train, y_train)
    print("Model training complete")
    
    return pipeline

def evaluate_model(model: Pipeline, X_test: pd.DataFrame, 
                  y_test: np.ndarray) -> ModelPerformance:
    """
    Evaluate model performance
    
    Args:
        model: Trained model
        X_test: Test features
        y_test: Test targets
        
    Returns:
        ModelPerformance object with metrics
    """
    y_pred = model.predict(X_test)
    
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    return ModelPerformance(
        rmse=rmse,
        mae=mae,
        r2=r2,
        predictions=y_pred,
        true_values=y_test
    )

# ==============================================================================
# --- Main Processing Functions ---
# ==============================================================================

def process_session_data(session_name: str, fnirs_path: str, cgm_path: str, 
                        cgm_column: str) -> ProcessingResult:
    """
    Process a single session's data
    
    Args:
        session_name: Name of the session for logging
        fnirs_path: Path to fNIRS data
        cgm_path: Path to CGM data
        cgm_column: CGM glucose column name
        
    Returns:
        ProcessingResult with extracted features
    """
    print(f"\n{'='*60}")
    print(f"Processing {session_name}")
    print(f"{'='*60}")
    
    if not os.path.exists(fnirs_path):
        raise FileNotFoundError(f"fNIRS file not found: {fnirs_path}")
    if not os.path.exists(cgm_path):
        raise FileNotFoundError(f"CGM file not found: {cgm_path}")
    
    result = preprocess_and_feature_engineer(fnirs_path, cgm_path, cgm_column)
    
    print(f"Session {session_name} processing complete:")
    print(f"  - {result.n_epochs} epochs extracted")
    print(f"  - {len(result.feature_names)} features per epoch")
    print(f"  - Sampling rate: {result.sampling_rate:.2f} Hz")
    
    return result

def run_cross_session_experiment(train_session: ProcessingResult, 
                                test_session: ProcessingResult,
                                experiment_name: str) -> ModelPerformance:
    """
    Run cross-session generalization experiment
    
    Args:
        train_session: Training session data
        test_session: Test session data
        experiment_name: Name for the experiment
        
    Returns:
        ModelPerformance on test session
    """
    print(f"\n{'='*60}")
    print(f"Running experiment: {experiment_name}")
    print(f"{'='*60}")
    
    # Train model
    model = train_glucose_model(train_session.X, train_session.y)
    
    # Evaluate on test session
    performance = evaluate_model(model, test_session.X, test_session.y)
    
    print(f"\nCross-session performance ({experiment_name}):")
    print(f"  RMSE: {performance.rmse:.3f} mmol/L")
    print(f"  MAE:  {performance.mae:.3f} mmol/L")
    print(f"  R²:   {performance.r2:.3f}")
    
    return performance

if __name__ == "__main__":
    print("fNIRS Glucose Prediction Pipeline")
    print("=" * 50)
    
    # Check if data files exist
    data_files = [S1_FNIRS_PATH, S1_CGM_PATH, S2_FNIRS_PATH, S2_CGM_PATH]
    missing_files = [f for f in data_files if not os.path.exists(f)]
    
    if missing_files:
        print("Missing data files:")
        for f in missing_files:
            print(f"  - {f}")
        print("\nPlease ensure all data files are available.")
    else:
        print("All data files found. Ready for processing.")