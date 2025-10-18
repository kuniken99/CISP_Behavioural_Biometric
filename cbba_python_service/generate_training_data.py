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
    """Generate REALISTIC keystroke patterns with human imperfections"""
    keystrokes = []
    current_time = 0
    
    # Vary typing speed with EXTREME variation to match real users
    if typing_speed_variation == 'fast':
        avg_key_interval = 100  # Very fast typing (~120 WPM - professional level)
        std_dev = 60  # HUGE variation
    elif typing_speed_variation == 'slow':
        avg_key_interval = 450  # Very slow typing (~25 WPM - beginner)
        std_dev = 180  # HUGE variation
    else:
        avg_key_interval = 250  # Normal typing (~50 WPM - typical user)
        std_dev = 120  # HUGE variation for natural rhythm
    
    keys = list('abcdefghijklmnopqrstuvwxyz .,!?1234567890')
    
    # Human behaviors to simulate - INCREASED probabilities
    pause_probability = 0.08  # 8% chance of thinking pause (increased from 5%)
    burst_typing_probability = 0.15  # 15% chance of typing burst (increased from 10%)
    typo_probability = 0.05  # 5% chance of typo + correction (increased from 3%)
    
    while current_time < duration_ms:
        # Simulate human thinking pauses (500-3000ms) - LONGER pauses
        if random.random() < pause_probability:
            pause_duration = random.randint(500, 3000)  # Extended from 2000ms
            current_time += pause_duration
            continue
        
        # Simulate burst typing (faster for short period)
        is_burst = random.random() < burst_typing_probability
        burst_multiplier = random.uniform(0.5, 0.75) if is_burst else 1.0  # Even faster bursts
        
        key = random.choice(keys)
        
        # Simulate typo + backspace + correction
        if random.random() < typo_probability:
            # Type wrong key
            wrong_key = random.choice(keys)
            keystrokes.append({
                'key': wrong_key,
                'timestamp': current_time,
                'event': 'keydown'
            })
            dwell_time = random.randint(60, 120)
            keystrokes.append({
                'key': wrong_key,
                'timestamp': current_time + dwell_time,
                'event': 'keyup'
            })
            current_time += dwell_time + random.randint(80, 150)
            
            # Realize mistake, pause slightly
            current_time += random.randint(100, 300)
            
            # Press backspace
            keystrokes.append({
                'key': 'Backspace',
                'timestamp': current_time,
                'event': 'keydown'
            })
            dwell_time = random.randint(70, 110)
            keystrokes.append({
                'key': 'Backspace',
                'timestamp': current_time + dwell_time,
                'event': 'keyup'
            })
            current_time += dwell_time + random.randint(100, 200)
        
        # Keydown event
        keystrokes.append({
            'key': key,
            'timestamp': current_time,
            'event': 'keydown'
        })
        
        # Dwell time (how long key is pressed) - varies by user with EXTREME randomness
        if typing_speed_variation == 'fast':
            dwell_time = random.randint(20, 150)  # Wider range
        elif typing_speed_variation == 'slow':
            dwell_time = random.randint(70, 350)  # Wider range
        else:
            dwell_time = random.randint(40, 220)  # Wider range for natural variation
        
        # Keyup event
        keystrokes.append({
            'key': key,
            'timestamp': current_time + dwell_time,
            'event': 'keyup'
        })
        
        # Flight time (time to next key) with burst adjustment and EXTREME variation
        flight_time = int(random.gauss(avg_key_interval, std_dev) * burst_multiplier)
        flight_time = max(10, min(flight_time, 1500))  # Cap at 1.5 seconds max (increased from 1 sec)
        
        current_time += dwell_time + flight_time
    
    print(f"    Generated {len(keystrokes)} keystroke events ({typing_speed_variation} speed)")
    return keystrokes

def generate_diverse_mouse_data(duration_ms=30000, pattern='normal'):
    """Generate REALISTIC mouse movement patterns with human imperfections"""
    mouse_data = []
    current_time = 0
    x, y = random.randint(400, 600), random.randint(300, 500)  # Random start position
    
    # Human behaviors - INCREASED probabilities for more diversity
    overshoot_probability = 0.12  # 12% chance of overshooting target (increased from 8%)
    micro_correction_probability = 0.20  # 20% chance of small corrections (increased from 15%)
    pause_probability = 0.15  # 15% chance of pausing mouse (increased from 10%)
    
    while current_time < duration_ms:
        # Random pause (reading, thinking) - LONGER pauses
        if random.random() < pause_probability:
            pause_duration = random.randint(200, 1500)  # Extended from 1000ms
            current_time += pause_duration
            continue
        
        if pattern == 'smooth':
            # Smooth, controlled movements with micro-corrections
            dx = random.randint(-12, 12)  # Increased from -8 to 8
            dy = random.randint(-12, 12)
            interval = random.randint(25, 80)  # Wider range
        elif pattern == 'erratic':
            # Fast, erratic movements (scanning, searching)
            dx = random.randint(-80, 80)  # Increased from -60 to 60
            dy = random.randint(-80, 80)
            interval = random.randint(70, 180)  # Wider range
        elif pattern == 'fast':
            # Fast but controlled with variation
            dx = random.randint(-50, 50)  # Increased from -35 to 35
            dy = random.randint(-50, 50)
            interval = random.randint(20, 70)  # Wider range
        else:  # normal
            # Normal movements with natural variation
            dx = random.randint(-35, 35)  # Increased from -25 to 25
            dy = random.randint(-35, 35)
            interval = random.randint(50, 120)  # Wider range
        
        # Simulate overshoot and correction (realistic human behavior)
        if random.random() < overshoot_probability:
            # Overshoot the movement
            dx = int(dx * random.uniform(1.5, 2.5))
            dy = int(dy * random.uniform(1.5, 2.5))
            
            # Add correction movement next
            mouse_data.append({
                'x': max(0, min(1920, x + dx)),
                'y': max(0, min(1080, y + dy)),
                'timestamp': current_time,
                'event': 'mousemove'
            })
            current_time += interval
            
            # Correct back
            dx = -int(dx * random.uniform(0.3, 0.5))
            dy = -int(dy * random.uniform(0.3, 0.5))
        
        # Micro-corrections (small jittery movements) - MORE jitter
        if random.random() < micro_correction_probability:
            dx += random.randint(-5, 5)  # Increased from -3 to 3
            dy += random.randint(-5, 5)
        
        # Keep within screen bounds
        x = max(0, min(1920, x + dx))
        y = max(0, min(1080, y + dy))
        
        mouse_data.append({
            'x': x,
            'y': y,
            'timestamp': current_time,
            'event': 'mousemove'
        })
        
        # Add occasional clicks (realistic user behavior) - EVEN MORE CLICKS for diversity
        if random.random() < 0.08:  # 8% chance (increased from 5%)
            # Add some click variability (not all at exact same position)
            click_x = x + random.randint(-3, 3)  # Increased from -2 to 2
            click_y = y + random.randint(-3, 3)
            mouse_data.append({
                'x': click_x,
                'y': click_y,
                'timestamp': current_time + 10,
                'event': 'click',
                'button': 0
            })
        
        # Add occasional scrolls with variation
        if random.random() < 0.03:  # 3% chance (increased from 2%)
            scroll_amount = random.choice([
                random.randint(-50, -20),   # Small scroll up
                random.randint(20, 50),     # Small scroll down
                random.randint(-150, -80),  # Large scroll up
                random.randint(80, 150)     # Large scroll down
            ])
            mouse_data.append({
                'deltaY': scroll_amount,
                'deltaX': random.randint(-5, 5),  # Occasional horizontal scroll
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
            json={'trainingData': training_data}
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
        elif response.status_code == 401:
            print(f"✗ Authentication Failed!\n")
            print(f"Status Code: 401 Unauthorized")
            print(f"Error: JWT token is expired or invalid\n")
            print(f"To get a new token:")
            print(f"  1. Login to the application at http://localhost:3000")
            print(f"  2. Open browser console (F12)")
            print(f"  3. Run: localStorage.getItem('jwt_token')")
            print(f"  4. Copy the new token and try again\n")
            return False
        elif response.status_code == 413:
            print(f"✗ Request Too Large!\n")
            print(f"Status Code: 413 Payload Too Large")
            print(f"Error: Training data size exceeds backend limits\n")
            print(f"Solution:")
            print(f"  1. Restart the backend server to apply new size limits:")
            print(f"     cd E:\\CISP_Behavioural_Biometric\\backend")
            print(f"     dotnet run")
            print(f"  2. Wait for 'Now listening on: http://localhost:5000'")
            print(f"  3. Try training again with your current sample count\n")
            print(f"Note: Backend now supports up to 500MB (10,000+ samples)\n")
            return False
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
    print("  num_samples  - Number of training samples (default: 100, recommended: 200-500)\n")
    print("Recommended sample counts:")
    print("  • Basic training:     100-200 samples (faster, decent accuracy)")
    print("  • Good accuracy:      200-500 samples (balanced, recommended)")
    print("  • High accuracy:      500-1000 samples (better false positive reduction)")
    print("  • Maximum accuracy:   1000-5000 samples (best accuracy, slower training)\n")
    print("Example:")
    print("  python generate_training_data.py tank108 eyJhbGciOi... 500\n")
    print("How to get your JWT token:")
    print("  1. Login to the application")
    print("  2. Open browser console (F12)")
    print("  3. Run: localStorage.getItem('jwt_token')")
    print("  4. Copy the token (without quotes)")
    print("  5. Token expires after inactivity - if 401 error, get a new token\n")
    print("="*60 + "\n")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print_usage()
        sys.exit(1)
    
    username = sys.argv[1]
    jwt_token = sys.argv[2]
    num_samples = int(sys.argv[3]) if len(sys.argv) > 3 else 100
    
    # Validate inputs
    if not username or not jwt_token:
        print("Error: Username and JWT token are required!\n")
        print_usage()
        sys.exit(1)
    
    if num_samples < 20:
        print(f"Error: At least 20 samples required for training, got {num_samples}.")
        print(f"Recommended: 200-500 samples for good accuracy.\n")
        sys.exit(1)
    
    if num_samples > 5000:
        print(f"Warning: {num_samples} samples is very high and may take a long time.")
        print(f"Recommended maximum: 5000 samples for best balance.\n")
        confirm = input("Continue anyway? (yes/no): ")
        if confirm.lower() != 'yes':
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
