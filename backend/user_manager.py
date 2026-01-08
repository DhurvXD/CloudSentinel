import bcrypt
from flask_jwt_extended import create_access_token, create_refresh_token
from datetime import timedelta
from database import Database

class UserManager:
    """
    Handles user registration, authentication, and JWT token generation
    """
    
    def __init__(self):
        """Initialize user manager with database"""
        self.db = Database()
    
    def hash_password(self, password: str) -> str:
        """
        Hash a password using bcrypt
        
        Args:
            password: Plain text password
        
        Returns:
            Hashed password as string
        """
        # Generate salt and hash password
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash
        
        Args:
            password: Plain text password
            hashed_password: Hashed password from database
        
        Returns:
            True if password matches, False otherwise
        """
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def register_user(self, username: str, email: str, password: str) -> dict:
        """
        Register a new user
        
        Args:
            username: Desired username (must be unique)
            email: Email address (must be unique)
            password: Plain text password (will be hashed)
        
        Returns:
            dict: Registration status
        """
        try:
            # Validate inputs
            if not username or len(username) < 3:
                return {
                    'success': False,
                    'message': 'Username must be at least 3 characters long'
                }
            
            if not email or '@' not in email:
                return {
                    'success': False,
                    'message': 'Invalid email address'
                }
            
            if not password or len(password) < 6:
                return {
                    'success': False,
                    'message': 'Password must be at least 6 characters long'
                }
            
            # Hash password
            password_hash = self.hash_password(password)
            
            # Create user in database
            result = self.db.create_user(username, email, password_hash)
            
            if result['success']:
                # Log the registration
                self.db.log_event(
                    event_type='REGISTER',
                    username=username,
                    details={'email': email},
                    success=True
                )
            
            return result
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Registration failed: {str(e)}'
            }
    
    def login_user(self, username: str, password: str, ip_address: str = None) -> dict:
        """
        Authenticate a user and generate JWT tokens
        
        Args:
            username: Username
            password: Plain text password
            ip_address: User's IP address (for logging)
        
        Returns:
            dict: Login status with JWT tokens if successful
        """
        try:
            # Get user from database
            user = self.db.get_user(username)
            
            if not user:
                # Log failed login attempt
                self.db.log_event(
                    event_type='LOGIN_FAILED',
                    username=username,
                    ip_address=ip_address,
                    details={'reason': 'User not found'},
                    success=False
                )
                return {
                    'success': False,
                    'message': 'Invalid username or password'
                }
            
            # Verify password
            if not self.verify_password(password, user['password_hash']):
                # Log failed login attempt
                self.db.log_event(
                    event_type='LOGIN_FAILED',
                    username=username,
                    ip_address=ip_address,
                    details={'reason': 'Wrong password'},
                    success=False
                )
                return {
                    'success': False,
                    'message': 'Invalid username or password'
                }
            
            # Generate JWT tokens
            access_token = create_access_token(
                identity=username,
                additional_claims={'role': user['role']},
                expires_delta=timedelta(hours=24)  # Token valid for 24 hours
            )
            
            refresh_token = create_refresh_token(
                identity=username,
                expires_delta=timedelta(days=30)  # Refresh token valid for 30 days
            )
            
            # Log successful login
            self.db.log_event(
                event_type='LOGIN_SUCCESS',
                username=username,
                ip_address=ip_address,
                success=True
            )
            
            return {
                'success': True,
                'message': 'Login successful',
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'username': username,
                    'email': user['email'],
                    'role': user['role']
                }
            }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Login failed: {str(e)}'
            }
    
    def get_user_info(self, username: str) -> dict:
        """
        Get user information (without password)
        
        Args:
            username: Username
        
        Returns:
            dict: User information or error
        """
        user = self.db.get_user(username)
        
        if not user:
            return {
                'success': False,
                'message': 'User not found'
            }
        
        return {
            'success': True,
            'user': {
                'username': username,
                'email': user['email'],
                'role': user['role'],
                'created_at': user['created_at']
            }
        }
    
    def list_all_users(self) -> dict:
        """
        List all users (admin function)
        
        Returns:
            dict: List of all users
        """
        users = self.db.list_users()
        return {
            'success': True,
            'users': users
        }


# Test the user manager
if __name__ == "__main__":
    print("👤 Testing User Manager...\n")
    
    manager = UserManager()
    
    # Test 1: Register a user
    print("📝 Test 1: Registering new user...")
    result = manager.register_user('dhruv123', 'dhruv@cloudsentinel.com', 'securepass123')
    print(f"   Result: {result}\n")
    
    # Test 2: Try to register duplicate user
    print("📝 Test 2: Trying to register duplicate user...")
    result = manager.register_user('dhruv123', 'another@email.com', 'password456')
    print(f"   Result: {result}\n")
    
    # Test 3: Login with correct password
    print("🔐 Test 3: Login with correct password...")
    result = manager.login_user('dhruv123', 'securepass123', '127.0.0.1')
    if result['success']:
        print(f"   ✅ Login successful!")
        print(f"   Access Token: {result['access_token'][:50]}...")
        print(f"   User: {result['user']}\n")
    else:
        print(f"   ❌ Login failed: {result['message']}\n")
    
    # Test 4: Login with wrong password
    print("🔐 Test 4: Login with wrong password...")
    result = manager.login_user('dhruv123', 'wrongpassword', '127.0.0.1')
    print(f"   Result: {result}\n")
    
    # Test 5: Get user info
    print("👤 Test 5: Getting user info...")
    result = manager.get_user_info('dhruv123')
    print(f"   Result: {result}\n")
    
    # Test 6: List all users
    print("📋 Test 6: Listing all users...")
    result = manager.list_all_users()
    print(f"   Users: {result['users']}\n")
    
    print("✅ User Manager tests completed!")