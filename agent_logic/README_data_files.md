# Data File Management for GitHub

This directory contains large fNIRS data files that have been split for GitHub compatibility.

## File Structure

### Original Large Files (Removed)
- `first_fnirs_log.csv` (101MB) - **REMOVED** 
- `second_fnirs_log.csv` (132MB) - **REMOVED**

### Split Files (GitHub Compatible)
**First Session fNIRS (101MB → 5 parts):**
- `first_fnirs_log_part01.csv` (20.2MB)
- `first_fnirs_log_part02.csv` (20.2MB)
- `first_fnirs_log_part03.csv` (20.2MB)
- `first_fnirs_log_part04.csv` (20.2MB)
- `first_fnirs_log_part05.csv` (20.2MB)

**Second Session fNIRS (132MB → 6 parts):**
- `second_fnirs_log_part01.csv` (22.0MB)
- `second_fnirs_log_part02.csv` (22.0MB)
- `second_fnirs_log_part03.csv` (22.0MB)
- `second_fnirs_log_part04.csv` (22.0MB)
- `second_fnirs_log_part05.csv` (22.0MB)
- `second_fnirs_log_part06.csv` (22.0MB)

### Small Files (Unchanged)
- `first_cgm_log.csv` (228 bytes)
- `second_cgm_log.csv` (123 bytes)
- `freelibre_readings_glucose.csv` (15KB)

## Automatic File Management

The ML pipeline automatically handles file merging:

1. **DataFileManager** detects when original files are missing
2. Automatically merges split files into temporary directory
3. ML processing uses merged files transparently
4. Temporary files are cleaned up after processing

## Usage

### For ML Processing
```python
# Just use normal file paths - merging happens automatically
from glucose_ml_processor import preprocess_and_feature_engineer

result = preprocess_and_feature_engineer(
    "eigen_blood/first_session/first_fnirs_log.csv",  # Will be auto-merged
    "eigen_blood/first_session/first_cgm_log.csv",
    "Scan Glucose (mmol/L)"
)
```

### Manual File Operations
```bash
# Split large files for GitHub
python data_file_manager.py split

# Test file operations
python data_file_manager.py test

# Prepare for GitHub (remove originals)
python prepare_for_github.py

# Restore originals from splits (for development)
python prepare_for_github.py restore
```

## File Manifest

See `file_manifest.txt` for complete file inventory with checksums.

## Benefits

✅ **GitHub Compatible**: All files under 25MB (well under GitHub's 50MB warning)  
✅ **Transparent**: ML code works without changes  
✅ **Automatic**: No manual file management needed  
✅ **Verified**: Complete ML pipeline tested and working  
✅ **Integrity**: File checksums ensure data integrity