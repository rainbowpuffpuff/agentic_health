# Data Files Management

This directory contains research data that has been split for GitHub compatibility.

## File Structure

### Original Large Files (NOT in GitHub)
- `first_session/first_fnirs_log.csv` (~101MB) - Split into parts
- `second_session/second_fnirs_log.csv` (~132MB) - Split into parts

### Split Files (IN GitHub)
- `first_session/first_fnirs_log_part01.csv` (~25MB)
- `first_session/first_fnirs_log_part02.csv` (~25MB)
- `first_session/first_fnirs_log_part03.csv` (~25MB)
- `first_session/first_fnirs_log_part04.csv` (~25MB)
- `second_session/second_fnirs_log_part01.csv` (~25MB)
- `second_session/second_fnirs_log_part02.csv` (~25MB)
- `second_session/second_fnirs_log_part03.csv` (~25MB)
- `second_session/second_fnirs_log_part04.csv` (~25MB)
- `second_session/second_fnirs_log_part05.csv` (~25MB)
- `second_session/second_fnirs_log_part06.csv` (~7MB)

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
# Split large files for GitHub
python github_data_workflow.py split

# Test reconstruction
python github_data_workflow.py test

# Show current status
python github_data_workflow.py status
```

## Important Notes

1. **Never commit large files** - They are automatically ignored by .gitignore
2. **Split files are automatically merged** when needed by ML code
3. **Temporary merged files** are created in `temp_merged_files/` and cleaned up automatically
4. **File integrity** is maintained through the splitting/merging process

## File Manifest

See `file_manifest.txt` for a complete list of original files and their split parts.
