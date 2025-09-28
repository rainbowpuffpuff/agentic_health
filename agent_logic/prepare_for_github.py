#!/usr/bin/env python3
"""
Prepare data files for GitHub by removing large originals and keeping only split files
"""

import os
from pathlib import Path
from data_file_manager import DataFileManager

def prepare_for_github():
    """Remove large original files, keeping only split versions"""
    
    print("🚀 Preparing data files for GitHub...")
    print("=" * 50)
    
    data_manager = DataFileManager("eigen_blood")
    
    # Find all large files that have been split
    large_files_to_remove = []
    
    for csv_file in data_manager.data_dir.rglob("*.csv"):
        if data_manager.split_suffix in csv_file.name:
            continue  # Skip split files
        
        size_mb = data_manager.get_file_size_mb(csv_file)
        
        if size_mb > 90:  # Files that exceed GitHub limit
            # Check if split files exist
            split_pattern = f"{csv_file.stem}{data_manager.split_suffix}*{csv_file.suffix}"
            split_files = list(csv_file.parent.glob(split_pattern))
            
            if split_files:
                large_files_to_remove.append((csv_file, split_files))
                print(f"📁 {csv_file.name} ({size_mb:.1f}MB) → {len(split_files)} split files")
            else:
                print(f"⚠️  {csv_file.name} ({size_mb:.1f}MB) has no split files!")
    
    if large_files_to_remove:
        print(f"\n🗑️  Removing {len(large_files_to_remove)} large original files...")
        
        for original_file, split_files in large_files_to_remove:
            print(f"  Removing {original_file.name}")
            original_file.unlink()
        
        print(f"\n✅ Preparation complete!")
        print(f"📝 Files ready for GitHub:")
        
        # Show what's left
        for csv_file in sorted(data_manager.data_dir.rglob("*.csv")):
            size_mb = data_manager.get_file_size_mb(csv_file)
            print(f"  {csv_file.relative_to(data_manager.data_dir)} ({size_mb:.1f}MB)")
        
        print(f"\n📋 Next steps:")
        print(f"  1. git add agent_logic/eigen_blood/")
        print(f"  2. git commit -m 'feat: Split large data files for GitHub'")
        print(f"  3. The ML pipeline will automatically merge files when needed")
        
    else:
        print("No large files found to remove")

def restore_original_files():
    """Restore original files from split versions (for development)"""
    
    print("🔄 Restoring original files from splits...")
    
    data_manager = DataFileManager("eigen_blood")
    
    # Find all split file sets
    split_sets = {}
    
    for split_file in data_manager.data_dir.rglob(f"*{data_manager.split_suffix}*.csv"):
        # Extract base name
        base_name = split_file.name.replace(data_manager.split_suffix, "").split(".csv")[0]
        base_name = base_name.split("_part")[0] + ".csv"
        base_path = split_file.parent / base_name
        
        if base_path not in split_sets:
            split_sets[base_path] = []
        split_sets[base_path].append(split_file)
    
    for base_path, split_files in split_sets.items():
        if not base_path.exists():
            print(f"Restoring {base_path.name} from {len(split_files)} parts...")
            data_manager.merge_file(str(base_path), base_path)
    
    print("✅ Restoration complete!")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "restore":
        restore_original_files()
    else:
        prepare_for_github()