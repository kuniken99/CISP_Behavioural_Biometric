# cbba_python_service/model_trainer.py

import pandas as pd
import pickle
import os
import sys
import json
import time
from src.feature_engineer_logic import engineer_features

# --- Configuration ---
RAW_DATA_PATH = 'data/raw_events.jsonl' # From collector.py
DB_EVENT_PATH = 'data/db_events/db_events.log' # From simulated DB events
MODEL_PATH = 'models/isolation_forest_model.pkl'

def generate_dummy_data_for_training():
    """Generates a small amount of dummy data for initial model training."""
    biometric_events = []
    db_events = []
    current_time = time.time()
    for i in range(100):
        # Simulate normal typing and mouse movement
        biometric_events.append({'type': 'key_press', 'time': current_time + i * 0.1, 'key': 'a', 'x': None, 'y': None, 'button': None, 'pressed': None})
        biometric_events.append({'type': 'key_release', 'time': current_time + i * 0.1 + 0.05, 'key': 'a', 'x': None, 'y': None, 'button': None, 'pressed': None})
        biometric_events.append({'type': 'mouse_move', 'time': current_time + i * 0.08, 'x': 100+i, 'y': 200+i, 'button': None, 'pressed': None, 'key': None})

        # Simulate normal DB events
        if i % 5 == 0:
            db_events.append({
                'timestamp': current_time + i * 0.1,
                'user': 'admin',
                'session_id': 'train_session',
                'event_type': 'SELECT',
                'query_size_kb': random.randint(10, 50)
            })
    return biometric_events, db_events

def train_model():
    from sklearn.ensemble import IsolationForest

    print("Generating training data (biometric and DB events)...")
    # For a real system, you'd load actual recorded data from RAW_DATA_PATH and DB_EVENT_PATH
    # For this MVP, we'll generate a small consistent set if files are not present.

    # Check if raw_events.jsonl exists and is not empty
    biometric_events_from_file = []
    try:
        with open(RAW_DATA_PATH, 'r') as f:
            for line in f:
                biometric_events_from_file.append(json.loads(line))
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"Warning: {RAW_DATA_PATH} not found or corrupted. Generating dummy biometric data for training.")

    # Check if db_events.log exists and is not empty
    db_events_from_file = []
    try:
        with open(DB_EVENT_PATH, 'r') as f:
            for line in f:
                db_events_from_file.append(json.loads(line))
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"Warning: {DB_EVENT_PATH} not found or corrupted. Generating dummy DB event data for training.")

    if biometric_events_from_file and db_events_from_file:
        print("Using existing raw biometric and DB event files for training.")
        features_df = engineer_features(biometric_events_from_file, db_events_from_file)
    else:
        print("Using generated dummy data for training.")
        biometric_events, db_events = generate_dummy_data_for_training()
        features_df = engineer_features(biometric_events, db_events)


    if features_df is None or features_df.empty:
        print("Error: No features generated. Cannot train model.")
        sys.exit(1)

    print("Generated features for training:")
    print(features_df.head())

    # Initialize the Isolation Forest model
    # Contamination is crucial: higher value means model expects more anomalies in training data.
    # For a baseline, we assume a small percentage of *unlabeled* anomalies might be present in 'normal' data.
    # Set to 0.1 for more sensitivity in MVP
    model = IsolationForest(contamination=0.1, random_state=42)

    print("Starting model training...")
    model.fit(features_df)
    print("Model training complete.")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == '__main__':
    train_model()