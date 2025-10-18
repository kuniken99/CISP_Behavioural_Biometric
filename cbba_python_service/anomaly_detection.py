# cbba_python_service/anomaly_detection.py
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
import joblib
import os
from typing import Tuple, Optional
from datetime import datetime
import json


class AnomalyDetector:
    """
    Anomaly detection using Isolation Forest and One-Class SVM
    Detects behavioral anomalies in biometric data
    """
    
    def __init__(self, user_id: int, model_path: str = './models'):
        """
        Initialize anomaly detector for a specific user
        
        Args:
            user_id: User identifier
            model_path: Path to store/load models
        """
        self.user_id = user_id
        self.model_path = model_path
        self.model_file = os.path.join(model_path, f'user_{user_id}_model.pkl')
        
        # Initialize models
        self.isolation_forest = IsolationForest(
            contamination=0.1,
            n_estimators=100,
            random_state=42,
            max_samples='auto'
        )
        
        self.one_class_svm = OneClassSVM(
            nu=0.1,
            gamma='auto',
            kernel='rbf'
        )
        
        self.scaler = StandardScaler()
        self.is_trained = False
        self.training_samples = []
        self.feature_dim = None
        
        # Load existing model if available
        self._load_model()
    
    def train(self, feature_vectors: np.ndarray) -> bool:
        """
        Train anomaly detection models with user's baseline behavioral data
        
        Args:
            feature_vectors: Array of feature vectors (n_samples, n_features)
            
        Returns:
            True if training successful, False otherwise
        """
        try:
            if len(feature_vectors) < 10:
                print(f"Insufficient training data for user {self.user_id}: {len(feature_vectors)} samples")
                return False
            
            # Store feature dimension
            self.feature_dim = feature_vectors.shape[1]
            
            # Normalize features
            self.scaler.fit(feature_vectors)
            normalized_features = self.scaler.transform(feature_vectors)
            
            # Train Isolation Forest
            self.isolation_forest.fit(normalized_features)
            
            # Train One-Class SVM
            self.one_class_svm.fit(normalized_features)
            
            self.is_trained = True
            self.training_samples = feature_vectors.tolist()
            
            # Save model
            self._save_model()
            
            print(f"Successfully trained models for user {self.user_id} with {len(feature_vectors)} samples")
            return True
            
        except Exception as e:
            print(f"Training failed for user {self.user_id}: {str(e)}")
            return False
    
    def update_training(self, new_features: np.ndarray, max_samples: int = 200):
        """
        Update model with new legitimate behavioral data (online learning)
        
        Args:
            new_features: New feature vectors to add to training set
            max_samples: Maximum number of samples to retain
        """
        try:
            if not self.is_trained:
                return self.train(new_features)
            
            # Add new samples
            all_samples = np.vstack([
                np.array(self.training_samples),
                new_features
            ])
            
            # Keep only most recent samples
            if len(all_samples) > max_samples:
                all_samples = all_samples[-max_samples:]
            
            # Retrain models
            return self.train(all_samples)
            
        except Exception as e:
            print(f"Update training failed for user {self.user_id}: {str(e)}")
            return False
    
    def predict(self, feature_vector: np.ndarray) -> Tuple[float, dict]:
        """
        Predict anomaly score for a feature vector
        
        Args:
            feature_vector: Single feature vector to evaluate
            
        Returns:
            Tuple of (risk_score, details_dict)
            risk_score: 0-100 where 0=normal, 100=highly anomalous
            details_dict: Additional information about the prediction
        """
        try:
            if not self.is_trained:
                return 50.0, {
                    'status': 'untrained',
                    'message': 'Model not trained yet',
                    'isolation_forest_score': None,
                    'one_class_svm_score': None
                }
            
            # Reshape if single sample
            if feature_vector.ndim == 1:
                feature_vector = feature_vector.reshape(1, -1)
            
            # Check feature dimension
            if feature_vector.shape[1] != self.feature_dim:
                return 75.0, {
                    'status': 'error',
                    'message': f'Feature dimension mismatch: expected {self.feature_dim}, got {feature_vector.shape[1]}',
                    'isolation_forest_score': None,
                    'one_class_svm_score': None
                }
            
            # Normalize features
            normalized_features = self.scaler.transform(feature_vector)
            
            # Get predictions from both models
            # Isolation Forest: -1 (anomaly) or 1 (normal)
            if_prediction = self.isolation_forest.predict(normalized_features)[0]
            if_score = self.isolation_forest.score_samples(normalized_features)[0]
            
            # One-Class SVM: -1 (anomaly) or 1 (normal)
            svm_prediction = self.one_class_svm.predict(normalized_features)[0]
            svm_score = self.one_class_svm.score_samples(normalized_features)[0]
            
            # Convert scores to 0-100 scale (higher = more anomalous)
            # Isolation Forest score is negative (more negative = more anomalous)
            if_risk = self._normalize_if_score(if_score)
            
            # One-Class SVM score is negative (more negative = more anomalous)
            svm_risk = self._normalize_svm_score(svm_score)
            
            # Calculate feature-based risk using actual behavioral deviations
            # This provides full 0-100% range based on how much behavior differs from baseline
            feature_based_risk = self._calculate_feature_risk(normalized_features)
            
            # Bot Detection: Check for repetitive clicks at same coordinates
            # Feature vector index 17 (last feature) is repetitive_click_ratio
            bot_risk_penalty = 0.0
            if feature_vector.shape[1] >= 18:  # Ensure feature exists
                repetitive_click_ratio = feature_vector[0, -1]  # Last feature
                
                # DEBUG: Always log the repetitive click ratio
                print(f"[BOT DETECTION DEBUG] User {self.user_id} - Repetitive clicks: {repetitive_click_ratio*100:.1f}% (threshold: 30%)")
                
                if repetitive_click_ratio > 0.3:  # More than 30% repetitive clicks
                    # High repetition = likely bot behavior
                    # Add 20-40% risk penalty based on severity
                    bot_risk_penalty = min(40.0, repetitive_click_ratio * 100)
                    print(f"[BOT DETECTION TRIGGERED] User {self.user_id} - Repetitive clicks: {repetitive_click_ratio*100:.1f}% → +{bot_risk_penalty:.1f}% risk")
                else:
                    print(f"[BOT DETECTION] No penalty - below 30% threshold")
            
            # Combine all three risk assessments:
            # - Isolation Forest (40%): Statistical outlier detection
            # - SVM (30%): Boundary-based anomaly detection  
            # - Feature deviation (30%): Direct behavioral difference measurement
            combined_risk = (if_risk * 0.4 + svm_risk * 0.3 + feature_based_risk * 0.3)
            
            # Apply bot detection penalty
            combined_risk += bot_risk_penalty
            
            # Add small natural variance for realistic scoring (±3% instead of ±20%)
            # This accounts for minor timing variations without causing false positives
            import random
            variance = random.uniform(-3, 3)
            combined_risk += variance
            
            # Ensure 0-100 range
            combined_risk = np.clip(combined_risk, 0, 100)
            
            # Log the scoring details
            print(f"[CBBA] User {self.user_id} - IF: {if_risk:.1f}%, SVM: {svm_risk:.1f}%, Feature: {feature_based_risk:.1f}%, Combined: {combined_risk:.1f}%")
            
            # Determine status based on new risk level thresholds
            # Green (0-49%): Normal behavior
            # Orange (50-79%): Suspicious/moderate anomalous behavior
            # Red (80-100%): Highly anomalous behavior
            if combined_risk < 50:
                status = 'normal'
                risk_level = 'low'  # Green
            elif combined_risk < 80:
                status = 'moderate_deviation'
                risk_level = 'moderate'  # Orange
            else:
                status = 'high_deviation'
                risk_level = 'high'  # Red
            
            details = {
                'status': status,
                'risk_level': risk_level,
                'isolation_forest_score': float(if_score),
                'one_class_svm_score': float(svm_score),
                'isolation_forest_risk': float(if_risk),
                'one_class_svm_risk': float(svm_risk),
                'isolation_forest_prediction': 'anomaly' if if_prediction == -1 else 'normal',
                'one_class_svm_prediction': 'anomaly' if svm_prediction == -1 else 'normal',
                'timestamp': datetime.now().isoformat()
            }
            
            return float(combined_risk), details
            
        except Exception as e:
            print(f"Prediction failed for user {self.user_id}: {str(e)}")
            return 75.0, {
                'status': 'error',
                'message': str(e),
                'isolation_forest_score': None,
                'one_class_svm_score': None
            }
    
    def _normalize_if_score(self, score: float) -> float:
        """
        Normalize Isolation Forest anomaly score to 0-100 scale
        IF scores typically range from -0.5 (very anomalous) to 0.5 (very normal)
        
        Enhanced sensitivity: Can reach 80%+ for severe anomalies
        """
        # Higher amplification (×3.5) - more sensitive to anomalies
        score = score * 3.5
        
        if score >= 0.4:
            # Very normal: 5-15%
            risk = 5 + (0.4 - score) * 25
        elif score >= 0.1:
            # Normal: 15-30%
            risk = 15 + (0.1 - score) * 50
        elif score >= -0.1:
            # Slight deviation: 30-55%
            risk = 30 + (-0.1 - score) * 125
        elif score >= -0.4:
            # Moderate anomaly: 55-80%
            risk = 55 + (-0.4 - score) * 83.3
        else:
            # High anomaly: 80-100%
            risk = 80 + min(max(-0.8 - score, 0) * 50, 20)
        
        # Add minimal natural variance (±2%) for realism
        import random
        risk += random.uniform(-2, 2)
        
        return np.clip(risk, 0, 100)
    
    def _normalize_svm_score(self, score: float) -> float:
        """
        Normalize One-Class SVM decision function score to 0-100 scale
        SVM scores typically range from -2.0 (very anomalous) to 2.0 (very normal)
        
        Enhanced sensitivity: Can reach 80%+ for severe anomalies
        """
        # Higher amplification (×3.5) - more sensitive to anomalies
        score = score * 3.5
        
        if score >= 1.2:
            # Very normal: 5-15%
            risk = 5 + (1.2 - score) * 16.7
        elif score >= 0.4:
            # Normal: 15-30%
            risk = 15 + (0.4 - score) * 18.75
        elif score >= -0.4:
            # Slight deviation: 30-55%
            risk = 30 + (-0.4 - score) * 31.25
        elif score >= -1.2:
            # Moderate anomaly: 55-80%
            risk = 55 + (-1.2 - score) * 31.25
        else:
            # High anomaly: 80-100%
            risk = 80 + min(max(-2.0 - score, 0) * 25, 20)
        
        # Add minimal natural variance (±2%) for realism
        import random
        risk += random.uniform(-2, 2)
        
        return np.clip(risk, 0, 100)
    
    def _calculate_feature_risk(self, normalized_features: np.ndarray) -> float:
        """
        Calculate risk based on direct feature deviations from training baseline
        This provides full 0-100% range based on behavioral changes
        
        Uses Euclidean distance from mean training sample to measure deviation.
        More deviation = higher risk score across full spectrum.
        
        Args:
            normalized_features: Normalized feature vector
            
        Returns:
            Risk score from 0-100 based on feature deviation
        """
        try:
            if not self.is_trained or len(self.training_samples) == 0:
                # Not trained yet - return moderate risk
                return 50.0
            
            # Calculate mean of training samples (baseline behavior)
            training_array = np.array(self.training_samples)
            baseline_mean = np.mean(training_array, axis=0).reshape(1, -1)
            baseline_std = np.std(training_array, axis=0)
            
            # Normalize baseline
            baseline_normalized = self.scaler.transform(baseline_mean)
            
            # Calculate Euclidean distance from baseline
            distance = np.linalg.norm(normalized_features - baseline_normalized)
            
            # Calculate standard deviation distance (how many std devs away)
            # This makes the score adaptive to the training data variance
            std_distance = distance / (np.mean(baseline_std) + 1e-6)
            
            # Higher amplification (×4.0) - more sensitive to detect 80%+ risk
            # This ensures fast typing, erratic mouse, and bot behavior can reach session lock threshold
            std_distance = std_distance * 4.0
            
            # Map distance to 0-100 risk scale with enhanced thresholds
            # Distance interpretation (enhanced sensitivity):
            # 0.0 - 1.0 std: Very similar (5-20% risk) - Green (Normal)
            # 1.0 - 2.0 std: Similar (20-40% risk) - Green (Normal with variation)
            # 2.0 - 3.0 std: Moderate difference (40-65% risk) - Orange (Moderate)
            # 3.0 - 4.0 std: Significant difference (65-85% risk) - Orange/Red (Suspicious)
            # 4.0+ std: Very different (85-100% risk) - Red (High risk / Session Lock)
            
            if std_distance < 1.0:
                risk = 5 + std_distance * 15  # 5-20%
            elif std_distance < 2.0:
                risk = 20 + (std_distance - 1.0) * 20  # 20-40%
            elif std_distance < 3.0:
                risk = 40 + (std_distance - 2.0) * 25  # 40-65%
            elif std_distance < 4.0:
                risk = 65 + (std_distance - 3.0) * 20  # 65-85%
            else:
                risk = 85 + min((std_distance - 4.0) * 15, 15)  # 85-100%
            
            # Add minimal natural variance for realism (±2% instead of ±12%)
            import random
            variance = random.uniform(-2, 2)
            risk += variance
            
            return np.clip(risk, 0, 100)
            
        except Exception as e:
            print(f"Feature risk calculation failed: {str(e)}")
            return 50.0  # Default to moderate risk on error
    
    def _save_model(self):
        """Save trained model to disk"""
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
                'trained_at': datetime.now().isoformat()
            }
            
            joblib.dump(model_data, self.model_file)
            print(f"Model saved for user {self.user_id}")
            
        except Exception as e:
            print(f"Failed to save model for user {self.user_id}: {str(e)}")
    
    def _load_model(self):
        """Load trained model from disk"""
        try:
            if os.path.exists(self.model_file):
                model_data = joblib.load(self.model_file)
                
                self.isolation_forest = model_data['isolation_forest']
                self.one_class_svm = model_data['one_class_svm']
                self.scaler = model_data['scaler']
                self.is_trained = model_data['is_trained']
                self.training_samples = model_data['training_samples']
                self.feature_dim = model_data['feature_dim']
                
                print(f"Model loaded for user {self.user_id}")
                
        except Exception as e:
            print(f"Failed to load model for user {self.user_id}: {str(e)}")
    
    def get_model_info(self) -> dict:
        """Get information about the trained model"""
        return {
            'user_id': self.user_id,
            'is_trained': self.is_trained,
            'training_samples_count': len(self.training_samples),
            'feature_dimension': self.feature_dim,
            'model_path': self.model_file,
            'model_exists': os.path.exists(self.model_file)
        }
