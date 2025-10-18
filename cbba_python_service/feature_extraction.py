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
        - Typing Speed: Characters per second (WEIGHTED for fast typing detection)
        
        Args:
            keystroke_data: List of keystroke events
            [{'key': 'a', 'timestamp': 1234567890, 'event': 'keydown'}, ...]
            
        Returns:
            Feature vector as numpy array with enhanced velocity metrics
        """
        if not keystroke_data or len(keystroke_data) < 2:
            return np.zeros(10)  # Updated from 7 to 10 for additional velocity features
        
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
                start_time = timestamp
            end_time = timestamp
            
            if event_type == 'keydown':
                key_press_times[key] = timestamp
                
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
                    
                    last_release_time = timestamp
                    char_count += 1
                    del key_press_times[key]
        
        # Calculate typing speed (characters per second)
        if start_time and end_time and end_time > start_time:
            duration_seconds = (end_time - start_time) / 1000.0
            if duration_seconds > 0:
                typing_speed = char_count / duration_seconds
                typing_speeds.append(typing_speed)
        
        # Extract statistical features
        features = []
        
        # Dwell time features (ENHANCED for fast keypress detection)
        if dwell_times:
            mean_dwell = np.mean(dwell_times)
            std_dwell = np.std(dwell_times)
            
            # Normal dwell: 80-200ms for legitimate users
            # Fast dwell: <50ms may indicate automated input
            features.append(mean_dwell)
            features.append(std_dwell)
            
            # Rapid keypress detection: Count very short dwell times
            rapid_keypress_count = sum(1 for dt in dwell_times if dt < 50)
            rapid_keypress_ratio = rapid_keypress_count / len(dwell_times) if dwell_times else 0
            features.append(rapid_keypress_ratio)  # NEW: Rapid keypress ratio
        else:
            features.extend([0, 0, 0])  # Updated from 2 to 3 features
        
        # Flight time features
        if flight_times:
            features.append(np.mean(flight_times))
            features.append(np.std(flight_times))
        else:
            features.extend([0, 0])
        
        # Typing speed features (ENHANCED for fast typing detection)
        if typing_speeds:
            mean_typing_speed = np.mean(typing_speeds)
            std_typing_speed = np.std(typing_speeds) if len(typing_speeds) > 1 else 0
            
            # Normal typing: 3-8 chars/sec for legitimate users
            # Fast/automated typing: 10-20+ chars/sec for attackers
            features.append(mean_typing_speed)
            features.append(std_typing_speed)
            
            # Fast typing detection: Above 10 chars/sec threshold
            fast_typing_indicator = 1.0 if mean_typing_speed > 10.0 else 0.0
            features.append(fast_typing_indicator)  # NEW: Fast typing flag
        else:
            features.extend([0, 0, 0])  # Updated from 2 to 3 features
        
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
        - Velocity: Speed of cursor movement (WEIGHTED HEAVILY for fast movement detection)
        - Acceleration: Rate of velocity change
        - Curvature: Path deviation from straight line
        - Click patterns: Click rate, double-click timing
        - Scroll habits: Scroll speed and frequency
        
        Args:
            mouse_data: List of mouse events
            [{'x': 100, 'y': 200, 'timestamp': 1234567890, 'event': 'move'}, ...]
            
        Returns:
            Feature vector as numpy array with enhanced velocity metrics
        """
        if not mouse_data or len(mouse_data) < 3:
            return np.zeros(13)  # Updated from 10 to 13 for additional velocity features
        
        velocities = []
        accelerations = []
        curvatures = []
        click_times = []
        double_click_intervals = []
        scroll_speeds = []
        
        prev_x, prev_y, prev_time = None, None, None
        prev_velocity = None
        last_click_time = None
        path_length = 0
        straight_line_distance = 0
        
        first_pos = None
        last_pos = None
        
        for i, event in enumerate(mouse_data):
            x = event.get('x', 0)
            y = event.get('y', 0)
            timestamp = event.get('timestamp', 0)
            event_type = event.get('event', '')
            
            if event_type == 'mousemove':
                if first_pos is None:
                    first_pos = (x, y)
                last_pos = (x, y)
                
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
                            
                            prev_velocity = velocity
                        
                        path_length += distance
                        
                        # Calculate curvature (angle change)
                        if i >= 2:
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
                                cos_angle = dot_product / (mag1 * mag2)
                                cos_angle = np.clip(cos_angle, -1, 1)
                                angle = np.arccos(cos_angle)
                                curvatures.append(angle)
                
                prev_x, prev_y, prev_time = x, y, timestamp
                
            elif event_type == 'click':
                click_times.append(timestamp)
                
                # Detect double clicks
                if last_click_time is not None:
                    interval = timestamp - last_click_time
                    if 0 < interval < 1000:  # Within 1 second
                        double_click_intervals.append(interval)
                
                last_click_time = timestamp
                
            elif event_type == 'scroll':
                delta = event.get('deltaY', 0)
                if prev_time is not None:
                    time_diff = (timestamp - prev_time) / 1000.0
                    if time_diff > 0:
                        scroll_speed = abs(delta) / time_diff
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
        
        # Extract statistical features
        features = []
        
        # Velocity features (ENHANCED for fast movement detection)
        if velocities:
            mean_velocity = np.mean(velocities)
            max_velocity = np.max(velocities)
            std_velocity = np.std(velocities)
            
            # Normal baseline: ~200-500 px/s for legitimate users
            # Attacker baseline: ~800-2000+ px/s for automated/rapid movements
            features.append(mean_velocity)
            features.append(std_velocity)
            features.append(max_velocity)  # NEW: Peak velocity for burst detection
            
            # Fast movement detection: Count movements above 1000 px/s threshold
            rapid_movement_count = sum(1 for v in velocities if v > 1000)
            rapid_movement_ratio = rapid_movement_count / len(velocities) if velocities else 0
            features.append(rapid_movement_ratio)  # NEW: Rapid movement ratio
        else:
            features.extend([0, 0, 0, 0])  # Updated from 2 to 4 features
        
        # Acceleration features (ENHANCED for sudden movement detection)
        if accelerations:
            mean_accel = np.mean(accelerations)
            max_accel = np.max(accelerations)
            features.append(mean_accel)
            features.append(max_accel)  # NEW: Peak acceleration
        else:
            features.extend([0, 0])  # Updated from 2 to 2 (kept same)
        
        # Curvature features
        if curvatures:
            features.append(np.mean(curvatures))
            features.append(np.std(curvatures))
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
        
        return np.array(features)
    
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
