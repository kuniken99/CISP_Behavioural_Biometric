# cbba_python_service/encryption_service.py
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
import os
import base64
import json


class BiometricEncryptionService:
    """AES-256 encryption service for biometric profiles"""
    
    def __init__(self, encryption_key: str):
        """
        Initialize encryption service with AES-256 key
        
        Args:
            encryption_key: 32-byte hex key for AES-256
        """
        # Convert hex key to bytes (must be 32 bytes for AES-256)
        if len(encryption_key) == 64:  # Hex string (32 bytes * 2)
            self.key = bytes.fromhex(encryption_key)
        else:
            # Generate key from string (for development)
            self.key = encryption_key.encode('utf-8').ljust(32)[:32]
    
    def encrypt_profile(self, profile_data: dict) -> str:
        """
        Encrypt biometric profile data using AES-256-CBC
        
        Args:
            profile_data: Dictionary containing biometric profile
            
        Returns:
            Base64 encoded encrypted data
        """
        try:
            # Convert profile to JSON bytes
            plaintext = json.dumps(profile_data).encode('utf-8')
            
            # Generate random IV (Initialization Vector)
            iv = os.urandom(16)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(self.key),
                modes.CBC(iv),
                backend=default_backend()
            )
            
            # Pad plaintext to block size (128 bits = 16 bytes)
            padder = padding.PKCS7(128).padder()
            padded_data = padder.update(plaintext) + padder.finalize()
            
            # Encrypt
            encryptor = cipher.encryptor()
            ciphertext = encryptor.update(padded_data) + encryptor.finalize()
            
            # Combine IV and ciphertext, then base64 encode
            encrypted_data = iv + ciphertext
            return base64.b64encode(encrypted_data).decode('utf-8')
            
        except Exception as e:
            raise Exception(f"Encryption failed: {str(e)}")
    
    def decrypt_profile(self, encrypted_data: str) -> dict:
        """
        Decrypt biometric profile data
        
        Args:
            encrypted_data: Base64 encoded encrypted data
            
        Returns:
            Decrypted profile dictionary
        """
        try:
            # Decode base64
            encrypted_bytes = base64.b64decode(encrypted_data)
            
            # Extract IV (first 16 bytes) and ciphertext
            iv = encrypted_bytes[:16]
            ciphertext = encrypted_bytes[16:]
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(self.key),
                modes.CBC(iv),
                backend=default_backend()
            )
            
            # Decrypt
            decryptor = cipher.decryptor()
            padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            
            # Unpad
            unpadder = padding.PKCS7(128).unpadder()
            plaintext = unpadder.update(padded_plaintext) + unpadder.finalize()
            
            # Convert JSON bytes back to dictionary
            return json.loads(plaintext.decode('utf-8'))
            
        except Exception as e:
            raise Exception(f"Decryption failed: {str(e)}")
    
    @staticmethod
    def generate_key() -> str:
        """
        Generate a random 32-byte (256-bit) AES key
        
        Returns:
            Hex string representation of the key
        """
        return os.urandom(32).hex()


# Example usage for testing
if __name__ == '__main__':
    # Generate a new key
    key = BiometricEncryptionService.generate_key()
    print(f"Generated AES-256 Key: {key}")
    
    # Create service
    service = BiometricEncryptionService(key)
    
    # Test encryption/decryption
    test_profile = {
        'user_id': 123,
        'model_type': 'isolation_forest',
        'features': [1.2, 3.4, 5.6],
        'trained_at': '2025-01-18T10:00:00Z'
    }
    
    encrypted = service.encrypt_profile(test_profile)
    print(f"\nEncrypted: {encrypted[:50]}...")
    
    decrypted = service.decrypt_profile(encrypted)
    print(f"\nDecrypted: {decrypted}")
    print(f"\nMatch: {test_profile == decrypted}")
