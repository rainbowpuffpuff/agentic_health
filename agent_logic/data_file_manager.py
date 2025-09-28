#!/usr/bin/env python3
"""
Data File Manager for Large fNIRS Files

This module handles splitting large data files for GitHub storage and 
merging them back for ML processing.
"""

import os
import shutil
from pathlib import Path
from typing import List, Tuple, Dict
import hashlib

# GitHub file size limit (we'll use 90MB to be safe)
MAX_FILE_SIZE_MB = 90
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

class DataFileManager:
    """Manages splitting and merging of large data files"""
    
    def __init__(self, data_dir: str = "eigen_blood"):
        self.data_dir = Path(data_dir)
        self.split_suffix = "_part"
        self.manifest_file = "file_manifest.txt"
    
    def get_file_size_mb(self, file_path: Path) -> float:
        """Get file size in MB"""
        return file_path.stat().st_size / (1024 * 1024)
    
    def calculate_file_hash(self, file_path: Path) -> str:
        """Calculate MD5 hash of a file for integrity checking"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def split_file(self, file_path: Path, num_parts: int = 2) -> List[Path]:
        """
        Split a large file into smaller parts
        
        Args:
            file_path: Path to the file to split
            num_parts: Number of parts to split into
            
        Returns:
            List of paths to the split files
        """
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        file_size = file_path.stat().st_size
        part_size = file_size // num_parts
        
        print(f"Splitting {file_path.name} ({self.get_file_size_mb(file_path):.1f}MB) into {num_parts} parts...")
        
        split_files = []
        
        with open(file_path, 'rb') as source_file:
            for i in range(num_parts):
                part_filename = f"{file_path.stem}{self.split_suffix}{i+1:02d}{file_path.suffix}"
                part_path = file_path.parent / part_filename
                
                with open(part_path, 'wb') as part_file:
                    if i == num_parts - 1:
                        # Last part gets all remaining data
                        part_file.write(source_file.read())
                    else:
                        part_file.write(source_file.read(part_size))
                
                split_files.append(part_path)
                print(f"  Created {part_filename} ({self.get_file_size_mb(part_path):.1f}MB)")
        
        return split_files
    
    def merge_file(self, base_filename: str, output_path: Path) -> Path:
        """
        Merge split files back into original file
        
        Args:
            base_filename: Base name of the split files (without _part suffix)
            output_path: Path where to save the merged file
            
        Returns:
            Path to the merged file
        """
        # Find all parts
        base_path = Path(base_filename)
        part_pattern = f"{base_path.stem}{self.split_suffix}*{base_path.suffix}"
        part_dir = base_path.parent
        
        part_files = sorted(list(part_dir.glob(part_pattern)))
        
        if not part_files:
            raise FileNotFoundError(f"No split files found matching pattern: {part_pattern}")
        
        print(f"Merging {len(part_files)} parts into {output_path.name}...")
        
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'wb') as output_file:
            for part_file in part_files:
                print(f"  Merging {part_file.name}...")
                with open(part_file, 'rb') as part:
                    shutil.copyfileobj(part, output_file)
        
        print(f"Merged file created: {output_path} ({self.get_file_size_mb(output_path):.1f}MB)")
        return output_path
    
    def create_manifest(self) -> None:
        """Create a manifest file listing all original files and their splits"""
        manifest_path = self.data_dir / self.manifest_file
        
        manifest_lines = []
        manifest_lines.append("# Data File Manifest")
        manifest_lines.append("# Format: original_file|file_size_mb|hash|split_files")
        manifest_lines.append("")
        
        for csv_file in self.data_dir.rglob("*.csv"):
            if self.split_suffix not in csv_file.name:  # Only original files
                size_mb = self.get_file_size_mb(csv_file)
                file_hash = self.calculate_file_hash(csv_file)
                
                # Check for split files
                split_pattern = f"{csv_file.stem}{self.split_suffix}*{csv_file.suffix}"
                split_files = sorted(list(csv_file.parent.glob(split_pattern)))
                
                if split_files:
                    split_names = [f.name for f in split_files]
                    manifest_lines.append(f"{csv_file.relative_to(self.data_dir)}|{size_mb:.1f}|{file_hash}|{','.join(split_names)}")
                else:
                    manifest_lines.append(f"{csv_file.relative_to(self.data_dir)}|{size_mb:.1f}|{file_hash}|")
        
        with open(manifest_path, 'w') as f:
            f.write('\n'.join(manifest_lines))
        
        print(f"Manifest created: {manifest_path}")
    
    def split_large_files(self, force: bool = False) -> List[Tuple[Path, List[Path]]]:
        """
        Split all files that exceed the size limit
        
        Args:
            force: If True, split files even if they're under the limit
            
        Returns:
            List of tuples (original_file, split_files)
        """
        split_results = []
        
        csv_files = list(self.data_dir.rglob("*.csv"))
        print(f"Found {len(csv_files)} CSV files to check")
        
        for csv_file in csv_files:
            if self.split_suffix in csv_file.name:
                continue  # Skip already split files
            
            size_mb = self.get_file_size_mb(csv_file)
            
            print(f"Checking {csv_file.name}: {size_mb:.1f}MB (limit: {MAX_FILE_SIZE_MB}MB)")
            
            if size_mb > MAX_FILE_SIZE_MB or force:
                print(f"  -> File exceeds limit, splitting...")
                # Calculate number of parts needed
                num_parts = max(2, int(size_mb / MAX_FILE_SIZE_MB) + 1)
                
                try:
                    split_files = self.split_file(csv_file, num_parts)
                    split_results.append((csv_file, split_files))
                    
                    # Optionally remove original file after successful split
                    # csv_file.unlink()  # Uncomment to delete original
                    
                except Exception as e:
                    print(f"Error splitting {csv_file}: {e}")
            else:
                print(f"  -> File is under the limit, skipping")
        
        return split_results
    
    def ensure_files_available(self, required_files: List[str]) -> Dict[str, Path]:
        """
        Ensure required files are available, merging from splits if necessary
        
        Args:
            required_files: List of file paths relative to data_dir
            
        Returns:
            Dictionary mapping file names to their actual paths
        """
        available_files = {}
        temp_dir = Path("temp_merged_files")
        temp_dir.mkdir(exist_ok=True)
        
        for file_path in required_files:
            full_path = self.data_dir / file_path
            
            if full_path.exists():
                # File exists as-is
                available_files[file_path] = full_path
                print(f"✓ Found: {file_path}")
            else:
                # Look for split files
                split_pattern = f"{full_path.stem}{self.split_suffix}*{full_path.suffix}"
                split_files = sorted(list(full_path.parent.glob(split_pattern)))
                
                if split_files:
                    # Merge split files to temp location
                    temp_file = temp_dir / full_path.name
                    merged_path = self.merge_file(str(full_path), temp_file)
                    available_files[file_path] = merged_path
                    print(f"✓ Merged: {file_path}")
                else:
                    raise FileNotFoundError(f"Neither original nor split files found for: {file_path}")
        
        return available_files
    
    def cleanup_temp_files(self) -> None:
        """Clean up temporary merged files"""
        temp_dir = Path("temp_merged_files")
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
            print("Cleaned up temporary files")


def split_data_files_for_github():
    """Main function to split large data files for GitHub upload"""
    
    print("🔧 Splitting large data files for GitHub...")
    print("=" * 50)
    
    # Use the correct path based on current working directory
    data_path = "eigen_blood" if os.path.exists("eigen_blood") else "agent_logic/eigen_blood"
    manager = DataFileManager(data_path)
    
    # Split large files
    split_results = manager.split_large_files()
    
    if split_results:
        print(f"\n✅ Successfully split {len(split_results)} files:")
        for original, splits in split_results:
            print(f"  {original.name} → {len(splits)} parts")
        
        # Create manifest
        manager.create_manifest()
        
        print(f"\n📝 Next steps:")
        print(f"  1. Add split files to git: git add agent_logic/eigen_blood/")
        print(f"  2. Remove original large files from git if desired")
        print(f"  3. The ML pipeline will automatically merge files when needed")
        
    else:
        print("No files needed splitting")


def test_file_operations():
    """Test the file splitting and merging operations"""
    
    print("🧪 Testing file operations...")
    
    manager = DataFileManager("agent_logic/eigen_blood")
    
    # Test ensuring files are available
    required_files = [
        "first_session/first_fnirs_log.csv",
        "first_session/first_cgm_log.csv",
        "second_session/second_fnirs_log.csv", 
        "second_session/second_cgm_log.csv"
    ]
    
    try:
        available_files = manager.ensure_files_available(required_files)
        print("✅ All required files are available:")
        for name, path in available_files.items():
            print(f"  {name} → {path}")
        
        # Cleanup
        manager.cleanup_temp_files()
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "split":
        split_data_files_for_github()
    elif len(sys.argv) > 1 and sys.argv[1] == "test":
        test_file_operations()
    else:
        print("Usage:")
        print("  python data_file_manager.py split  # Split large files for GitHub")
        print("  python data_file_manager.py test   # Test file operations")