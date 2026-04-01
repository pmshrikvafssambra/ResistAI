
import sys
import os
import json
import joblib
import pandas as pd
import numpy as np

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

try:
    from ml_pipeline import BioinformaticsKB, AdvancedFeatureEngineer
    print("Import successful")
except ImportError as e:
    print(f"Import failed: {e}")
