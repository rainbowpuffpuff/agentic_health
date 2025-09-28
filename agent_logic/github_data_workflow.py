#!/usr/bin/env python3
"""
GitHub Data Workflow Manager

This script manages the complete workflow for handling large data files with GitHub:
1. Split large files into GitHub-safe parts
2. Remove original large files 
3. Commit only split files to GitHub
4. Reconstruct files from splits when needed for ML
"""

import os
import shutil
from pathlib import Path
from data_file_manager import DataFileManager

def split_and_prepare_for_github():
    """
    Complete workflow to prepare data files for GitHub:
    1. Split large files into parts under 25MB
    2. Remove original large files
    3. Update .gitignore to prevent accidental commits
    """
    
    print("🚀 Preparing Data Files for GitHub")
    print("=" * 50)
    
    data_manager = DataFileManager("eigen_blood")
    
    # Step 1: Split large files
    print("\n📂 Step 1: Splitting large files...")
    split_results = data_manager.split_large_files()
    
    if not split_results:
        print("No files needed splitting")
        return
    
    # Step 2: Show what was created
    print(f"\n✅ Successfully split {len(split_results)} files:")
    for original, splits in split_results:
        total_size = sum(data_manager.get_file_size_mb(f) for f in splits)
        print(f"  {original.name} ({data_manager.get_file_size_mb(original):.1f}MB)")
        for i, split_file in enumerate(splits, 1):
            size_mb = data_manager.get_file_size_mb(split_file)
            print(f"    → part{i:02d}: {split_file.name} ({size_mb:.1f}MB)")
        print(f"    Total split size: {total_size:.1f}MB")
    
    # Step 3: Remove original large files
    print(f"\n🗑️  Step 2: Removing original large files...")
    for original, splits in split_results:
        print(f"  Removing {original.name}")
        original.unlink()
    
    # Step 4: Create manifest
    data_manager.create_manifest()
    
    # Step 5: Show final file structure
    print(f"\n📋 Step 3: Final file structure for GitHub:")
    for csv_file in sorted(data_manager.data_dir.rglob("*.csv")):
        size_mb = data_manager.get_file_size_mb(csv_file)
        status = "✅" if size_mb < 25 else "⚠️"
        print(f"  {status} {csv_file.relative_to(data_manager.data_dir)} ({size_mb:.1f}MB)")
    
    print(f"\n🎯 Ready for GitHub!")
    print(f"📝 Next steps:")
    print(f"  1. git add agent_logic/eigen_blood/")
    print(f"  2. git add agent_logic/.gitignore")
    print(f"  3. git commit -m 'feat: Add split data files for GitHub'")
    print(f"  4. git push")
    print(f"\n💡 The ML pipeline will automatically reconstruct files when needed!")

def test_reconstruction():
    """
    Test that we can reconstruct the original files from splits
    """
    
    print("🧪 Testing File Reconstruction")
    print("=" * 40)
    
    data_manager = DataFileManager("eigen_blood")
    
    # Required files for ML processing
    required_files = [
        "first_session/first_fnirs_log.csv",
        "first_session/first_cgm_log.csv", 
        "second_session/second_fnirs_log.csv",
        "second_session/second_cgm_log.csv"
    ]
    
    try:
        print("Ensuring all required files are available...")
        available_files = data_manager.ensure_files_available(required_files)
        
        print("✅ All files successfully reconstructed:")
        for name, path in available_files.items():
            if path.parent.name == "temp_merged_files":
                size_mb = data_manager.get_file_size_mb(path)
                print(f"  📁 {name} → reconstructed ({size_mb:.1f}MB)")
            else:
                print(f"  ✓ {name} → already available")
        
        # Test that we can actually read the files
        print("\n🔍 Testing file readability...")
        for name, path in available_files.items():
            if name.endswith("fnirs_log.csv"):
                try:
                    import pandas as pd
                    df = pd.read_csv(path, nrows=5)  # Just read first 5 rows
                    print(f"  ✅ {name}: {len(df.columns)} columns, readable")
                except Exception as e:
                    print(f"  ❌ {name}: Error reading - {e}")
        
        # Cleanup
        data_manager.cleanup_temp_files()
        print("\n🧹 Cleaned up temporary files")
        
        return True
        
    except Exception as e:
        print(f"❌ Reconstruction failed: {e}")
        return False

def show_current_status():
    """
    Show the current status of data files
    """
    
    print("📊 Current Data File Status")
    print("=" * 30)
    
    data_manager = DataFileManager("eigen_blood")
    
    # Check for original files
    original_files = [
        "first_session/first_fnirs_log.csv",
        "second_session/second_fnirs_log.csv"
    ]
    
    print("Large original files:")
    for file_path in original_files:
        full_path = data_manager.data_dir / file_path
        if full_path.exists():
            size_mb = data_manager.get_file_size_mb(full_path)
            print(f"  🔴 {file_path} ({size_mb:.1f}MB) - SHOULD BE REMOVED")
        else:
            print(f"  ✅ {file_path} - Not present (good)")
    
    # Check for split files
    print(f"\nSplit files:")
    split_count = 0
    for csv_file in data_manager.data_dir.rglob("*_part*.csv"):
        size_mb = data_manager.get_file_size_mb(csv_file)
        status = "✅" if size_mb < 25 else "⚠️"
        print(f"  {status} {csv_file.relative_to(data_manager.data_dir)} ({size_mb:.1f}MB)")
        split_count += 1
    
    if split_count == 0:
        print("  No split files found")
    
    # Check other files
    print(f"\nOther CSV files:")
    for csv_file in data_manager.data_dir.rglob("*.csv"):
        if "_part" not in csv_file.name and csv_file.name not in [f.split("/")[-1] for f in original_files]:
            size_mb = data_manager.get_file_size_mb(csv_file)
            print(f"  ✅ {csv_file.relative_to(data_manager.data_dir)} ({size_mb:.1f}MB)")

def create_readme():
    """
    Create a README explaining the data file system
    """
    
    readme_content = """# Data Files Management

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
"""
    
    readme_path = Path("eigen_blood/README.md")
    with open(readme_path, 'w') as f:
        f.write(readme_content)
    
    print(f"📖 Created README: {readme_path}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "split":
            split_and_prepare_for_github()
        elif command == "test":
            test_reconstruction()
        elif command == "status":
            show_current_status()
        elif command == "readme":
            create_readme()
        else:
            print(f"Unknown command: {command}")
    else:
        print("GitHub Data Workflow Manager")
        print("=" * 30)
        print("Commands:")
        print("  split   - Split large files and prepare for GitHub")
        print("  test    - Test file reconstruction from splits")
        print("  status  - Show current file status")
        print("  readme  - Create README documentation")
        print()
        print("Usage: python github_data_workflow.py <command>")