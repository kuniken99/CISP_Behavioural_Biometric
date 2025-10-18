# cbba_python_service/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """CBBA Service Configuration"""
    
    # Flask settings
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5001))  # Python service on 5001, backend on 5000
    FLASK_HOST = '127.0.0.1'
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # Security settings
    ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', 'default-key-change-in-production')
    
    # Model storage
    MODEL_STORAGE_PATH = os.getenv('MODEL_STORAGE_PATH', './models')
    
    # Risk thresholds
    # Green (0-49%): Normal behavior
    # Orange (50-79%): Suspicious/moderate anomalous behavior  
    # Red (80-100%): Highly anomalous behavior (OTP re-verification or session lock)
    RISK_THRESHOLD_MODERATE = int(os.getenv('RISK_THRESHOLD_MODERATE', 50))  # Orange threshold
    RISK_THRESHOLD_HIGH = int(os.getenv('RISK_THRESHOLD_HIGH', 80))  # Red threshold
    
    # ML Model parameters
    ISOLATION_FOREST_CONTAMINATION = 0.1
    ISOLATION_FOREST_N_ESTIMATORS = 100
    ONE_CLASS_SVM_NU = 0.1
    ONE_CLASS_SVM_GAMMA = 'auto'
    
    # Training parameters
    MIN_TRAINING_SAMPLES = 5  # Minimum samples needed for initial training (lowered for development - was 10, originally 50)
    TRAINING_WINDOW_SIZE = 100  # Number of recent samples to use for training
    
    # Feature extraction parameters
    KEYSTROKE_FEATURES = [
        'avg_dwell_time',
        'std_dwell_time',
        'avg_flight_time',
        'std_flight_time',
        'avg_typing_speed',
        'std_typing_speed',
        'key_press_variance'
    ]
    
    MOUSE_FEATURES = [
        'avg_velocity',
        'std_velocity',
        'avg_acceleration',
        'std_acceleration',
        'avg_curvature',
        'std_curvature',
        'click_rate',
        'double_click_rate',
        'scroll_speed',
        'path_efficiency'
    ]
