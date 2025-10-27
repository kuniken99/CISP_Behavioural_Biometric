# cbba_python_service/cbba_service.py
"""
CBBA Service - Main orchestrator for Continuous Behavioral Biometric Authentication
Handles training, risk assessment, and profile management
"""
import numpy as np
from typing import Dict, List, Tuple, Optional, Union
from datetime import datetime
import json

from feature_extraction import FeatureExtractor
from anomaly_detection import AnomalyDetector
from encryption_service import BiometricEncryptionService
from config import Config


class CBBAService:
    """Main CBBA service for behavioral biometric authentication"""
    
    def __init__(self, encryption_key: str = None):
        """
        Initialize CBBA service
        
        Args:
            encryption_key: AES-256 encryption key (optional)
        """
        self.feature_extractor = FeatureExtractor()
        self.encryption_service = BiometricEncryptionService(
            encryption_key or Config.ENCRYPTION_KEY
        )
        self.detectors = {}  # Cache of user-specific anomaly detectors
        self.config = Config()
    
    def get_detector(self, user_id: Union[int, str]) -> AnomalyDetector:
        """
        Get or create anomaly detector for a user
        
        Args:
            user_id: User identifier (int or string)
            
        Returns:
            AnomalyDetector instance
        """
        if user_id not in self.detectors:
            self.detectors[user_id] = AnomalyDetector(
                user_id=user_id,
                model_path=Config.MODEL_STORAGE_PATH
            )
        return self.detectors[user_id]
    
    def process_behavioral_data(
        self,
        user_id: int,
        keystroke_data: List[Dict],
        mouse_data: List[Dict],
        mode: str = 'assess'
    ) -> Dict:
        """
        Process behavioral data and return risk assessment
        
        Args:
            user_id: User identifier
            keystroke_data: List of keystroke events
            mouse_data: List of mouse movement events
            mode: 'train' or 'assess'
            
        Returns:
            Dictionary with risk score and details
        """
        try:
            # Extract features
            keystroke_features = self.feature_extractor.extract_keystroke_features(keystroke_data)
            mouse_features = self.feature_extractor.extract_mouse_features(mouse_data)
            combined_features = self.feature_extractor.combine_features(
                keystroke_features, 
                mouse_features
            )
            
            # Get detector for user
            detector = self.get_detector(user_id)
            
            if mode == 'train':
                # Store features for training (don't assess yet)
                return {
                    'success': True,
                    'mode': 'training',
                    'features_extracted': True,
                    'feature_vector': combined_features.tolist(),
                    'message': 'Features extracted for training'
                }
            
            elif mode == 'assess':
                # Assess current behavior
                # Pass keystroke_data to enable advanced keystroke anomaly detection
                risk_score, details = detector.predict(combined_features, keystroke_data=keystroke_data)
                
                # Determine required action based on risk score
                action = self._determine_action(risk_score)
                
                return {
                    'success': True,
                    'mode': 'assessment',
                    'risk_score': round(risk_score, 2),
                    'risk_level': details.get('risk_level', 'unknown'),
                    'status': details.get('status', 'unknown'),
                    'action': action,
                    'details': details,
                    'timestamp': datetime.now().isoformat(),
                    'is_trained': detector.is_trained
                }
            
            else:
                return {
                    'success': False,
                    'error': f'Invalid mode: {mode}. Use "train" or "assess"'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def train_user_profile(
        self,
        user_id: int,
        training_data: List[Dict]
    ) -> Dict:
        """
        Train user's behavioral biometric profile
        
        Args:
            user_id: User identifier
            training_data: List of training sessions, each containing keystroke and mouse data
            
        Returns:
            Dictionary with training results
        """
        try:
            if len(training_data) < Config.MIN_TRAINING_SAMPLES:
                return {
                    'success': False,
                    'error': f'Insufficient training data. Need at least {Config.MIN_TRAINING_SAMPLES} samples, got {len(training_data)}',
                    'samples_provided': len(training_data),
                    'samples_required': Config.MIN_TRAINING_SAMPLES
                }
            
            # Extract features from all training sessions
            feature_vectors = []
            
            for session in training_data:
                keystroke_data = session.get('keystroke_data', [])
                mouse_data = session.get('mouse_data', [])
                
                keystroke_features = self.feature_extractor.extract_keystroke_features(keystroke_data)
                mouse_features = self.feature_extractor.extract_mouse_features(mouse_data)
                combined_features = self.feature_extractor.combine_features(
                    keystroke_features,
                    mouse_features
                )
                
                feature_vectors.append(combined_features)
            
            # Convert to numpy array
            feature_matrix = np.array(feature_vectors)
            
            # Train anomaly detector
            detector = self.get_detector(user_id)
            success = detector.train(feature_matrix)
            
            if success:
                # Get encrypted profile for storage
                encrypted_profile = self.get_encrypted_profile(user_id)
                
                return {
                    'success': True,
                    'user_id': user_id,
                    'samples_trained': len(training_data),
                    'feature_dimension': feature_matrix.shape[1],
                    'encrypted_profile': encrypted_profile,
                    'model_info': detector.get_model_info(),
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'error': 'Training failed',
                    'user_id': user_id
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'user_id': user_id,
                'timestamp': datetime.now().isoformat()
            }
    
    def assess_risk(
        self,
        user_id: int,
        keystroke_data: List[Dict],
        mouse_data: List[Dict]
    ) -> Dict:
        """
        Assess real-time risk score for current behavior
        
        Args:
            user_id: User identifier
            keystroke_data: Current keystroke events
            mouse_data: Current mouse movement events
            
        Returns:
            Risk assessment dictionary
        """
        return self.process_behavioral_data(
            user_id=user_id,
            keystroke_data=keystroke_data,
            mouse_data=mouse_data,
            mode='assess'
        )
    
    def get_encrypted_profile(self, user_id: int) -> str:
        """
        Get encrypted biometric profile for storage
        
        Args:
            user_id: User identifier
            
        Returns:
            Base64 encoded encrypted profile
        """
        try:
            detector = self.get_detector(user_id)
            
            profile_data = {
                'user_id': user_id,
                'is_trained': detector.is_trained,
                'training_samples': detector.training_samples,
                'feature_dim': detector.feature_dim,
                'created_at': datetime.now().isoformat()
            }
            
            return self.encryption_service.encrypt_profile(profile_data)
            
        except Exception as e:
            raise Exception(f"Failed to encrypt profile for user {user_id}: {str(e)}")
    
    def load_encrypted_profile(self, user_id: int, encrypted_profile: str) -> bool:
        """
        Load user's biometric profile from encrypted storage
        
        Args:
            user_id: User identifier
            encrypted_profile: Base64 encoded encrypted profile
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Decrypt profile
            profile_data = self.encryption_service.decrypt_profile(encrypted_profile)
            
            # Extract training samples
            training_samples = profile_data.get('training_samples', [])
            
            if training_samples:
                # Train detector with stored samples
                detector = self.get_detector(user_id)
                feature_matrix = np.array(training_samples)
                return detector.train(feature_matrix)
            
            return False
            
        except Exception as e:
            print(f"Failed to load profile for user {user_id}: {str(e)}")
            return False
    
    def update_profile(
        self,
        user_id: int,
        new_keystroke_data: List[Dict],
        new_mouse_data: List[Dict]
    ) -> Dict:
        """
        Update user's profile with new legitimate behavioral data
        
        Args:
            user_id: User identifier
            new_keystroke_data: New keystroke events
            new_mouse_data: New mouse movement events
            
        Returns:
            Update result dictionary
        """
        try:
            # Extract features
            keystroke_features = self.feature_extractor.extract_keystroke_features(new_keystroke_data)
            mouse_features = self.feature_extractor.extract_mouse_features(new_mouse_data)
            combined_features = self.feature_extractor.combine_features(
                keystroke_features,
                mouse_features
            )
            
            # Update detector
            detector = self.get_detector(user_id)
            success = detector.update_training(
                combined_features.reshape(1, -1),
                max_samples=Config.TRAINING_WINDOW_SIZE
            )
            
            if success:
                # Get updated encrypted profile
                encrypted_profile = self.get_encrypted_profile(user_id)
                
                return {
                    'success': True,
                    'user_id': user_id,
                    'encrypted_profile': encrypted_profile,
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'error': 'Profile update failed'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _determine_action(self, risk_score: float) -> str:
        """
        Determine required action based on risk score
        
        Args:
            risk_score: Risk score (0-100)
            
        Returns:
            Action string: 'none', 'monitor', 'challenge', 'lock'
        """
        # Green (0-49%): Normal behavior - no action
        # Orange (50-79%): Suspicious behavior - challenge with step-up auth
        # Red (80-100%): Highly anomalous - immediate session lock
        if risk_score < Config.RISK_THRESHOLD_MODERATE:
            return 'none'  # Green - Normal behavior
        elif risk_score < Config.RISK_THRESHOLD_HIGH:
            return 'challenge'  # Orange - Step-up authentication required
        else:
            return 'lock'  # Red - Immediate session lock
    
    def get_user_status(self, user_id: Union[int, str]) -> Dict:
        """
        Get current status of user's biometric profile
        
        Args:
            user_id: User identifier (int or string)
            
        Returns:
            Status dictionary
        """
        detector = self.get_detector(user_id)
        return {
            'user_id': user_id,
            'model_info': detector.get_model_info(),
            'timestamp': datetime.now().isoformat()
        }
