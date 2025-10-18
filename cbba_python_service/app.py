# cbba_python_service/app.py
"""
Flask API for CBBA Service
Provides REST endpoints for behavioral biometric authentication
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from cbba_service import CBBAService
from config import Config

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Initialize CBBA service
cbba_service = CBBAService()

# Create models directory
os.makedirs(Config.MODEL_STORAGE_PATH, exist_ok=True)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'CBBA Python Service',
        'version': '1.0.0'
    })


@app.route('/api/cbba/train', methods=['POST'])
def train_profile():
    """
    Train user's biometric profile
    
    Request Body:
    {
        "user_id": 123,
        "training_data": [
            {
                "keystroke_data": [...],
                "mouse_data": [...]
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        user_id = data.get('user_id')
        training_data = data.get('training_data', [])
        
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id is required'}), 400
        
        if not training_data:
            return jsonify({'success': False, 'error': 'training_data is required'}), 400
        
        # Train profile
        result = cbba_service.train_user_profile(user_id, training_data)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/cbba/assess', methods=['POST'])
def assess_risk():
    """
    Assess real-time risk score
    
    Request Body:
    {
        "user_id": 123,
        "keystroke_data": [...],
        "mouse_data": [...]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        user_id = data.get('user_id')
        keystroke_data = data.get('keystroke_data', [])
        mouse_data = data.get('mouse_data', [])
        
        # DEBUG: Log first few events to see exact structure
        if mouse_data and len(mouse_data) > 0:
            print(f"[PYTHON DEBUG] Total mouse events: {len(mouse_data)}")
            print(f"[PYTHON DEBUG] First mouse event RAW: {mouse_data[0]}")
            print(f"[PYTHON DEBUG] First mouse event TYPE: {type(mouse_data[0])}")
            if isinstance(mouse_data[0], dict):
                print(f"[PYTHON DEBUG] Keys in event: {list(mouse_data[0].keys())}")
                print(f"[PYTHON DEBUG] Event property value: {mouse_data[0].get('event', 'NOT FOUND')}")
        
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id is required'}), 400
        
        # Assess risk
        result = cbba_service.assess_risk(user_id, keystroke_data, mouse_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/cbba/update', methods=['POST'])
def update_profile():
    """
    Update user's profile with new legitimate data
    
    Request Body:
    {
        "user_id": 123,
        "keystroke_data": [...],
        "mouse_data": [...]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        user_id = data.get('user_id')
        keystroke_data = data.get('keystroke_data', [])
        mouse_data = data.get('mouse_data', [])
        
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id is required'}), 400
        
        # Update profile
        result = cbba_service.update_profile(user_id, keystroke_data, mouse_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/cbba/profile/encrypt', methods=['POST'])
def encrypt_profile():
    """
    Get encrypted profile for storage
    
    Request Body:
    {
        "user_id": 123
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id is required'}), 400
        
        encrypted_profile = cbba_service.get_encrypted_profile(user_id)
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'encrypted_profile': encrypted_profile
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/cbba/profile/load', methods=['POST'])
def load_profile():
    """
    Load user's profile from encrypted storage
    
    Request Body:
    {
        "user_id": 123,
        "encrypted_profile": "base64_encoded_data"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        user_id = data.get('user_id')
        encrypted_profile = data.get('encrypted_profile')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id is required'}), 400
        
        if not encrypted_profile:
            return jsonify({'success': False, 'error': 'encrypted_profile is required'}), 400
        
        success = cbba_service.load_encrypted_profile(user_id, encrypted_profile)
        
        return jsonify({
            'success': success,
            'user_id': user_id
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/cbba/status/<user_id>', methods=['GET'])
def get_status(user_id):
    """Get user's biometric profile status (supports both int and string user_id)"""
    try:
        result = cbba_service.get_user_status(user_id)
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/cbba/process', methods=['POST'])
def process_behavioral_data():
    """
    Process behavioral data (training or assessment mode)
    
    Request Body:
    {
        "user_id": 123,
        "keystroke_data": [...],
        "mouse_data": [...],
        "mode": "train" or "assess"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        user_id = data.get('user_id')
        keystroke_data = data.get('keystroke_data', [])
        mouse_data = data.get('mouse_data', [])
        mode = data.get('mode', 'assess')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id is required'}), 400
        
        result = cbba_service.process_behavioral_data(
            user_id=user_id,
            keystroke_data=keystroke_data,
            mouse_data=mouse_data,
            mode=mode
        )
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print(f"Starting CBBA Python Service on port {Config.FLASK_PORT}")
    print(f"Model storage path: {Config.MODEL_STORAGE_PATH}")
    app.run(
        host=Config.FLASK_HOST,
        port=Config.FLASK_PORT,
        debug=Config.DEBUG
    )
