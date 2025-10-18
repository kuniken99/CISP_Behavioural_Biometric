"""
CBBA Training Data Generator
Generates diverse behavioral biometric samples for model training
"""
import random
import numpy as np
import requests
import json
import sys

def generate_diverse_keystroke_data(duration_ms=30000, typing_speed_variation='normal'):
    """Generate diverse keystroke patterns"""
    keystrokes = []
    current_time = 0
    
    # Vary typing speed
    if typing_speed_variation == 'fast':
        avg_key_interval = 80  # Fast typing (~750 WPM)
        std_dev = 20
    elif typing_speed_variation == 'slow':
        avg_key_interval = 300  # Slow typing (~200 WPM)
        std_dev = 80
    else:
        avg_key_interval = 150  # Normal typing (~400 WPM)
        std_dev = 50
    
    keys = list('abcdefghijklmnopqrstuvwxyz .,!?1234567890')
    
    while current_time < duration_ms:
        key = random.choice(keys)
        
        # Keydown event
        keystrokes.append({
            'key': key,
            'timestamp': current_time,
            'event': 'keydown'
        })
        
        # Dwell time (how long key is pressed) - varies by user
        if typing_speed_variation == 'fast':
            dwell_time = random.randint(40, 100)
        elif typing_speed_variation == 'slow':
            dwell_time = random.randint(100, 250)
        else:
            dwell_time = random.randint(60, 150)
        
        # Keyup event
        keystrokes.append({
            'key': key,
            'timestamp': current_time + dwell_time,
            'event': 'keyup'
        })
        
        # Flight time (time to next key)
        flight_time = int(random.gauss(avg_key_interval, std_dev))
        flight_time = max(10, flight_time)  # Minimum 10ms between keys
        
        current_time += dwell_time + flight_time
    
    print(f"    Generated {len(keystrokes)} keystroke events ({typing_speed_variation} speed)")
    return keystrokes

def generate_diverse_mouse_data(duration_ms=30000, pattern='normal'):
    """Generate diverse mouse movement patterns"""
    mouse_data = []
    current_time = 0
    x, y = random.randint(400, 600), random.randint(300, 500)  # Random start position
    
    while current_time < duration_ms:
        if pattern == 'smooth':
            # Smooth, controlled movements (precise user)
            dx = random.randint(-5, 5)
            dy = random.randint(-5, 5)
            interval = 50
        elif pattern == 'erratic':
            # Fast, erratic movements (scanning, searching)
            dx = random.randint(-50, 50)
            dy = random.randint(-50, 50)
            interval = 100
        elif pattern == 'fast':
            # Fast but controlled
            dx = random.randint(-30, 30)
            dy = random.randint(-30, 30)
            interval = 40
        else:  # normal
            # Normal movements
            dx = random.randint(-20, 20)
            dy = random.randint(-20, 20)
            interval = 75
        
        # Keep within screen bounds
        x = max(0, min(1920, x + dx))
        y = max(0, min(1080, y + dy))
        
        mouse_data.append({
            'x': x,
            'y': y,
            'timestamp': current_time,
            'event': 'mousemove'
        })
        
        # Add occasional clicks (realistic user behavior)
        if random.random() < 0.03:  # 3% chance per movement
            mouse_data.append({
                'x': x,
                'y': y,
                'timestamp': current_time + 10,
                'event': 'click',
                'button': 0
            })
        
        # Add occasional scrolls
        if random.random() < 0.02:  # 2% chance
            mouse_data.append({
                'deltaY': random.randint(-100, 100),
                'deltaX': 0,
                'timestamp': current_time + 20,
                'event': 'scroll'
            })
        
        current_time += interval
    
    print(f"    Generated {len(mouse_data)} mouse events ({pattern} pattern)")
    return mouse_data

def generate_training_session(session_type='normal'):
    """Generate a complete training session with varied behavior"""
    print(f"  Creating {session_type} session...")
    
    if session_type == 'fast_typing':
        keystroke_data = generate_diverse_keystroke_data(30000, 'fast')
        mouse_data = generate_diverse_mouse_data(30000, 'smooth')
    elif session_type == 'slow_typing':
        keystroke_data = generate_diverse_keystroke_data(30000, 'slow')
        mouse_data = generate_diverse_mouse_data(30000, 'smooth')
    elif session_type == 'erratic_mouse':
        keystroke_data = generate_diverse_keystroke_data(30000, 'normal')
        mouse_data = generate_diverse_mouse_data(30000, 'erratic')
    elif session_type == 'fast_interaction':
        keystroke_data = generate_diverse_keystroke_data(30000, 'fast')
        mouse_data = generate_diverse_mouse_data(30000, 'fast')
    else:  # normal
        keystroke_data = generate_diverse_keystroke_data(30000, 'normal')
        mouse_data = generate_diverse_mouse_data(30000, 'normal')
    
    return {
        'keystroke_data': keystroke_data,
        'mouse_data': mouse_data
    }

def train_user_profile(username, jwt_token, num_samples=20):
    """Train user profile with diverse behavioral data"""
    
    print(f"\n{'='*60}")
    print(f"CBBA Model Training for User: {username}")
    print(f"{'='*60}\n")
    
    # Generate diverse training sessions
    training_data = []
    
    # Mix of different behavioral patterns
    session_types = ['normal', 'fast_typing', 'slow_typing', 'erratic_mouse', 'fast_interaction']
    
    print(f"Generating {num_samples} diverse training samples...\n")
    
    for i in range(num_samples):
        session_type = session_types[i % len(session_types)]
        print(f"Sample {i+1}/{num_samples}:")
        session = generate_training_session(session_type)
        training_data.append(session)
    
    print(f"\n{'='*60}")
    print(f"Training model with {num_samples} samples...")
    print(f"{'='*60}\n")
    
    try:
        # Send to backend API
        response = requests.post(
            'http://localhost:5000/api/Biometric/train',
            headers={
                'Authorization': f'Bearer {jwt_token}',
                'Content-Type': 'application/json'
            },
            json={'trainingData': training_data},
            timeout=120  # 2 minute timeout for training
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Training Successful!\n")
            print(f"Results:")
            print(f"  • Samples trained: {result.get('samplesTrained', num_samples)}")
            print(f"  • Profile status: {result.get('status', 'trained')}")
            print(f"  • User ID: {result.get('userId', username)}")
            print(f"  • Model ready: Yes")
            print(f"\n{'='*60}")
            print(f"Model is now ready for dynamic 0-100% risk scoring!")
            print(f"{'='*60}\n")
            return True
        else:
            print(f"✗ Training Failed!\n")
            print(f"Status Code: {response.status_code}")
            print(f"Error: {response.text}\n")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"✗ Connection Error!\n")
        print(f"Could not connect to backend at http://localhost:5000")
        print(f"Make sure the backend service is running:\n")
        print(f"  cd E:\\CISP_Behavioural_Biometric\\backend")
        print(f"  dotnet run\n")
        return False
    except Exception as e:
        print(f"✗ Training Error!\n")
        print(f"Error: {str(e)}\n")
        return False

def print_usage():
    """Print usage instructions"""
    print("\n" + "="*60)
    print("CBBA Model Training Data Generator")
    print("="*60 + "\n")
    print("Usage:")
    print("  python generate_training_data.py <username> <jwt_token> [num_samples]\n")
    print("Parameters:")
    print("  username     - Your username (e.g., tank108)")
    print("  jwt_token    - Your JWT authentication token")
    print("  num_samples  - Number of training samples (default: 50, minimum: 50)\n")
    print("Example:")
    print("  python generate_training_data.py tank108 eyJhbGciOi... 50\n")
    print("How to get your JWT token:")
    print("  1. Login to the application")
    print("  2. Open browser console (F12)")
    print("  3. Run: localStorage.getItem('jwt_token')")
    print("  4. Copy the token (without quotes)\n")
    print("="*60 + "\n")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print_usage()
        sys.exit(1)
    
    username = sys.argv[1]
    jwt_token = sys.argv[2]
    num_samples = int(sys.argv[3]) if len(sys.argv) > 3 else 50
    
    # Validate inputs
    if not username or not jwt_token:
        print("Error: Username and JWT token are required!\n")
        print_usage()
        sys.exit(1)
    
    if num_samples < 50:
        print(f"Error: At least 50 samples required for training, got {num_samples}.")
        print(f"This is required by the ML models for accurate behavioral profiling.\n")
        sys.exit(1)
    
    # Run training
    success = train_user_profile(username, jwt_token, num_samples)
    
    if success:
        print("Next steps:")
        print("  1. Refresh your browser")
        print("  2. Interact with the application")
        print("  3. Watch risk scores vary dynamically (0-100%)")
        print("  4. Check console for: [CBBA] Combined: XX.X%\n")
        sys.exit(0)
    else:
        print("Training failed. Please check the errors above and try again.\n")
        sys.exit(1)
