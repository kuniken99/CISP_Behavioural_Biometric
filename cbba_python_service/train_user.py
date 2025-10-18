"""
Training script for CBBA system
Generates realistic behavioral data and trains user profiles
"""
import json
import random
import time
import requests
from datetime import datetime

def generate_keystroke_sample():
    """Generate realistic keystroke dynamics data"""
    return {
        "key": random.choice(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']),
        "timestamp": time.time() * 1000,
        "dwell_time": random.uniform(50, 150),  # ms key held down
        "flight_time": random.uniform(100, 300),  # ms between keys
    }

def generate_mouse_sample():
    """Generate realistic mouse dynamics data"""
    return {
        "x": random.uniform(100, 1800),
        "y": random.uniform(100, 900),
        "timestamp": time.time() * 1000,
        "click": random.choice([None, 'left', 'right']) if random.random() < 0.1 else None,
    }

def generate_training_session():
    """Generate one behavioral session (keystroke + mouse)"""
    keystroke_data = [generate_keystroke_sample() for _ in range(random.randint(20, 40))]
    mouse_data = [generate_mouse_sample() for _ in range(random.randint(50, 100))]
    
    return {
        "keystroke_data": keystroke_data,
        "mouse_data": mouse_data
    }

def train_user(user_id, num_sessions=60):
    """
    Train a user profile with multiple behavioral sessions
    
    Args:
        user_id: User ID to train
        num_sessions: Number of training sessions (default 60, minimum 50 required)
    """
    print(f"\n{'='*60}")
    print(f"CBBA Training - User ID: {user_id}")
    print(f"{'='*60}\n")
    
    print(f"Generating {num_sessions} training sessions...")
    training_data = []
    
    for i in range(num_sessions):
        session = generate_training_session()
        training_data.append(session)
        
        if (i + 1) % 10 == 0:
            print(f"  Generated {i + 1}/{num_sessions} sessions...")
    
    print(f"\n✓ Generated {num_sessions} training sessions")
    print(f"  - Keystroke samples: ~{sum(len(s['keystroke_data']) for s in training_data)}")
    print(f"  - Mouse samples: ~{sum(len(s['mouse_data']) for s in training_data)}")
    
    # Prepare training request
    payload = {
        "user_id": user_id,
        "training_data": training_data
    }
    
    print(f"\nSending training request to CBBA service...")
    print(f"URL: http://localhost:5001/api/cbba/train")
    
    try:
        response = requests.post(
            "http://localhost:5001/api/cbba/train",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n{'='*60}")
            print(f"✓ TRAINING SUCCESSFUL!")
            print(f"{'='*60}")
            print(f"\nTraining Results:")
            print(f"  - User ID: {result.get('user_id')}")
            print(f"  - Samples Trained: {result.get('samples_trained')}")
            print(f"  - Model Type: Isolation Forest + One-Class SVM")
            print(f"  - Encryption: AES-256")
            print(f"  - Profile Status: {result.get('status')}")
            
            if result.get('model_info'):
                print(f"\nModel Information:")
                for key, value in result['model_info'].items():
                    print(f"  - {key}: {value}")
            
            print(f"\n✓ User {user_id} is now enrolled in CBBA system")
            print(f"✓ Ready for real-time risk assessment\n")
            
            return True
        else:
            print(f"\n✗ Training failed!")
            print(f"Status Code: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"\n✗ ERROR: Cannot connect to CBBA service")
        print(f"Make sure the service is running on http://localhost:5001")
        print(f"Run: python app.py")
        return False
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        return False

def test_assessment(user_id):
    """Test risk assessment after training"""
    print(f"\n{'='*60}")
    print(f"Testing Risk Assessment - User ID: {user_id}")
    print(f"{'='*60}\n")
    
    # Generate test behavioral data (similar to training)
    print("Generating test behavioral data (normal behavior)...")
    test_data = generate_training_session()
    
    payload = {
        "user_id": user_id,
        "keystroke_data": test_data["keystroke_data"],
        "mouse_data": test_data["mouse_data"]
    }
    
    print("Sending assessment request...")
    
    try:
        response = requests.post(
            "http://localhost:5001/api/cbba/assess",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✓ Risk Assessment Complete!")
            print(f"\nResults:")
            print(f"  - Risk Score: {result.get('risk_score')}%")
            print(f"  - Risk Level: {result.get('risk_level')}")
            print(f"  - Anomaly Detected: {result.get('anomaly_detected')}")
            print(f"  - Recommendation: {result.get('recommendation')}")
            
            if result.get('scores'):
                print(f"\nDetailed Scores:")
                for key, value in result['scores'].items():
                    print(f"  - {key}: {value}")
            
            print()
            return True
        else:
            print(f"\n✗ Assessment failed!")
            print(f"Status Code: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        return False

def test_anomalous_behavior(user_id):
    """Test with anomalous behavioral patterns"""
    print(f"\n{'='*60}")
    print(f"Testing Anomaly Detection - User ID: {user_id}")
    print(f"{'='*60}\n")
    
    print("Generating anomalous behavioral data...")
    
    # Generate anomalous keystroke data (much faster/slower typing)
    anomalous_keystroke = [
        {
            "key": random.choice(['a', 'b', 'c']),
            "timestamp": time.time() * 1000 + i * 10,
            "dwell_time": random.uniform(10, 30),  # Much shorter (anomalous)
            "flight_time": random.uniform(20, 50),  # Much faster (anomalous)
        }
        for i in range(30)
    ]
    
    # Generate anomalous mouse data (erratic movements)
    anomalous_mouse = [
        {
            "x": random.uniform(0, 2000),
            "y": random.uniform(0, 1000),
            "timestamp": time.time() * 1000 + i * 5,
            "click": random.choice(['left', 'right']) if random.random() < 0.5 else None,
        }
        for i in range(80)
    ]
    
    payload = {
        "user_id": user_id,
        "keystroke_data": anomalous_keystroke,
        "mouse_data": anomalous_mouse
    }
    
    print("Sending assessment request with anomalous data...")
    
    try:
        response = requests.post(
            "http://localhost:5001/api/cbba/assess",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✓ Anomaly Detection Test Complete!")
            print(f"\nResults:")
            print(f"  - Risk Score: {result.get('risk_score')}%")
            print(f"  - Risk Level: {result.get('risk_level')}")
            print(f"  - Anomaly Detected: {result.get('anomaly_detected')}")
            print(f"  - Recommendation: {result.get('recommendation')}")
            
            if result.get('risk_score', 0) > 50:
                print(f"\n✓ System correctly detected anomalous behavior!")
            else:
                print(f"\n⚠ Warning: Risk score lower than expected for anomalous data")
            
            print()
            return True
        else:
            print(f"\n✗ Assessment failed!")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    print("\n" + "="*60)
    print("CBBA Training & Testing Script")
    print("="*60)
    
    # Get user ID to train
    user_id_input = input("\nEnter User ID to train (press Enter for user 1): ").strip()
    
    # Try to convert to int, otherwise use as string
    if not user_id_input:
        user_id = 1
    else:
        try:
            user_id = int(user_id_input)
        except ValueError:
            user_id = user_id_input  # Use string user ID (e.g., username)
    
    # Train the user
    success = train_user(user_id, num_sessions=60)
    
    if success:
        # Test with normal behavior
        input("\nPress Enter to test risk assessment with normal behavior...")
        test_assessment(user_id)
        
        # Test with anomalous behavior
        input("\nPress Enter to test anomaly detection with suspicious behavior...")
        test_anomalous_behavior(user_id)
        
        print("\n" + "="*60)
        print("Training & Testing Complete!")
        print("="*60)
        print("\nNext steps:")
        print("  1. Start the backend: cd ../backend && dotnet run")
        print("  2. Start the frontend: cd ../frontend && npm start")
        print("  3. Login with the trained user and test CBBA monitoring")
        print()
    else:
        print("\n✗ Training failed. Please check the CBBA service is running.")
