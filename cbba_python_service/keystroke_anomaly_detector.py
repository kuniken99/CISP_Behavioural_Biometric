# cbba_python_service/keystroke_anomaly_detector.py
"""
Advanced Keystroke Dynamics Anomaly Detection

This module implements sophisticated keystroke anomaly detection patterns:
1. Increased Hesitation and Errors (slow typing, many pauses, backspace usage)
2. Shift in Key Hold Durations (dwell time changes)
3. Sudden Change in Speed and Rhythm (typing speed shifts)
4. Dwell Time Anomalies (heavy vs light touch)
5. Flight Time Anomalies (rhythm changes)
"""
import numpy as np
from typing import Dict, List, Tuple


class KeystrokeAnomalyDetector:
    """Detects specific keystroke dynamics anomalies"""
    
    def __init__(self, baseline_profile: Dict = None):
        """
        Initialize with user's baseline keystroke profile
        
        Args:
            baseline_profile: Dictionary containing baseline metrics
                {
                    'avg_dwell_time': float,
                    'std_dwell_time': float,
                    'avg_flight_time': float,
                    'std_flight_time': float,
                    'avg_typing_speed': float,
                    'backspace_ratio': float,
                    'pause_frequency': float
                }
        """
        self.baseline = baseline_profile or {}
    
    def analyze_keystroke_patterns(self, keystroke_data: List[Dict]) -> Tuple[float, Dict]:
        """
        Analyze keystroke data for anomaly patterns
        
        Args:
            keystroke_data: List of keystroke events
            
        Returns:
            Tuple of (anomaly_score, details_dict)
            anomaly_score: 0-100 (0=normal, 100=highly anomalous)
            details_dict: Breakdown of detected anomalies
        """
        if not keystroke_data or len(keystroke_data) < 5:
            return 0.0, {'status': 'insufficient_data'}
        
        # Extract metrics from current session
        metrics = self._extract_metrics(keystroke_data)
        
        # Detect specific anomaly patterns
        anomalies = {
            'hesitation_errors': self._detect_hesitation_errors(metrics),
            'dwell_time_shift': self._detect_dwell_time_shift(metrics),
            'speed_rhythm_change': self._detect_speed_rhythm_change(metrics),
            'heavy_fingered_typing': self._detect_heavy_fingered(metrics),
            'rhythm_disruption': self._detect_rhythm_disruption(metrics)
        }
        
        # Calculate overall anomaly score (weighted average)
        weights = {
            'hesitation_errors': 0.25,      # 25% - Indicates unfamiliarity
            'dwell_time_shift': 0.20,       # 20% - Different touch pressure
            'speed_rhythm_change': 0.25,    # 25% - Different typing speed
            'heavy_fingered_typing': 0.15,  # 15% - Touch style difference
            'rhythm_disruption': 0.15       # 15% - Timing pattern change
        }
        
        total_score = sum(
            anomalies[key]['score'] * weights[key] 
            for key in weights.keys()
        )
        
        # Ensure 0-100 range
        total_score = np.clip(total_score, 0, 100)
        
        details = {
            'total_anomaly_score': float(total_score),
            'anomaly_breakdown': anomalies,
            'current_metrics': metrics,
            'baseline_metrics': self.baseline
        }
        
        return float(total_score), details
    
    def _extract_metrics(self, keystroke_data: List[Dict]) -> Dict:
        """Extract keystroke metrics from event data"""
        dwell_times = []
        flight_times = []
        backspace_count = 0
        total_keys = 0
        long_pauses = 0  # Pauses > 1000ms
        
        key_press_times = {}
        last_release_time = None
        start_time = None
        end_time = None
        
        for event in keystroke_data:
            key = event.get('key', '').lower()
            timestamp = event.get('timestamp', 0)
            event_type = event.get('event', '')
            
            if start_time is None:
                start_time = timestamp
            end_time = timestamp
            
            if event_type == 'keydown':
                key_press_times[key] = timestamp
                
                # Calculate flight time
                if last_release_time is not None:
                    flight_time = timestamp - last_release_time
                    if 0 < flight_time < 5000:  # Max 5 seconds
                        flight_times.append(flight_time)
                        
                        # Count long pauses (indicator of hesitation)
                        if flight_time > 1000:
                            long_pauses += 1
                
                # Count backspace usage
                if key in ['backspace', 'delete']:
                    backspace_count += 1
                    
            elif event_type == 'keyup':
                if key in key_press_times:
                    dwell_time = timestamp - key_press_times[key]
                    if 0 < dwell_time < 1000:
                        dwell_times.append(dwell_time)
                    
                    last_release_time = timestamp
                    total_keys += 1
                    del key_press_times[key]
        
        # Calculate typing speed (WPM)
        typing_speed = 0
        if start_time and end_time and end_time > start_time:
            duration_seconds = (end_time - start_time) / 1000.0
            if duration_seconds > 0:
                # Characters per second -> Words per minute (avg 5 chars per word)
                typing_speed = (total_keys / duration_seconds) * 60 / 5
        
        return {
            'avg_dwell_time': np.mean(dwell_times) if dwell_times else 0,
            'std_dwell_time': np.std(dwell_times) if len(dwell_times) > 1 else 0,
            'min_dwell_time': np.min(dwell_times) if dwell_times else 0,
            'max_dwell_time': np.max(dwell_times) if dwell_times else 0,
            'avg_flight_time': np.mean(flight_times) if flight_times else 0,
            'std_flight_time': np.std(flight_times) if len(flight_times) > 1 else 0,
            'typing_speed_wpm': typing_speed,
            'backspace_ratio': backspace_count / total_keys if total_keys > 0 else 0,
            'pause_frequency': long_pauses / len(flight_times) if flight_times else 0,
            'total_keys': total_keys,
            'backspace_count': backspace_count,
            'long_pauses': long_pauses
        }
    
    def _detect_hesitation_errors(self, metrics: Dict) -> Dict:
        """
        Pattern 1: Increased Hesitation and Errors
        
        Indicators:
        - Much slower typing than baseline
        - Frequent long pauses (>1000ms) between keys
        - High backspace usage (errors and corrections)
        - Indicates attacker unfamiliar with system
        """
        score = 0.0
        indicators = []
        
        baseline_speed = self.baseline.get('avg_typing_speed', 50)  # Default 50 WPM
        current_speed = metrics['typing_speed_wpm']
        baseline_pause_freq = self.baseline.get('pause_frequency', 0.1)
        current_pause_freq = metrics['pause_frequency']
        baseline_backspace = self.baseline.get('backspace_ratio', 0.05)
        current_backspace = metrics['backspace_ratio']
        
        # Check 1: Significantly slower typing (>30% slower)
        if current_speed > 0 and current_speed < baseline_speed * 0.7:
            speed_penalty = min(50, (baseline_speed - current_speed) / baseline_speed * 100)
            score += speed_penalty
            indicators.append(f"Slow typing: {current_speed:.1f} WPM vs baseline {baseline_speed:.1f} WPM (+{speed_penalty:.1f}%)")
        
        # Check 2: High pause frequency
        if current_pause_freq > baseline_pause_freq * 2:
            pause_penalty = min(30, (current_pause_freq - baseline_pause_freq) * 100)
            score += pause_penalty
            indicators.append(f"Frequent pauses: {current_pause_freq*100:.1f}% vs baseline {baseline_pause_freq*100:.1f}% (+{pause_penalty:.1f}%)")
        
        # Check 3: Excessive backspace usage
        if current_backspace > baseline_backspace * 3:
            backspace_penalty = min(20, (current_backspace - baseline_backspace) * 200)
            score += backspace_penalty
            indicators.append(f"High error rate: {current_backspace*100:.1f}% backspaces vs baseline {baseline_backspace*100:.1f}% (+{backspace_penalty:.1f}%)")
        
        return {
            'score': min(score, 100),
            'pattern': 'hesitation_and_errors',
            'description': 'Unfamiliar user - slow, hesitant typing with many errors',
            'indicators': indicators
        }
    
    def _detect_dwell_time_shift(self, metrics: Dict) -> Dict:
        """
        Pattern 2: Shift in Key Hold Durations
        
        Indicators:
        - Consistent change in dwell time (heavier or lighter touch)
        - Different from user's established average
        - Indicates different person with different typing style
        """
        score = 0.0
        indicators = []
        
        baseline_dwell = self.baseline.get('avg_dwell_time', 80)  # Default 80ms
        current_dwell = metrics['avg_dwell_time']
        baseline_std_dwell = self.baseline.get('std_dwell_time', 20)
        
        if current_dwell > 0:
            # Calculate deviation in terms of standard deviations
            dwell_diff = abs(current_dwell - baseline_dwell)
            std_devs = dwell_diff / (baseline_std_dwell + 1e-6)
            
            # Score based on how many std devs away from baseline
            if std_devs > 2.0:
                # More than 2 std devs = significant change
                score = min(100, 40 + (std_devs - 2.0) * 20)
                direction = "heavier" if current_dwell > baseline_dwell else "lighter"
                indicators.append(f"{direction.capitalize()} touch: {current_dwell:.1f}ms vs baseline {baseline_dwell:.1f}ms ({std_devs:.1f} std devs)")
        
        return {
            'score': score,
            'pattern': 'dwell_time_shift',
            'description': 'Different touch pressure/style detected',
            'indicators': indicators
        }
    
    def _detect_speed_rhythm_change(self, metrics: Dict) -> Dict:
        """
        Pattern 3: Sudden Change in Speed and Rhythm
        
        Indicators:
        - Dramatic change in typing speed (much faster or slower)
        - Different rhythm pattern
        - Indicates different typist has taken over session
        """
        score = 0.0
        indicators = []
        
        baseline_speed = self.baseline.get('avg_typing_speed', 50)
        current_speed = metrics['typing_speed_wpm']
        baseline_flight = self.baseline.get('avg_flight_time', 200)
        current_flight = metrics['avg_flight_time']
        
        # Check 1: Dramatic speed change (>50% difference)
        if current_speed > 0:
            speed_ratio = current_speed / baseline_speed
            
            if speed_ratio > 1.5:
                # Much faster (e.g., 120 WPM vs 60 WPM)
                score += min(60, (speed_ratio - 1.5) * 100)
                indicators.append(f"Much faster typing: {current_speed:.1f} WPM vs baseline {baseline_speed:.1f} WPM ({speed_ratio:.1f}x)")
            elif speed_ratio < 0.5:
                # Much slower
                score += min(60, (0.5 - speed_ratio) * 100)
                indicators.append(f"Much slower typing: {current_speed:.1f} WPM vs baseline {baseline_speed:.1f} WPM ({speed_ratio:.1f}x)")
        
        # Check 2: Rhythm change (flight time pattern)
        if current_flight > 0 and baseline_flight > 0:
            flight_ratio = current_flight / baseline_flight
            if abs(flight_ratio - 1.0) > 0.4:  # >40% change in rhythm
                rhythm_penalty = min(40, abs(flight_ratio - 1.0) * 50)
                score += rhythm_penalty
                indicators.append(f"Rhythm changed: {current_flight:.1f}ms vs baseline {baseline_flight:.1f}ms ({flight_ratio:.1f}x)")
        
        return {
            'score': min(score, 100),
            'pattern': 'speed_rhythm_change',
            'description': 'Sudden change in typing speed and rhythm',
            'indicators': indicators
        }
    
    def _detect_heavy_fingered(self, metrics: Dict) -> Dict:
        """
        Pattern 4: Heavy-Fingered Typing (Dwell Time)
        
        Indicators:
        - Consistently longer key hold times
        - Indicates different typing style (heavier touch)
        """
        score = 0.0
        indicators = []
        
        baseline_dwell = self.baseline.get('avg_dwell_time', 80)
        current_dwell = metrics['avg_dwell_time']
        
        if current_dwell > baseline_dwell * 1.5:
            # 50% longer dwell time = heavy-fingered
            penalty = min(100, (current_dwell - baseline_dwell) / baseline_dwell * 80)
            score = penalty
            indicators.append(f"Heavy-fingered: {current_dwell:.1f}ms vs baseline {baseline_dwell:.1f}ms")
        
        return {
            'score': score,
            'pattern': 'heavy_fingered_typing',
            'description': 'Different touch pressure (heavier keys)',
            'indicators': indicators
        }
    
    def _detect_rhythm_disruption(self, metrics: Dict) -> Dict:
        """
        Pattern 5: Flight Time (Rhythm) Disruption
        
        Indicators:
        - Flight times outside normal range
        - Inconsistent rhythm (high std dev)
        - Indicates different person's unique typing rhythm
        """
        score = 0.0
        indicators = []
        
        baseline_flight = self.baseline.get('avg_flight_time', 200)
        current_flight = metrics['avg_flight_time']
        baseline_std_flight = self.baseline.get('std_flight_time', 50)
        current_std_flight = metrics['std_flight_time']
        
        if current_flight > 0:
            # Check if flight time is outside normal range
            flight_diff = abs(current_flight - baseline_flight)
            std_devs = flight_diff / (baseline_std_flight + 1e-6)
            
            if std_devs > 2.0:
                score += min(60, 30 + (std_devs - 2.0) * 15)
                indicators.append(f"Abnormal rhythm: {current_flight:.1f}ms vs baseline {baseline_flight:.1f}ms ({std_devs:.1f} std devs)")
        
        # Check for inconsistent rhythm (high variance)
        if current_std_flight > baseline_std_flight * 2:
            score += min(40, (current_std_flight - baseline_std_flight) / baseline_std_flight * 20)
            indicators.append(f"Inconsistent rhythm: std dev {current_std_flight:.1f}ms vs baseline {baseline_std_flight:.1f}ms")
        
        return {
            'score': min(score, 100),
            'pattern': 'rhythm_disruption',
            'description': 'Typing rhythm outside normal range',
            'indicators': indicators
        }
    
    def update_baseline(self, keystroke_data: List[Dict]):
        """Update baseline profile with new legitimate data"""
        metrics = self._extract_metrics(keystroke_data)
        
        # If no baseline exists, create one
        if not self.baseline:
            self.baseline = metrics
        else:
            # Exponential moving average (70% old, 30% new)
            alpha = 0.3
            for key in metrics:
                if key in self.baseline:
                    self.baseline[key] = (1 - alpha) * self.baseline[key] + alpha * metrics[key]
                else:
                    self.baseline[key] = metrics[key]
