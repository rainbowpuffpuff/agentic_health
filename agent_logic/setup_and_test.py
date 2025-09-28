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