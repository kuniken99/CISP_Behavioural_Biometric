# cbba_python_service/anomaly_detection_production.py
"""
PRODUCTION VERSION - Optimized for accuracy and low false positive rate
Use this instead of anomaly_detection.py for real deployment
"""
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
import joblib
import os
from typing import Tuple, Optional
from datetime import datetime
import json


class ProductionAnomalyDetector:
    """
    Production-grade anomaly detection with optimized hyperparameters
    Target: <1% false positive rate, >90% true positive rate
    """
    
    def __init__(self, user_id: int, model_path: str = './models'):
        """
        Initialize production anomaly detector
        
        Args:
            user_id: User identifier
            model_path: Path to store/load models
        """
        self.user_id = user_id
        self.model_path = model_path
        self.model_file = os.path.join(model_path, f'user_{user_id}_model_prod.pkl')
        
        # OPTIMIZED PRODUCTION SETTINGS
        # Lower contamination = fewer false positives
        self.isolation_forest = IsolationForest(
            contamination=0.01,      # 1% expected anomalies (vs 10% in demo)
            n_estimators=200,        # More trees = more stable
            max_samples=256,
            random_state=42,
            bootstrap=True,
            max_features=1.0,
            n_jobs=-1               # Use all CPU cores
        )
        
        self.one_class_svm = OneClassSVM(
            nu=0.01,                # 1% outliers (vs 10% in demo)
            gamma='scale',          # Better auto-scaling
            kernel='rbf',
            cache_size=500
        )
        
        self.scaler = StandardScaler()
        self.is_trained = False
        self.training_samples = []
        self.feature_dim = None
        
        # Temporal smoothing for stability
        self.recent_scores = []
        self.window_size = 5
        
        # Multi-stage alert system
        self.suspicious_streak = 0
        self.normal_streak = 0
        
        # Load existing model if available
        self._load_model()
    
    def train(self, feature_vectors: np.ndarray, min_samples: int = 100) -> bool:
        """
        Train with MORE data for better accuracy
        
        Args:
            feature_vectors: Array of feature vectors (n_samples, n_features)
            min_samples: Minimum samples required (increased from 10)
            
        Returns:
            True if training successful
        """
        try:
            if len(feature_vectors) < min_samples:
                print(f"Insufficient training data for user {self.user_id}: {len(feature_vectors)} samples (need {min_samples})")
                return False
            
            self.feature_dim = feature_vectors.shape[1]
            
            # Normalize features
            self.scaler.fit(feature_vectors)
            normalized_features = self.scaler.transform(feature_vectors)
            
            # Train models
            print(f"Training Isolation Forest for user {self.user_id}...")
            self.isolation_forest.fit(normalized_features)
            
            print(f"Training One-Class SVM for user {self.user_id}...")
            self.one_class_svm.fit(normalized_features)
            
            self.is_trained = True
            self.training_samples = feature_vectors.tolist()
            
            # Save model
            self._save_model()
            
            print(f"✓ Successfully trained models for user {self.user_id} with {len(feature_vectors)} samples")
            return True
            
        except Exception as e:
            print(f"✗ Training failed for user {self.user_id}: {str(e)}")
            return False
    
    def predict(self, feature_vector: np.ndarray) -> Tuple[float, dict]:
        """
        Production prediction with temporal smoothing and multi-stage alerts
        
        Returns:
            Tuple of (risk_score, details_dict)
        """
        try:
            if not self.is_trained:
                return 50.0, {
                    'status': 'untrained',
                    'message': 'Model not trained yet',
                    'alert_level': 'unknown'
                }
            
            # Reshape if single sample
            if feature_vector.ndim == 1:
                feature_vector = feature_vector.reshape(1, -1)
            
            # Normalize features
            normalized_features = self.scaler.transform(feature_vector)
            
            # Get raw predictions
            if_score = self.isolation_forest.score_samples(normalized_features)[0]
            svm_score = self.one_class_svm.score_samples(normalized_features)[0]
            
            # PRODUCTION SCORING (no amplification)
            if_risk = self._normalize_if_score_production(if_score)
            svm_risk = self._normalize_svm_score_production(svm_score)
            feature_risk = self._calculate_feature_risk_production(normalized_features)
            
            # Weighted combination
            raw_risk = (if_risk * 0.4 + svm_risk * 0.3 + feature_risk * 0.3)
            
            # Apply temporal smoothing (reduces noise)
            smoothed_risk = self._apply_temporal_smoothing(raw_risk)
            
            # Multi-stage alert evaluation
            alert_level, final_risk = self._evaluate_multi_stage_alert(smoothed_risk)
            
            # Time-based adjustment
            final_risk = self._apply_time_adjustment(final_risk)
            
            # Ensure bounds
            final_risk = np.clip(final_risk, 0, 100)
            
            # Determine status
            if final_risk < 40:
                status = 'normal'
                risk_level = 'low'
            elif final_risk < 70:
                status = 'moderate_deviation'
                risk_level = 'moderate'
            else:
                status = 'high_deviation'
                risk_level = 'high'
            
            details = {
                'status': status,
                'risk_level': risk_level,
                'alert_level': alert_level,
                'raw_risk': float(raw_risk),
                'smoothed_risk': float(smoothed_risk),
                'if_risk': float(if_risk),
                'svm_risk': float(svm_risk),
                'feature_risk': float(feature_risk),
                'suspicious_streak': self.suspicious_streak,
                'timestamp': datetime.now().isoformat()
            }
            
            # Logging
            print(f"[CBBA-PROD] User {self.user_id} - IF:{if_risk:.1f}% SVM:{svm_risk:.1f}% Feature:{feature_risk:.1f}% | Raw:{raw_risk:.1f}% Smooth:{smoothed_risk:.1f}% Final:{final_risk:.1f}% | Alert:{alert_level}")
            
            return float(final_risk), details
            
        except Exception as e:
            print(f"✗ Prediction failed for user {self.user_id}: {str(e)}")
            return 75.0, {'status': 'error', 'message': str(e)}
    
    def _normalize_if_score_production(self, score: float) -> float:
        """Production IF scoring - NO amplification, NO random variance"""
        # Natural IF score range: -0.5 to 0.5
        
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
        
        return np.clip(risk, 0, 100)
    
    def _normalize_svm_score_production(self, score: float) -> float:
        """Production SVM scoring - NO amplification, NO random variance"""
        # Natural SVM score range: -2.0 to 2.0
        
        if score >= 1.0:
            # Very normal: 0-25%
            risk = max(0, (1.0 - score) * 25)
        elif score >= 0:
            # Normal: 25-40%
            risk = 25 + (0 - score) * 15
        elif score >= -1.0:
            # Slight deviation: 40-65%
            risk = 40 + (-1.0 - score) * 25
        elif score >= -1.5:
            # Moderate anomaly: 65-85%
            risk = 65 + (-1.5 - score) * 40
        else:
            # High anomaly: 85-100%
            risk = 85 + min((-1.5 - score) * 30, 15)
        
        return np.clip(risk, 0, 100)
    
    def _calculate_feature_risk_production(self, normalized_features: np.ndarray) -> float:
        """Production feature risk - NO amplification, NO random variance"""
        try:
            if not self.is_trained or len(self.training_samples) == 0:
                return 50.0
            
            # Calculate baseline
            training_array = np.array(self.training_samples)
            baseline_mean = np.mean(training_array, axis=0).reshape(1, -1)
            baseline_std = np.std(training_array, axis=0)
            
            # Normalize baseline
            baseline_normalized = self.scaler.transform(baseline_mean)
            
            # Calculate distance
            distance = np.linalg.norm(normalized_features - baseline_normalized)
            std_distance = distance / (np.mean(baseline_std) + 1e-6)
            
            # NO AMPLIFICATION for production
            # Map naturally to 0-100 scale
            
            if std_distance < 0.5:
                risk = std_distance * 30  # 0-15%
            elif std_distance < 1.0:
                risk = 15 + (std_distance - 0.5) * 30  # 15-30%
            elif std_distance < 2.0:
                risk = 30 + (std_distance - 1.0) * 30  # 30-60%
            elif std_distance < 3.0:
                risk = 60 + (std_distance - 2.0) * 20  # 60-80%
            else:
                risk = 80 + min((std_distance - 3.0) * 10, 20)  # 80-100%
            
            return np.clip(risk, 0, 100)
            
        except Exception as e:
            print(f"Feature risk calculation failed: {str(e)}")
            return 50.0
    
    def _apply_temporal_smoothing(self, current_score: float) -> float:
        """Exponential moving average to reduce noise"""
        self.recent_scores.append(current_score)
        
        if len(self.recent_scores) > self.window_size:
            self.recent_scores.pop(0)
        
        # Exponential weighting (more recent = more weight)
        weights = np.exp(np.linspace(-1, 0, len(self.recent_scores)))
        weights /= weights.sum()
        
        smoothed = np.average(self.recent_scores, weights=weights)
        return smoothed
    
    def _evaluate_multi_stage_alert(self, risk_score: float) -> Tuple[str, float]:
        """
        Require sustained anomaly before high alert
        Reduces false positives from single events
        """
        if risk_score > 70:
            self.suspicious_streak += 1
            self.normal_streak = 0
            
            if self.suspicious_streak >= 3:
                # 3+ consecutive high scores = confirmed threat
                return 'CRITICAL', risk_score
            elif self.suspicious_streak >= 2:
                # 2 consecutive = elevated alert
                return 'WARNING', risk_score * 0.9  # Slight reduction
            else:
                # First occurrence = just monitoring
                return 'WATCH', risk_score * 0.8  # Reduce for single event
        
        elif risk_score < 40:
            self.normal_streak += 1
            self.suspicious_streak = max(0, self.suspicious_streak - 1)
            
            if self.normal_streak >= 2:
                # Reset streaks after confirmed normal behavior
                self.suspicious_streak = 0
                return 'NORMAL', risk_score
        
        return 'MONITORING', risk_score
    
    def _apply_time_adjustment(self, risk_score: float) -> float:
        """Adjust threshold based on time of day (people type differently when tired)"""
        hour = datetime.now().hour
        
        # Time-based adjustments (more lenient during tired hours)
        if 6 <= hour < 10:
            # Morning: normal alertness
            multiplier = 1.0
        elif 10 <= hour < 14:
            # Midday: peak alertness
            multiplier = 1.0
        elif 14 <= hour < 18:
            # Afternoon: slight fatigue
            multiplier = 0.95
        elif 18 <= hour < 23:
            # Evening: more fatigue
            multiplier = 0.90
        else:
            # Night: very tired or unusual access
            multiplier = 0.85 if risk_score < 60 else 1.1  # Lenient for low risk, stricter for high
        
        return risk_score * multiplier
    
    def _save_model(self):
        """Save model to disk"""
        try:
            os.makedirs(self.model_path, exist_ok=True)
            
            model_data = {
                'user_id': self.user_id,
                'isolation_forest': self.isolation_forest,
                'one_class_svm': self.one_class_svm,
                'scaler': self.scaler,
                'is_trained': self.is_trained,
                'training_samples': self.training_samples,
                'feature_dim': self.feature_dim,
                'trained_at': datetime.now().isoformat(),
                'version': 'production_v1.0'
            }
            
            joblib.dump(model_data, self.model_file)
            print(f"✓ Production model saved for user {self.user_id}")
            
        except Exception as e:
            print(f"✗ Failed to save model: {str(e)}")
    
    def _load_model(self):
        """Load model from disk"""
        try:
            if os.path.exists(self.model_file):
                model_data = joblib.load(self.model_file)
                
                self.isolation_forest = model_data['isolation_forest']
                self.one_class_svm = model_data['one_class_svm']
                self.scaler = model_data['scaler']
                self.is_trained = model_data['is_trained']
                self.training_samples = model_data['training_samples']
                self.feature_dim = model_data['feature_dim']
                
                print(f"✓ Production model loaded for user {self.user_id}")
                
        except Exception as e:
            print(f"✗ Failed to load model: {str(e)}")
    
    def get_model_info(self) -> dict:
        """Get model information"""
        return {
            'user_id': self.user_id,
            'is_trained': self.is_trained,
            'training_samples_count': len(self.training_samples),
            'feature_dimension': self.feature_dim,
            'model_path': self.model_file,
            'model_exists': os.path.exists(self.model_file),
            'version': 'production_v1.0',
            'settings': {
                'contamination': 0.01,
                'nu': 0.01,
                'n_estimators': 200,
                'temporal_window': self.window_size
            }
        }
    
    def get_performance_stats(self) -> dict:
        """Get performance statistics"""
        return {
            'suspicious_streak': self.suspicious_streak,
            'normal_streak': self.normal_streak,
            'recent_scores': self.recent_scores[-10:] if self.recent_scores else [],
            'avg_recent_risk': np.mean(self.recent_scores[-10:]) if len(self.recent_scores) >= 10 else None
        }
