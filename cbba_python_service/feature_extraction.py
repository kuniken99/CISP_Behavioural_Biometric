# cbba_python_service/feature_extraction.py
import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime


class FeatureExtractor:
    """Extract features from raw behavioral data"""
    
    @staticmethod
    def extract_keystroke_features(keystroke_data: List[Dict]) -> np.ndarray:
        """
        Extract features from keystroke dynamics data
        
        Keystroke metrics:
        - Dwell Time: Time between key press and release
        - Flight Time: Time between releasing one key and pressing the next
        - Typing Speed: Characters per second
        
        Args:
            keystroke_data: List of keystroke events
            [{'key': 'a', 'timestamp': 1234567890, 'event': 'keydown'}, ...]
            
        Returns:
            Feature vector as numpy array
        """
        if not keystroke_data or len(keystroke_data) < 2:
            return np.zeros(7)  # Return zero vector if insufficient data
        
        dwell_times = []
        flight_times = []
        typing_speeds = []
        
        key_press_times = {}
        last_release_time = None
        char_count = 0
        start_time = None
        end_time = None
        
        for event in keystroke_data:
            key = event.get('key', '')
            timestamp = event.get('timestamp', 0)
            event_type = event.get('event', '')
            
            if start_time is None:
                start_time = timestamp  # Record first keystroke timestamp
            end_time = timestamp        # Continuously update to last keystroke
            
            if event_type == 'keydown':
                key_press_times[key] = timestamp    # Store press time for dwell calculation
                
                # Calculate flight time (time from last key release to this press)
                if last_release_time is not None:
                    flight_time = timestamp - last_release_time
                    if 0 < flight_time < 2000:  # Filter outliers (< 2 seconds)
                        flight_times.append(flight_time)
                        
            elif event_type == 'keyup':
                if key in key_press_times:
                    # Calculate dwell time (key press duration)
                    dwell_time = timestamp - key_press_times[key]
                    if 0 < dwell_time < 1000:  # Filter outliers (< 1 second)
                        dwell_times.append(dwell_time)
                    
                    last_release_time = timestamp       # Update for next flight time
                    char_count += 1                     # Increment character counter
                    del key_press_times[key]            # Remove from active keys
        
        # Calculate typing speed (characters per second)
        if start_time and end_time and end_time > start_time:
            duration_seconds = (end_time - start_time) / 1000.0 # Convert ms to seconds
            if duration_seconds > 0:
                typing_speed = char_count / duration_seconds    # Characters per second
                typing_speeds.append(typing_speed)
        
        # Extract statistical features
        features = []
        
        # Dwell time features
        if dwell_times:
            features.append(np.mean(dwell_times))
            features.append(np.std(dwell_times))
        else:
            features.extend([0, 0])
        
        # Flight time features
        if flight_times:
            features.append(np.mean(flight_times))
            features.append(np.std(flight_times))
        else:
            features.extend([0, 0])
        
        # Typing speed features
        if typing_speeds:
            features.append(np.mean(typing_speeds))
            features.append(np.std(typing_speeds) if len(typing_speeds) > 1 else 0)
        else:
            features.extend([0, 0])
        
        # Key press variance (rhythm consistency)
        if dwell_times and len(dwell_times) > 1:
            features.append(np.var(dwell_times))
        else:
            features.append(0)
        
        return np.array(features)
    
    @staticmethod
    def extract_mouse_features(mouse_data: List[Dict]) -> np.ndarray:
        """
        Extract features from mouse dynamics data
        
        Mouse metrics:
        - Velocity: Speed of cursor movement
        - Acceleration: Rate of velocity change
        - Curvature: Path deviation from straight line
        - Click patterns: Click rate, double-click timing
        - Scroll habits: Scroll speed and frequency
        - Repetitive clicks: Bot detection (same coordinate clicks)
        
        Args:
            mouse_data: List of mouse events
            [{'x': 100, 'y': 200, 'timestamp': 1234567890, 'event': 'move'}, ...]
            
        Returns:
            Feature vector as numpy array
        """
        # DEBUG: Log all event types received
        event_types = {}
        for event in mouse_data:
            event_type = event.get('event', 'unknown')
            event_types[event_type] = event_types.get(event_type, 0) + 1
        print(f"[MOUSE DEBUG] Received {len(mouse_data)} events: {event_types}")
        
        if not mouse_data or len(mouse_data) < 3:
            return np.zeros(11)  # Increased from 10 to 11 features
        
        velocities = []             # Store cursor speeds
        accelerations = []          # Store velocity change rates
        curvatures = []             # Store path angles
        click_times = []            # Store click timestamps
        click_positions = []        # Track click coordinates
        double_click_intervals = [] # Store time between consecutive clicks
        scroll_speeds = []          # Store scrolling velocities
        
        prev_x, prev_y, prev_time = None, None, None  # Previous cursor state
        prev_velocity = None                          # Previous velocity for acceleration
        last_click_time = None                        # Last click timestamp
        path_length = 0                               # Actual cursor path distance
        straight_line_distance = 0                    # Direct start-to-end distance

        first_pos = None                              # Session start position
        last_pos = None                               # Session end position
                
        for i, event in enumerate(mouse_data):
            x = event.get('x', 0)                    # Current cursor X coordinate
            y = event.get('y', 0)                    # Current cursor Y coordinate
            timestamp = event.get('timestamp', 0)    # Event time in milliseconds
            event_type = event.get('event', '')      # 'mousemove', 'click', or 'scroll'
            
            if event_type == 'mousemove':
                if first_pos is None:
                    first_pos = (x, y)  # Record starting position
                last_pos = (x, y)           # Continuously update ending position
                
                if prev_x is not None and prev_time is not None:
                    # Calculate distance and time
                    distance = np.sqrt((x - prev_x)**2 + (y - prev_y)**2)
                    time_diff = (timestamp - prev_time) / 1000.0  # Convert to seconds
                    
                    if time_diff > 0 and distance > 0:
                        # Velocity (pixels per second)
                        velocity = distance / time_diff
                        if velocity < 10000:  # Filter outliers
                            velocities.append(velocity)
                            
                            # Acceleration
                            if prev_velocity is not None:
                                acceleration = (velocity - prev_velocity) / time_diff
                                if abs(acceleration) < 100000:  # Filter outliers
                                    accelerations.append(abs(acceleration))
                            
                            prev_velocity = velocity    # Store for next iteration

                        path_length += distance  # Accumulate total path distance

                        # Calculate curvature (angle change)
                        if i >= 2:  # Need at least 3 points
                            prev_event = mouse_data[i-2]
                            px, py = prev_event.get('x', 0), prev_event.get('y', 0)
                            
                            # Vector from previous to current
                            v1 = (prev_x - px, prev_y - py)
                            v2 = (x - prev_x, y - prev_y)
                            
                            # Calculate angle between vectors
                            dot_product = v1[0]*v2[0] + v1[1]*v2[1]
                            mag1 = np.sqrt(v1[0]**2 + v1[1]**2)
                            mag2 = np.sqrt(v2[0]**2 + v2[1]**2)
                            
                            if mag1 > 0 and mag2 > 0:
                                cos_angle = dot_product / (mag1 * mag2) # Cosine formula
                                cos_angle = np.clip(cos_angle, -1, 1)   # Numerical stability
                                angle = np.arccos(cos_angle)            # Angle in radians
                                curvatures.append(angle)
                
                prev_x, prev_y, prev_time = x, y, timestamp
                
            elif event_type == 'click':
                click_times.append(timestamp)
                click_positions.append((x, y))  # Store click position
                print(f"[CLICK DEBUG] Click event at ({x}, {y}) timestamp={timestamp}")
                
                # Detect double clicks
                if last_click_time is not None:
                    interval = timestamp - last_click_time
                    if 0 < interval < 1000:  # Within 1 second
                        double_click_intervals.append(interval)
                
                last_click_time = timestamp
                
            elif event_type == 'scroll':
                delta = event.get('deltaY', 0)   # Scroll amount (pixels or lines)
                if prev_time is not None:
                    time_diff = (timestamp - prev_time) / 1000.0
                    if time_diff > 0:
                        scroll_speed = abs(delta) / time_diff   # Pixels per second
                        if scroll_speed < 10000:  # Filter outliers
                            scroll_speeds.append(scroll_speed)
                
                prev_time = timestamp
        
        # Calculate path efficiency (straight line / actual path)
        if first_pos and last_pos and path_length > 0:
            straight_line_distance = np.sqrt(
                (last_pos[0] - first_pos[0])**2 + 
                (last_pos[1] - first_pos[1])**2
            )
            path_efficiency = straight_line_distance / path_length
        else:
            path_efficiency = 0
        
        # Bot Detection: Repetitive clicks at same coordinates
        repetitive_click_ratio = 0.0
        if len(click_positions) >= 3:
            # Count clicks at identical coordinates (within 5 pixel tolerance)
            repetitive_clicks = 0
            tolerance = 5  # pixels
            
            # DEBUG: Log click positions
            print(f"[FEATURE DEBUG] Total clicks: {len(click_positions)}")
            print(f"[FEATURE DEBUG] Click positions (first 10): {click_positions[:10]}")
            
            for i in range(len(click_positions)):
                same_position_clicks = 0
                for j in range(len(click_positions)):
                    if i != j:
                        # Calculate distance between clicks
                        dist = np.sqrt(
                            (click_positions[i][0] - click_positions[j][0])**2 + 
                            (click_positions[i][1] - click_positions[j][1])**2
                        )
                        if dist <= tolerance:
                            same_position_clicks += 1
                
                # If 2+ clicks at same position, count as repetitive
                if same_position_clicks >= 2:
                    repetitive_clicks += 1
            
            # Calculate ratio of repetitive clicks
            repetitive_click_ratio = repetitive_clicks / len(click_positions)
            
            # DEBUG: Log detection results
            print(f"[FEATURE DEBUG] Repetitive clicks detected: {repetitive_clicks}/{len(click_positions)} = {repetitive_click_ratio*100:.1f}%")
        
        # Extract statistical features
        features = []
        
        # Velocity features
        if velocities:
            features.append(np.mean(velocities))    # Average cursor speed
            features.append(np.std(velocities))     # Speed consistency
        else:
            features.extend([0, 0])

        # Acceleration features
        if accelerations:
            features.append(np.mean(accelerations))  # Average smoothness
            features.append(np.std(accelerations))   # Smoothness variability
        else:
            features.extend([0, 0])

        # Curvature features
        if curvatures:
            features.append(np.mean(curvatures))    # Average path curvature
            features.append(np.std(curvatures))     # Path consistency
        else:
            features.extend([0, 0])
        
        # Click rate (clicks per second)
        if click_times and len(click_times) > 1:
            duration = (click_times[-1] - click_times[0]) / 1000.0
            click_rate = len(click_times) / duration if duration > 0 else 0
            features.append(click_rate)
        else:
            features.append(0)
        
        # Double-click rate
        if double_click_intervals:
            features.append(len(double_click_intervals) / len(click_times) if click_times else 0)
        else:
            features.append(0)
        
        # Scroll speed
        if scroll_speeds:
            features.append(np.mean(scroll_speeds))
        else:
            features.append(0)
        
        # Path efficiency
        features.append(path_efficiency)
        
        # Repetitive click ratio (bot detection)
        features.append(repetitive_click_ratio)
        
        return np.array(features)   # Returns 11-dimensional numpy array
    
    @staticmethod
    def combine_features(keystroke_features: np.ndarray, mouse_features: np.ndarray) -> np.ndarray:
        """
        Combine keystroke and mouse features into single feature vector
        
        Args:
            keystroke_features: Keystroke feature vector
            mouse_features: Mouse feature vector
            
        Returns:
            Combined feature vector
        """
        return np.concatenate([keystroke_features, mouse_features])
