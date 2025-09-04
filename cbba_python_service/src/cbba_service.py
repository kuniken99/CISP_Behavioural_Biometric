# cbba_python_service/src/cbba_service.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import sys
import time
import json
from src.feature_engineer_logic import engineer_features
import pandas as pd # Import pandas for DataFrame compatibility

app = Flask(__name__)
CORS(app) # Enable CORS for frontend communication

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'isolation_forest_model.pkl')
LOG_PATH = os.path.join(os.path.dirname(__file__), '..', 'logs', 'security_incidents.log')
ANOMALY_THRESHOLD = 0.0 # Set to 0.0 for higher sensitivity

trained_model = None
feature_columns = None # To store the order of features the model was trained on

def load_model():
    """Loads the trained Isolation Forest model."""
    global trained_model, feature_columns
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model not found at {MODEL_PATH}. Please run model_trainer.py first.")
        return False
    try:
        with open(MODEL_PATH, 'rb') as f:
            trained_model = pickle.load(f)
        print(f"Model loaded successfully from {MODEL_PATH}")
        # Get feature names the model was trained on
        if hasattr(trained_model, 'feature_names_in_'):
            feature_columns = trained_model.feature_names_in_
        elif hasattr(trained_model, 'estimators_') and hasattr(trained_model.estimators_[0], 'feature_names_in_'):
             feature_columns = trained_model.estimators_[0].feature_names_in_
        else:
            print("Warning: Could not determine feature names from the loaded model. This might cause issues.")
            # Fallback to expected feature names if not available from model (manual list)
            feature_columns = [
                'avg_dwell_time', 'std_dwell_time', 'avg_flight_time', 'std_flight_time',
                'key_press_rate', 'mouse_move_count', 'mouse_click_rate', 'std_mouse_speed',
                'db_event_count', 'avg_query_size_kb', 'bulk_export_count'
            ]
        print(f"Expected features: {list(feature_columns)}")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

if not load_model():
    sys.exit(1) # Exit if model cannot be loaded

@app.route('/predict_anomaly', methods=['POST'])
def predict_anomaly():
    """
    Receives raw biometric and database events, engineers features,
    and returns an anomaly score.
    """
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    biometric_events = data.get('biometric_events', [])
    db_events = data.get('db_events', [])

    if not biometric_events and not db_events:
        # Handle case with no events gracefully, return "normal"
        return jsonify({
            'anomaly_score': 1.0, # High score for normal (IsolationForest outputs negative for anomalies)
            'status': 'no_activity'
        })

    features_df = engineer_features(biometric_events, db_events)

    # Ensure feature order and presence match the trained model
    if feature_columns is not None:
        # Reindex to ensure correct column order and fill missing with 0
        features_df = features_df.reindex(columns=feature_columns, fill_value=0)

    if trained_model:
        anomaly_score = trained_model.decision_function(features_df)[0]
        prediction = trained_model.predict(features_df)[0] # 1 for inlier, -1 for outlier

        is_anomaly = float(anomaly_score) < ANOMALY_THRESHOLD

        response = {
            'anomaly_score': float(anomaly_score),
            'prediction': int(prediction),
            'is_anomaly': is_anomaly,
            'features': features_df.to_dict('records')[0]
        }
        if is_anomaly:
            log_entry = {
                'timestamp': time.time(),
                'anomaly_score': float(anomaly_score),
                'features': features_df.to_dict('records')[0],
                'biometric_events_count': len(biometric_events),
                'db_events_count': len(db_events)
            }
            with open(LOG_PATH, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
        return jsonify(response)
    else:
        return jsonify({'error': 'Model not loaded'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)