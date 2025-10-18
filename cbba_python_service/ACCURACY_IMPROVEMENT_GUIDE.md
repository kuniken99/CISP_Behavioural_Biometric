# CBBA Accuracy Improvement & False Positive Reduction Guide

## 🎯 Overview
This guide provides strategies to improve CBBA accuracy and reduce false positives in production environments.

---

## 1. 📊 Data Quality & Quantity

### Increase Training Data Volume
```bash
# Current: 1000 samples (demonstration)
# Production: 5000-10000 samples over 2-4 weeks

python generate_training_data.py tank108 <JWT_TOKEN> 5000
```

**Why?** More samples capture:
- Different times of day (morning vs evening typing patterns)
- Different emotional states (stressed, relaxed, focused)
- Different devices/environments (office vs home)
- Seasonal variations in behavior

### Collect Diverse Behavioral Contexts
- **Login sessions**: Fresh, alert typing
- **Long sessions**: Fatigue patterns
- **Mobile vs Desktop**: Device-specific behaviors
- **Time-based**: Morning (faster) vs Night (slower)

---

## 2. ⚙️ Model Hyperparameter Tuning

### Current Settings (Demonstration Mode)
```python
# In anomaly_detection.py __init__()
self.isolation_forest = IsolationForest(
    contamination=0.1,      # 10% expected anomalies - TOO HIGH
    n_estimators=100,       # OK
    random_state=42,
    max_samples='auto'
)

self.one_class_svm = OneClassSVM(
    nu=0.1,                 # 10% outliers - TOO HIGH
    gamma='auto',
    kernel='rbf'
)
```

### Recommended Production Settings
```python
# OPTIMIZED for accuracy
self.isolation_forest = IsolationForest(
    contamination=0.01,     # 1% expected anomalies (less false positives)
    n_estimators=200,       # More trees = more stable predictions
    max_samples=256,        # Subsample size
    random_state=42,
    bootstrap=True,
    max_features=1.0
)

self.one_class_svm = OneClassSVM(
    nu=0.01,                # 1% outliers (stricter boundary)
    gamma='scale',          # Better scaling for varying features
    kernel='rbf',
    cache_size=500          # Faster training
)
```

**Impact:** Lower contamination/nu = tighter boundary = fewer false positives

---

## 3. 🔧 Feature Engineering Improvements

### Add More Discriminative Features

#### Current Features (from feature_extraction.py):
- Typing speed metrics
- Key hold duration
- Flight time between keys
- Mouse movement patterns
- Click patterns
- Pause durations

#### **Recommended Additional Features:**

```python
# Add to feature_extraction.py

def extract_advanced_features(behavioral_data):
    """Extract advanced features for better accuracy"""
    features = {}
    
    # 1. TEMPORAL PATTERNS
    features['hour_of_day'] = datetime.now().hour
    features['day_of_week'] = datetime.now().weekday()
    features['session_time_minutes'] = calculate_session_duration()
    
    # 2. ERROR PATTERNS
    features['backspace_rate'] = count_backspaces() / total_keys
    features['correction_ratio'] = corrections / total_words
    
    # 3. RHYTHM PATTERNS
    features['typing_rhythm_variance'] = np.var(key_intervals)
    features['typing_rhythm_consistency'] = autocorrelation(key_intervals)
    
    # 4. MOUSE ACCELERATION
    features['mouse_acceleration_mean'] = np.mean(mouse_accelerations)
    features['mouse_jerk'] = np.mean(np.diff(mouse_accelerations, n=2))
    
    # 5. PRESSURE PATTERNS (if available)
    features['key_pressure_variance'] = np.var(key_pressures)
    
    # 6. DIGRAPH PATTERNS (two-key combinations)
    features['common_digraph_speed'] = avg_speed_for_common_pairs()
    features['rare_digraph_speed'] = avg_speed_for_rare_pairs()
    
    # 7. COGNITIVE LOAD INDICATORS
    features['pause_before_complex_words'] = avg_pause_before_long_words()
    features['typing_burst_count'] = count_typing_bursts()
    
    return features
```

---

## 4. 🎚️ Adaptive Thresholds

### Time-of-Day Adjustments
```python
def get_adaptive_threshold(self, hour_of_day, base_threshold):
    """Adjust thresholds based on time patterns"""
    
    # People type differently at different times
    time_adjustments = {
        'morning': (6, 10, 0.85),   # 6-10am: 15% more lenient
        'midday': (10, 14, 1.0),    # 10am-2pm: normal
        'afternoon': (14, 18, 0.90), # 2-6pm: 10% more lenient
        'evening': (18, 23, 0.80),   # 6-11pm: 20% more lenient (tired)
        'night': (23, 6, 0.70)       # 11pm-6am: 30% more lenient (very tired)
    }
    
    for period, (start, end, multiplier) in time_adjustments.items():
        if start <= hour_of_day < end:
            return base_threshold * multiplier
    
    return base_threshold
```

### Session-Based Learning
```python
class SessionAwareDetector:
    """Track within-session patterns to reduce false positives"""
    
    def __init__(self):
        self.session_samples = []
        self.session_start = None
        
    def add_session_sample(self, features, risk_score):
        """Collect samples during current session"""
        self.session_samples.append({
            'features': features,
            'risk_score': risk_score,
            'timestamp': datetime.now()
        })
        
        # If session shows consistently low risk, adjust threshold
        if len(self.session_samples) >= 10:
            recent_scores = [s['risk_score'] for s in self.session_samples[-10:]]
            avg_risk = np.mean(recent_scores)
            
            if avg_risk < 30:  # Consistently legitimate
                return 'session_trusted'
            elif avg_risk > 70:  # Consistently suspicious
                return 'session_suspicious'
        
        return 'session_normal'
```

---

## 5. 🧪 Remove Demonstration Amplification

### Current Code (DEMO MODE - Line 152-195):
```python
# TRIPLE amplification (3x, 5x multipliers)
# LARGE variance (±8%, ±12%, ±20%)
# This creates 0-100% range for demonstration
```

### Production Code (ACCURACY MODE):

```python
def _normalize_if_score(self, score: float) -> float:
    """Production version - accurate scoring"""
    # NO amplification for production
    # score stays as-is
    
    if score >= 0.2:
        # Very normal: 0-25%
        risk = max(0, (0.2 - score) * 50)
    elif score >= 0:
        # Normal: 25-40%
        risk = 25 + (0 - score) * 75
    elif score >= -0.2:
        # Slight deviation: 40-60%
        risk = 40 + (-0.2 - score) * 100
    elif score >= -0.4:
        # Moderate anomaly: 60-80%
        risk = 60 + (-0.4 - score) * 100
    else:
        # High anomaly: 80-100%
        risk = 80 + min((-0.4 - score) * 50, 20)
    
    # NO random variance in production
    return np.clip(risk, 0, 100)
```

**Impact:** Stable, predictable scores based on actual behavior

---

## 6. 📈 Ensemble Voting Strategy

### Weighted Consensus Approach
```python
def predict_with_confidence(self, feature_vector):
    """Use confidence scores to reduce false positives"""
    
    # Get individual model predictions
    if_risk, if_confidence = self._if_predict_with_confidence(feature_vector)
    svm_risk, svm_confidence = self._svm_predict_with_confidence(feature_vector)
    feature_risk, feature_confidence = self._feature_predict_with_confidence(feature_vector)
    
    # Weight by confidence
    total_confidence = if_confidence + svm_confidence + feature_confidence
    
    weighted_risk = (
        (if_risk * if_confidence * 0.4) +
        (svm_risk * svm_confidence * 0.3) +
        (feature_risk * feature_confidence * 0.3)
    ) / total_confidence
    
    # Require CONSENSUS for high-risk alerts
    high_risk_count = sum([
        if_risk > 70,
        svm_risk > 70,
        feature_risk > 70
    ])
    
    # All 3 models must agree for critical alert
    if weighted_risk > 80 and high_risk_count < 3:
        weighted_risk = 70  # Downgrade to warning
    
    return weighted_risk
```

---

## 7. 🕐 Time-Series Analysis

### Sliding Window Smoothing
```python
class TemporalSmoothing:
    """Reduce noise with temporal context"""
    
    def __init__(self, window_size=5):
        self.window_size = window_size
        self.recent_scores = []
    
    def smooth_score(self, current_score):
        """Apply moving average"""
        self.recent_scores.append(current_score)
        
        if len(self.recent_scores) > self.window_size:
            self.recent_scores.pop(0)
        
        # Exponential moving average
        weights = np.exp(np.linspace(-1, 0, len(self.recent_scores)))
        weights /= weights.sum()
        
        smoothed = np.average(self.recent_scores, weights=weights)
        
        return smoothed
```

**Impact:** Reduces single-event false positives by considering recent history

---

## 8. 🎯 Multi-Stage Alert System

### Progressive Risk Escalation
```python
class MultiStageAlerts:
    """Reduce false positives with confirmation system"""
    
    def __init__(self):
        self.suspicious_streak = 0
        self.normal_streak = 0
    
    def evaluate_risk(self, risk_score):
        """Require sustained anomaly before alerting"""
        
        if risk_score > 70:
            self.suspicious_streak += 1
            self.normal_streak = 0
            
            # Require 3 consecutive high-risk scores
            if self.suspicious_streak >= 3:
                return 'ALERT', risk_score
            else:
                return 'WATCH', risk_score
        
        elif risk_score < 40:
            self.normal_streak += 1
            self.suspicious_streak = 0
            
            # Reset after 2 consecutive normal scores
            if self.normal_streak >= 2:
                return 'NORMAL', risk_score
        
        else:
            # Neutral zone - maintain current state
            pass
        
        return 'MONITORING', risk_score
```

---

## 9. 🧑‍💻 User Feedback Loop

### Learn from False Positives
```python
class FeedbackLearning:
    """Improve model based on user feedback"""
    
    def report_false_positive(self, feature_vector, original_score):
        """User marked this as false positive"""
        
        # Add to legitimate training samples
        self.update_training(feature_vector.reshape(1, -1))
        
        # Log for analysis
        self.false_positive_log.append({
            'features': feature_vector,
            'score': original_score,
            'timestamp': datetime.now()
        })
        
        # Retrain if accumulated enough feedback
        if len(self.false_positive_log) >= 50:
            self._retrain_with_feedback()
```

---

## 10. 📊 Feature Importance Analysis

### Identify Most Discriminative Features
```python
from sklearn.ensemble import RandomForestClassifier

def analyze_feature_importance(X_train, y_train):
    """Find which features matter most"""
    
    # Train random forest
    rf = RandomForestClassifier(n_estimators=100)
    rf.fit(X_train, y_train)
    
    # Get importance scores
    importances = rf.feature_importances_
    
    # Sort features by importance
    feature_names = ['typing_speed', 'key_hold', 'flight_time', ...]
    sorted_features = sorted(zip(feature_names, importances), 
                            key=lambda x: x[1], reverse=True)
    
    # Focus on top features, ignore noisy ones
    print("Top 10 discriminative features:")
    for name, importance in sorted_features[:10]:
        print(f"  {name}: {importance:.3f}")
    
    # Remove low-importance features (< 1%)
    threshold = 0.01
    important_features = [name for name, imp in sorted_features if imp > threshold]
    
    return important_features
```

---

## 11. 🔄 Implementation Roadmap

### Phase 1: Collect Quality Data (Week 1-2)
```bash
# Collect 5000+ samples per user
python generate_training_data.py tank108 <JWT> 5000

# Vary conditions:
# - Different times of day
# - Different session lengths
# - Different activities (typing vs clicking)
```

### Phase 2: Optimize Hyperparameters (Week 3)
```python
# Update anomaly_detection.py
contamination = 0.01  # Change from 0.1
nu = 0.01            # Change from 0.1
n_estimators = 200   # Change from 100
```

### Phase 3: Remove Demo Amplification (Week 3)
```python
# Remove all amplification multipliers
# Remove random variance
# Use actual scores
```

### Phase 4: Add Temporal Smoothing (Week 4)
```python
# Implement sliding window
# Add session-based learning
# Implement multi-stage alerts
```

### Phase 5: Monitor & Iterate (Ongoing)
```python
# Track false positive rate
# Collect user feedback
# Retrain monthly
```

---

## 12. 📏 Metrics to Track

### Key Performance Indicators
```python
class AccuracyMetrics:
    """Track model performance"""
    
    def __init__(self):
        self.true_positives = 0   # Correct anomaly detection
        self.false_positives = 0  # Legitimate flagged as anomaly
        self.true_negatives = 0   # Correct normal detection
        self.false_negatives = 0  # Missed anomaly
    
    def calculate_metrics(self):
        # False Positive Rate (MINIMIZE THIS)
        fpr = self.false_positives / (self.false_positives + self.true_negatives)
        
        # True Positive Rate (Sensitivity)
        tpr = self.true_positives / (self.true_positives + self.false_negatives)
        
        # Precision
        precision = self.true_positives / (self.true_positives + self.false_positives)
        
        # F1 Score (Balance)
        f1 = 2 * (precision * tpr) / (precision + tpr)
        
        return {
            'false_positive_rate': fpr,
            'true_positive_rate': tpr,
            'precision': precision,
            'f1_score': f1
        }
```

**Target Metrics for Production:**
- False Positive Rate: < 1% (less than 1 in 100 legitimate sessions flagged)
- True Positive Rate: > 90% (catch 9 out of 10 actual attacks)
- F1 Score: > 0.85

---

## 13. 🚀 Quick Wins (Immediate Impact)

### 1. Lower Contamination Parameter
```python
# File: anomaly_detection.py, line 32
contamination=0.01,  # Change from 0.1
```
**Impact:** 90% reduction in false positives immediately

### 2. Remove Random Variance
```python
# File: anomaly_detection.py, lines 257, 285, 357, 186
# Comment out all random.uniform() lines
# risk += random.uniform(-8, 8)  # REMOVE THIS
```
**Impact:** Stable, predictable scores

### 3. Increase Training Data
```bash
python generate_training_data.py tank108 <JWT> 5000
```
**Impact:** Better baseline understanding

---

## 14. 🎓 Best Practices Summary

✅ **DO:**
- Collect 5000+ diverse training samples
- Use contamination=0.01 for production
- Implement temporal smoothing
- Require consensus for high-risk alerts
- Collect user feedback on false positives
- Retrain models monthly

❌ **DON'T:**
- Use amplification in production
- Add random variance to scores
- Alert on single high-risk event
- Ignore time-of-day patterns
- Use same threshold for all users
- Keep contamination=0.1

---

## 15. 📞 Support & Resources

### Testing False Positive Rate
```python
# Test script to measure FPR
python test_false_positive_rate.py tank108 <JWT> --sessions 100
```

### Hyperparameter Grid Search
```python
# Find optimal parameters
python optimize_hyperparameters.py --user tank108 --cv 5
```

### Generate Accuracy Report
```python
# Monthly accuracy analysis
python generate_accuracy_report.py --month 2025-10
```

---

**Next Steps:**
1. Collect more training data (5000+ samples)
2. Update hyperparameters (contamination=0.01)
3. Remove demo amplification
4. Implement temporal smoothing
5. Monitor false positive rate

**Goal:** < 1% false positive rate while maintaining > 90% attack detection rate
