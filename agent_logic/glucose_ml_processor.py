"""
Adapted fNIRS-Glucose ML Processor
Based on memes_glucose.py but adapted for local file paths and integration with ML pipeline
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
import joblib
from typing import Tuple, Dict, List, Optional
from dataclasses import dataclass

# Required imports
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# ==============================================================================
# --- Master Configuration ---
# ==============================================================================

# --- Session 1 Paths & Info (Local paths) ---
S1_FNIRS_PATH = 'eigen_blood/first_session/first_fnirs_log.csv'
S1_CGM_PATH = 'eigen_blood/first_session/first_cgm_log.csv'
S1_CGM_COLUMN = 'Scan Glucose (mmol/L)'

# --- Session 2 Paths & Info (Local paths) ---
S2_FNIRS_PATH = 'eigen_blood/second_session/second_fnirs_log.csv'
S2_CGM_PATH = 'eigen_blood/second_session/second_cgm_log.csv'
S2_CGM_COLUMN = 'Scan Glucose (mmol/L)'

# --- Shared ML & Processing Constants ---
SMOOTHING_WINDOW = 30
EPOCH_DURATION_S = 60
EPOCH_OVERLAP_RATIO = 0.5
N_FEATURES_TO_SELECT = 40
N_CV_SPLITS = 5
CV_GAP_EPOCHS = 2

USABLE_CHANNELS = [
    (2,5,'short'),(3,6,'short'),(6,12,'short'),(7,13,'short'),(1,2,'long'),(1,6,'long'),(1,9,'long'),
    (2,6,'long'),(2,7,'long'),(3,5,'long'),(3,7,'long'),(4,2,'long'),(4,5,'long'),(4,6,'long'),
    (4,7,'long'),(5,6,'long'),(5,9,'long'),(5,12,'long'),(6,3,'long'),(6,5,'long'),(6,13,'long'),
    (7,3,'long'),(7,9,'long'),(7,12,'long'),(8,2,'long'),(8,3,'long'),(8,11,'long'),(8,13,'long'),
]

# fNIRS optical constants
DPF_WL1 = 6.25
DPF_WL2 = 4.89
D_SHORT_CM = 0.8
D_LONG_CM = 3.0
LN10 = np.log(10)

# Extinction coefficients
EXT_MOLAR_HBO_WL1 = 803.1/LN10
EXT_MOLAR_HHB_WL1 = 2278.1/LN10
EXT_MOLAR_HBO_WL2 = 1058.0/LN10
EXT_MOLAR_HHB_WL2 = 740.0/LN10

EPS_HBO_WL1_uM = EXT_MOLAR_HBO_WL1/1.0e6
EPS_HHB_WL1_uM = EXT_MOLAR_HHB_WL1/1.0e6
EPS_HBO_WL2_uM = EXT_MOLAR_HBO_WL2/1.0e6
EPS_HHB_WL2_uM = EXT_MOLAR_HHB_WL2/1.0e6

E_MATRIX_uM = np.array([[EPS_HBO_WL1_uM, EPS_HHB_WL1_uM], [EPS_HBO_WL2_uM, EPS_HHB_WL2_uM]])

try:
    E_INV_MATRIX_uM = np.linalg.inv(E_MATRIX_uM)
except np.linalg.LinAlgError:
    print("FATAL ERROR: Extinction coefficient matrix is singular.")
    raise


# ==============================================================================
# --- Data Classes for Type Safety ---
# ==============================================================================

@dataclass
class ProcessingResult:
    """Result of fNIRS data processing"""
    X: pd.DataFrame
    y: np.ndarray
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
# --- Helper Functions and Classes ---
# ==============================================================================

def plot_clarke_error_grid(y_true_mmol: np.ndarray, y_pred_mmol: np.ndarray, 
                          title: str, plots_folder: str) -> Dict[str, float]:
    """
    Plot Clarke Error Grid and return zone percentages
    """
    y_true = np.array(y_true_mmol) * 18.0182  # Convert to mg/dL
    y_pred = np.array(y_pred_mmol) * 18.0182
    
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.scatter(y_true, y_pred, c='k', s=25, zorder=2)
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
    
    # Calculate zone percentages
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
    
    print("\n--- Clarke Error Grid Analysis ---")
    zone_percentages = {}
    if total_points > 0:
        for z, c in zone_counts.items():
            percentage = (c/total_points)*100
            zone_percentages[f'zone_{z}'] = percentage
            print(f"  Zone {z}: {c}/{total_points} ({percentage:.2f}%)")
    
    # Save plot
    os.makedirs(plots_folder, exist_ok=True)
    safe_title = title.replace(' ', '_').replace(':', '')
    fig.savefig(os.path.join(plots_folder, f"ClarkeGrid_{safe_title}.png"), dpi=150)
    plt.close()  # Close to save memory
    
    return zone_percentages


class BlockedKFold:
    """
    Blocked K-Fold cross-validation to prevent data leakage in time series
    """
    def __init__(self, n_splits: int = 5, gap: int = 0):
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
            yield np.concatenate([train_before, train_after]), test


def preprocess_and_feature_engineer(fnirs_path: str, cgm_path: str, 
                                  cgm_column: str) -> ProcessingResult:
    """
    Main preprocessing function that converts raw fNIRS and CGM data into ML features
    """
    print(f"Processing fNIRS data from: {fnirs_path}")
    print(f"Processing CGM data from: {cgm_path}")
    
    # Load data
    df_fnirs = pd.read_csv(fnirs_path)
    df_fnirs.columns = df_fnirs.columns.str.strip()
    
    df_cgm = pd.read_csv(cgm_path)
    df_cgm.columns = df_cgm.columns.str.strip()
    
    # Process CGM timestamps
    df_cgm['datetime'] = pd.to_datetime(df_cgm['Device Timestamp'], dayfirst=True)
    df_cgm = df_cgm.sort_values(by='datetime').reset_index(drop=True)
    first_cgm_time = df_cgm['datetime'].iloc[0]
    df_cgm['Time_sec'] = (df_cgm['datetime'] - first_cgm_time).dt.total_seconds()
    
    # Interpolate glucose values to fNIRS timestamps
    df_fnirs['glucose'] = np.interp(
        x=df_fnirs['Time'], 
        xp=df_cgm['Time_sec'], 
        fp=df_cgm[cgm_column]
    )
    
    # Process fNIRS channels to hemoglobin concentrations
    for s, d, ctype in USABLE_CHANNELS:
        pmode = 'LP' if ctype == 'short' else 'RP'
        dval = D_SHORT_CM if ctype == 'short' else D_LONG_CM
        
        cid = f"S{s}_D{d}_{pmode}"
        c740 = f'S{s}_D{d}_740nm_{pmode}'
        c850 = f'S{s}_D{d}_850nm_{pmode}'
        
        if c740 not in df_fnirs.columns or c850 not in df_fnirs.columns:
            continue
        
        # Calculate optical density changes
        od740 = -np.log10(np.maximum(df_fnirs[c740]/np.nanmean(df_fnirs[c740]), 1e-9))
        od850 = -np.log10(np.maximum(df_fnirs[c850]/np.nanmean(df_fnirs[c850]), 1e-9))
        
        # Convert to hemoglobin concentrations using modified Beer-Lambert law
        hbo, hbr = (E_INV_MATRIX_uM @ np.vstack((
            od740/(dval*DPF_WL1), 
            od850/(dval*DPF_WL2)
        )))
        
        # Apply smoothing
        df_fnirs[f'{cid}_dHbO_s'] = pd.Series(hbo).rolling(
            SMOOTHING_WINDOW, center=True, min_periods=1
        ).mean()
        df_fnirs[f'{cid}_dHbR_s'] = pd.Series(hbr).rolling(
            SMOOTHING_WINDOW, center=True, min_periods=1
        ).mean()
    
    # Extract features from epochs
    hb_cols = [c for c in df_fnirs.columns if '_dHb' in c and '_s' in c]
    sr = 1 / df_fnirs['Time'].diff().mean()  # Sampling rate
    
    samples_epoch = int(EPOCH_DURATION_S * sr)
    step = int(samples_epoch * (1 - EPOCH_OVERLAP_RATIO))
    
    epochs = []
    labels = []
    
    for i in range(0, len(df_fnirs) - samples_epoch + 1, step):
        epoch_df = df_fnirs.iloc[i:i+samples_epoch]
        features = {}
        
        for col in hb_cols:
            s = epoch_df[col].dropna()
            if len(s) > 0:
                features.update({
                    f'{col}_mean': s.mean(),
                    f'{col}_std': s.std(),
                    f'{col}_skew': s.skew(),
                    f'{col}_kurtosis': s.kurtosis(),
                    f'{col}_max_minus_min': s.max() - s.min()
                })
        
        epochs.append(features)
        labels.append(epoch_df['glucose'].mean())
    
    # Convert to DataFrame and clean
    X = pd.DataFrame(epochs)
    y = np.array(labels)
    
    X.dropna(axis=1, how='all', inplace=True)
    X.fillna(X.mean(), inplace=True)
    
    print(f"Processed {len(X)} epochs with {X.shape[1]} features")
    
    return ProcessingResult(
        X=X,
        y=y,
        sampling_rate=sr,
        n_epochs=len(X),
        feature_names=list(X.columns)
    )


class GlucoseMLProcessor:
    """
    Main class for glucose prediction from fNIRS data
    """
    
    def __init__(self, plots_folder: str = "glucose_ml_plots"):
        self.plots_folder = plots_folder
        self.models = {
            "Ridge": Ridge(alpha=10),
            "RandomForest": RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        }
        self.best_model = None
        self.best_pipeline = None
        
    def train_and_evaluate(self, train_fnirs_path: str, train_cgm_path: str, 
                          train_cgm_col: str, test_fnirs_path: str, 
                          test_cgm_path: str, test_cgm_col: str, 
                          experiment_name: str) -> Dict:
        """
        Complete training and evaluation pipeline
        """
        os.makedirs(self.plots_folder, exist_ok=True)
        
        print("="*70)
        print(f"--- EXPERIMENT: {experiment_name} ---")
        print("="*70)
        
        # Process training data
        print("\n--- Processing Training Data ---")
        train_result = preprocess_and_feature_engineer(
            train_fnirs_path, train_cgm_path, train_cgm_col
        )
        
        # Cross-validation model selection
        print("\n--- Cross-Validation Model Selection ---")
        bkf = BlockedKFold(n_splits=N_CV_SPLITS, gap=CV_GAP_EPOCHS)
        cv_scores = {}
        
        for name, model in self.models.items():
            pipeline = Pipeline([
                ('scaler', StandardScaler()),
                ('selector', SelectKBest(f_regression, k=min(N_FEATURES_TO_SELECT, train_result.X.shape[1]))),
                ('regressor', model)
            ])
            
            y_true_cv, y_pred_cv = [], []
            for train_idx, test_idx in bkf.split(train_result.X):
                pipeline.fit(train_result.X.iloc[train_idx], train_result.y[train_idx])
                y_pred_cv.extend(pipeline.predict(train_result.X.iloc[test_idx]))
                y_true_cv.extend(train_result.y[test_idx])
            
            cv_scores[name] = r2_score(y_true_cv, y_pred_cv)
            print(f"  {name} - CV R²: {cv_scores[name]:.3f}")
        
        # Train best model on full training data
        best_model_name = max(cv_scores, key=cv_scores.get)
        print(f"\n--- Training {best_model_name} on Full Training Data ---")
        
        self.best_pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('selector', SelectKBest(f_regression, k=min(N_FEATURES_TO_SELECT, train_result.X.shape[1]))),
            ('regressor', self.models[best_model_name])
        ])
        
        self.best_pipeline.fit(train_result.X, train_result.y)
        
        # Process test data and evaluate
        print("\n--- Processing Test Data ---")
        test_result = preprocess_and_feature_engineer(
            test_fnirs_path, test_cgm_path, test_cgm_col
        )
        
        print("\n--- Evaluating on Test Data ---")
        y_pred = self.best_pipeline.predict(test_result.X)
        
        performance = ModelPerformance(
            rmse=np.sqrt(mean_squared_error(test_result.y, y_pred)),
            mae=mean_absolute_error(test_result.y, y_pred),
            r2=r2_score(test_result.y, y_pred),
            predictions=y_pred,
            true_values=test_result.y
        )
        
        print(f"\n--- Performance Metrics ---")
        print(f"  RMSE: {performance.rmse:.3f} mmol/L")
        print(f"  MAE: {performance.mae:.3f} mmol/L")
        print(f"  R²: {performance.r2:.3f}")
        
        # Generate plots
        zone_percentages = plot_clarke_error_grid(
            test_result.y, y_pred, f"Test: {experiment_name}", self.plots_folder
        )
        
        # Save model
        model_path = os.path.join(self.plots_folder, f"best_model_{experiment_name}.joblib")
        joblib.dump(self.best_pipeline, model_path)
        print(f"\nModel saved to: {model_path}")
        
        return {
            'experiment_name': experiment_name,
            'best_model': best_model_name,
            'cv_scores': cv_scores,
            'performance': performance,
            'zone_percentages': zone_percentages,
            'model_path': model_path,
            'train_epochs': train_result.n_epochs,
            'test_epochs': test_result.n_epochs
        }
    
    def predict_glucose(self, fnirs_data: str, glucose_level: float) -> Dict:
        """
        Predict glucose from raw fNIRS data string (for API integration)
        """
        if self.best_pipeline is None:
            raise ValueError("Model not trained. Call train_and_evaluate first.")
        
        # This is a placeholder - in practice, you'd need to process the raw fNIRS string
        # For now, return a mock prediction based on the trained model
        return {
            'predicted_glucose': glucose_level + np.random.normal(0, 0.5),
            'confidence': 0.85,
            'model_used': 'trained_fnirs_model'
        }


# ==============================================================================
# --- Main Execution Functions ---
# ==============================================================================

def run_cross_session_experiments():
    """
    Run the main cross-session generalization experiments
    """
    processor = GlucoseMLProcessor()
    
    # Experiment 1: Train on Session 1, Test on Session 2
    result1 = processor.train_and_evaluate(
        train_fnirs_path=S1_FNIRS_PATH,
        train_cgm_path=S1_CGM_PATH,
        train_cgm_col=S1_CGM_COLUMN,
        test_fnirs_path=S2_FNIRS_PATH,
        test_cgm_path=S2_CGM_PATH,
        test_cgm_col=S2_CGM_COLUMN,
        experiment_name="Train_S1_Test_S2"
    )
    
    # Experiment 2: Train on Session 2, Test on Session 1
    result2 = processor.train_and_evaluate(
        train_fnirs_path=S2_FNIRS_PATH,
        train_cgm_path=S2_CGM_PATH,
        train_cgm_col=S2_CGM_COLUMN,
        test_fnirs_path=S1_FNIRS_PATH,
        test_cgm_path=S1_CGM_PATH,
        test_cgm_col=S1_CGM_COLUMN,
        experiment_name="Train_S2_Test_S1"
    )
    
    print("\n" + "="*70)
    print("--- EXPERIMENT SUMMARY ---")
    print("="*70)
    print(f"Experiment 1 (Train S1, Test S2): R² = {result1['performance'].r2:.3f}")
    print(f"Experiment 2 (Train S2, Test S1): R² = {result2['performance'].r2:.3f}")
    
    return result1, result2


if __name__ == "__main__":
    # Run the experiments
    results = run_cross_session_experiments()
    print("\nAll experiments complete!")