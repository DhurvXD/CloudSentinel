from cryptography.fernet import Fernet
import os
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

class FileEncryption:
    """
    Handles file encryption and decryption using Fernet (AES-256)
    """
    
    def __init__(self):
        """Initialize the encryption class"""
        pass
    
    def generate_key(self, password: str, salt: bytes = None) -> tuple:
        """
        Generate an encryption key from a password
        
        Args:
            password: The password to derive the key from
            salt: Optional salt for key derivation (randomly generated if not provided)
        
        Returns:
            tuple: (encryption_key, salt)
        """
        # Generate a random salt if not provided
        if salt is None:
            salt = os.urandom(16)  # 16 bytes = 128 bits
        
        # Derive a key from the password using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 32 bytes = 256 bits for AES-256
            salt=salt,
            iterations=100000,  # High iterations for security
            backend=default_backend()
        )
        
        # Generate the key
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        
        return key, salt
    
    def encrypt_file(self, file_data: bytes, password: str) -> dict:
        """
        Encrypt file data using Fernet encryption
        
        Args:
            file_data: The file content as bytes
            password: Password to encrypt with
        
        Returns:
            dict: Contains encrypted_data and salt
        """
        try:
            # Generate encryption key and salt
            key, salt = self.generate_key(password)
            
            # Create Fernet cipher
            cipher = Fernet(key)
            
            # Encrypt the file data
            encrypted_data = cipher.encrypt(file_data)
            
            return {
                'encrypted_data': encrypted_data,
                'salt': salt,
                'success': True,
                'message': 'File encrypted successfully'
            }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Encryption failed: {str(e)}'
            }
    
    def decrypt_file(self, encrypted_data: bytes, password: str, salt: bytes) -> dict:
        """
        Decrypt file data using Fernet decryption
        
        Args:
            encrypted_data: The encrypted file content
            password: Password to decrypt with
            salt: Salt used during encryption
        
        Returns:
            dict: Contains decrypted_data or error message
        """
        try:
            # Regenerate the same key using password and salt
            key, _ = self.generate_key(password, salt)
            
            # Create Fernet cipher
            cipher = Fernet(key)
            
            # Decrypt the file data
            decrypted_data = cipher.decrypt(encrypted_data)
            
            return {
                'decrypted_data': decrypted_data,
                'success': True,
                'message': 'File decrypted successfully'
            }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Decryption failed: {str(e)} - Wrong password?'
            }

# Test function (we'll use this to test our encryption)
if __name__ == "__main__":
    # This code runs only when we test this file directly
    print("🔐 Testing Encryption Module...")
    
    encryptor = FileEncryption()
    
    # Test data
    test_data = b"Hello CloudSentinel! This is a secret message."
    test_password = "mysecurepassword123"
    
    # Encrypt
    print("\n📤 Encrypting...")
    encrypted_result = encryptor.encrypt_file(test_data, test_password)
    
    if encrypted_result['success']:
        print("✅ Encryption successful!")
        print(f"   Original size: {len(test_data)} bytes")
        print(f"   Encrypted size: {len(encrypted_result['encrypted_data'])} bytes")
    else:
        print(f"❌ Encryption failed: {encrypted_result['message']}")
    
    # Decrypt
    print("\n📥 Decrypting...")
    decrypted_result = encryptor.decrypt_file(
        encrypted_result['encrypted_data'],
        test_password,
        encrypted_result['salt']
    )
    
    if decrypted_result['success']:
        print("✅ Decryption successful!")
        print(f"   Decrypted message: {decrypted_result['decrypted_data'].decode()}")
    else:
        print(f"❌ Decryption failed: {decrypted_result['message']}")
    
    # Test wrong password
    print("\n🔓 Testing with wrong password...")
    wrong_decrypt = encryptor.decrypt_file(
        encrypted_result['encrypted_data'],
        "wrongpassword",
        encrypted_result['salt']
    )
    
    if not wrong_decrypt['success']:
        print("✅ Correctly rejected wrong password!")
        print(f"   Message: {wrong_decrypt['message']}")