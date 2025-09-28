#!/usr/bin/env python3
"""
Complete Setup and Test Suite for fNIRS ML Pipeline

This script runs all necessary setup steps and tests in the correct order,
providing a single command to verify the entire system is working properly.

Usage:
    python setup_and_test.py                    # Run all tests
    python setup_and_test.py --quick            # Skip ML experiments  
    python setup_and_test.py --setup-only       # Only run setup, no tests
    python setup_and_test.py --api-test         # Test API endpoints only
"""

import sys
import os
import time
import argparse
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# Color codes for pretty output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(title: str, char: str = "="):
    """Print a formatted header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{char * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}{title.center(60)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{char * 60}{Colors.END}")

def print_step(step: str, description: str = ""):
    """Print a step with formatting"""
    print(f"\n{Colors.BOLD}{Colors.PURPLE}🔧 {step}{Colors.END}")
    if description:
        print(f"{Colors.CYAN}{description}{Colors.END}")

def print_success(message: str):
    """Print success message"""
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message: str):
    """Print error message"""
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_info(message: str):
    """Print info message"""
    print(f"{Colors.CYAN}ℹ️  {message}{Colors.END}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Setup and test fNIRS ML pipeline")
    parser.add_argument("--quick", action="store_true", help="Skip ML experiments")
    parser.add_argument("--setup-only", action="store_true", help="Only run setup")
    parser.add_argument("--api-test", action="store_true", help="Test API endpoints only")
    
    args = parser.parse_args()
    
    print_header("fNIRS ML Pipeline Setup & Test")
    print_info("Single command setup for complete system validation")
    
    if args.setup_only:
        print_info("Setup-only mode: Validating dependencies and data files")
    elif args.quick:
        print_info("Quick mode: Skipping ML experiments")
    elif args.api_test:
        print_info("API test mode: Testing endpoints only")
    else:
        print_info("Full mode: Complete system validation with ML experiments")
class Syst
emTester:
    """Comprehensive system testing and setup"""
    
    def __init__(self, quick_mode: bool = False, setup_only: bool = False, api_test_only: bool = False):
        self.quick_mode = quick_mode
        self.setup_only = setup_only
        self.api_test_only = api_test_only
        self.results = {}
        self.start_time = time.time()
        
    def run_command(self, command: str, description: str = "", capture_output: bool = True) -> Tuple[bool, str]:
        """Run a shell command and return success status and output"""
        try:
            if capture_output:
                result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=60)
                success = result.returncode == 0
                output = result.stdout + result.stderr
            else:
                result = subprocess.run(command, shell=True, timeout=60)
                success = result.returncode == 0
                output = ""
            
            if success and description:
                print_success(f"{description}")
            elif not success and description:
                print_error(f"{description} - Command failed: {command}")
                if output:
                    print(f"Output: {output[:200]}...")
                    
            return success, output
        except subprocess.TimeoutExpired:
            print_error(f"Command timed out: {command}")
            return False, "Timeout"
        except Exception as e:
            print_error(f"Command failed: {command} - {e}")
            return False, str(e)

    def run_all_tests(self) -> bool:
        """Run all tests based on mode"""
        print_step("Starting System Validation")
        
        all_passed = True
        
        # Always test dependencies
        if not self.test_python_imports():
            all_passed = False
            
        # Test data files unless API-only mode
        if not self.api_test_only:
            if not self.test_data_files():
                all_passed = False
        
        return all_passed
    
    def test_python_imports(self) -> bool:
        """Test that all required Python modules can be imported"""
        print_step("Testing Python Dependencies", "Verifying all required modules are available")
        
        required_modules = [
            'fastapi', 'uvicorn', 'pandas', 'numpy', 'sklearn', 
            'joblib', 'pydantic', 'tempfile', 'pathlib'
        ]
        
        failed_imports = []
        for module in required_modules:
            try:
                __import__(module)
                print(f"  ✅ {module}")
            except ImportError:
                print(f"  ❌ {module}")
                failed_imports.append(module)
        
        if failed_imports:
            print_error(f"Missing modules: {', '.join(failed_imports)}")
            print_info("Run: pip install -r requirements.txt")
            return False
        
        print_success("All Python dependencies available")
        return True

    def test_data_files(self) -> bool:
        """Test data file availability and management"""
        print_step("Testing Data File Management", "Verifying split files and reconstruction capability")
        
        try:
            # Test github_data_workflow.py status
            success, output = self.run_command("python github_data_workflow.py status")
            if not success:
                print_error("GitHub data workflow status check failed")
                return False
            
            print_success("Data file management system working")
            return True
            
        except Exception as e:
            print_error(f"Data file test failed: {e}")
            return False