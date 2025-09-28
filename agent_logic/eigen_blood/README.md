# Data Files Management

This directory contains research data that has been split for GitHub compatibility.

## File Structure

### Original Large Files (NOT in GitHub)
- `first_session/first_fnirs_log.csv` (~101MB) - Split into 5 parts
- `second_session/second_fnirs_log.csv` (~132MB) - Split into 6 parts

### Split Files (IN GitHub)
**First Session fNIRS (101MB → 5 parts of ~20MB each):**
- `first_session/first_fnirs_log_part01.csv` (20.2MB)
- `first_session/first_fnirs_log_part02.csv` (20.2MB)
- `first_session/first_fnirs_log_part03.csv` (20.2MB)
- `first_session/first_fnirs_log_part04.csv` (20.2MB)
- `first_session/first_fnirs_log_part05.csv` (20.2MB)

**Second Session fNIRS (132MB → 6 parts of ~22MB each):**
- `second_session/second_fnirs_log_part01.csv` (22.0MB)
- `second_session/second_fnirs_log_part02.csv` (22.0MB)
- `second_session/second_fnirs_log_part03.csv` (22.0MB)
- `second_session/second_fnirs_log_part04.csv` (22.0MB)
- `second_session/second_fnirs_log_part05.csv` (22.0MB)
- `second_session/second_fnirs_log_part06.csv` (22.0MB)

### Small Files (IN GitHub)
- `first_session/first_cgm_log.csv` - CGM data for session 1
- `second_session/second_cgm_log.csv` - CGM data for session 2
- `second_session/freelibre_readings_glucose.csv` - Additional glucose readings

## Usage

### For ML Processing
The ML pipeline automatically reconstructs large files from splits when needed:

```python
from glucose_ml_processor import run_cross_session_experiments

# This will automatically merge split files as needed
results = run_cross_session_experiments()
```

### Manual File Management
```python
from data_file_manager import DataFileManager

# Initialize manager
manager = DataFileManager("eigen_blood")

# Ensure files are available (auto-merge if needed)
files = manager.ensure_files_available([
    "first_session/first_fnirs_log.csv",
    "second_session/second_fnirs_log.csv"
])

# Cleanup temporary files when done
manager.cleanup_temp_files()
```

### Workflow Commands
```bash
# Split large files for GitHub (if you have original files)
python github_data_workflow.py split

# Test reconstruction from existing splits
python github_data_workflow.py test

# Show current status
python github_data_workflow.py status
```

## Splitting Strategy

- **Target size**: 25MB per part (well under GitHub's 50MB warning limit)
- **Method**: Binary splitting to preserve exact file content
- **Naming**: `original_name_part01.csv`, `original_name_part02.csv`, etc.
- **Reconstruction**: Automatic binary concatenation when needed

## Important Notes

1. **Never commit large files** - They are automatically ignored by .gitignore
2. **Split files are automatically merged** when needed by ML code
3. **Temporary merged files** are created in `temp_merged_files/` and cleaned up automatically
4. **File integrity** is maintained through the splitting/merging process
5. **All parts must be present** for successful reconstruction

## File Manifest

See `file_manifest.txt` for a complete list of original files, their checksums, and split parts.

## Verification

To verify the system is working:

```bash
cd agent_logic
python github_data_workflow.py test
```

This will:
- ✅ Reconstruct files from splits
- ✅ Verify file readability
- ✅ Test ML pipeline integration
- ✅ Clean up temporary files