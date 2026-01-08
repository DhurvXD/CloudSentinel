import json
import os
from datetime import datetime

class Database:
    """
    Simple JSON-based database for CloudSentinel
    Stores users, files metadata, and audit logs
    """
    
    def __init__(self):
        """Initialize database files"""
        self.db_folder = 'database'
        self.users_file = os.path.join(self.db_folder, 'users.json')
        self.files_file = os.path.join(self.db_folder, 'files.json')
        self.audit_file = os.path.join(self.db_folder, 'audit_log.json')
        
        # Create database folder if it doesn't exist
        if not os.path.exists(self.db_folder):
            os.makedirs(self.db_folder)
            print(f"✅ Created database folder: {self.db_folder}")
        
        # Initialize database files if they don't exist
        self._init_file(self.users_file, {})
        self._init_file(self.files_file, {})
        self._init_file(self.audit_file, [])
    
    def _init_file(self, filepath, default_data):
        """Create a database file with default data if it doesn't exist"""
        if not os.path.exists(filepath):
            with open(filepath, 'w') as f:
                json.dump(default_data, f, indent=2)
            print(f"✅ Created database file: {filepath}")
    
    def _read_json(self, filepath):
        """Read data from a JSON file"""
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Error reading {filepath}: {str(e)}")
            return {} if filepath != self.audit_file else []
    
    def _write_json(self, filepath, data):
        """Write data to a JSON file"""
        try:
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
            return True
        except Exception as e:
            print(f"❌ Error writing {filepath}: {str(e)}")
            return False
    
    # ==================== USER OPERATIONS ====================
    
    def create_user(self, username, email, password_hash):
        """Create a new user"""
        users = self._read_json(self.users_file)
        
        # Check if user already exists
        if username in users:
            return {'success': False, 'message': 'Username already exists'}
        
        # Check if email already exists
        for user_data in users.values():
            if user_data['email'] == email:
                return {'success': False, 'message': 'Email already registered'}
        
        # Create user
        users[username] = {
            'email': email,
            'password_hash': password_hash,
            'created_at': datetime.now().isoformat(),
            'role': 'user'  # Can be 'user' or 'admin'
        }
        
        if self._write_json(self.users_file, users):
            return {'success': True, 'message': 'User created successfully'}
        else:
            return {'success': False, 'message': 'Failed to save user'}
    
    def get_user(self, username):
        """Get user by username"""
        users = self._read_json(self.users_file)
        return users.get(username)
    
    def get_user_by_email(self, email):
        """Get user by email"""
        users = self._read_json(self.users_file)
        for username, user_data in users.items():
            if user_data['email'] == email:
                return {**user_data, 'username': username}
        return None
    
    def list_users(self):
        """List all users (excluding password hashes)"""
        users = self._read_json(self.users_file)
        safe_users = {}
        for username, data in users.items():
            safe_users[username] = {
                'email': data['email'],
                'created_at': data['created_at'],
                'role': data['role']
            }
        return safe_users
    
    # ==================== FILE OPERATIONS ====================
    
    def save_file_metadata(self, file_id, owner, original_filename, metadata):
        """Save file metadata including ownership and access control"""
        files = self._read_json(self.files_file)
        
        files[file_id] = {
            'owner': owner,
            'original_filename': original_filename,
            'uploaded_at': datetime.now().isoformat(),
            'allowed_users': [owner],  # Owner always has access
            'access_start_time': metadata.get('access_start_time', '09:00'),
            'access_end_time': metadata.get('access_end_time', '18:00'),
            'allowed_regions': metadata.get('allowed_regions', ['IN', 'US', 'GB']),
            'encryption_metadata': metadata.get('encryption_metadata', {})
        }
        
        if self._write_json(self.files_file, files):
            return {'success': True, 'message': 'File metadata saved'}
        else:
            return {'success': False, 'message': 'Failed to save metadata'}
    
    def get_file_metadata(self, file_id):
        """Get file metadata"""
        files = self._read_json(self.files_file)
        return files.get(file_id)
    
    def update_file_access(self, file_id, allowed_users=None, access_times=None, allowed_regions=None):
        """Update file access control settings"""
        files = self._read_json(self.files_file)
        
        if file_id not in files:
            return {'success': False, 'message': 'File not found'}
        
        if allowed_users is not None:
            files[file_id]['allowed_users'] = allowed_users
        
        if access_times is not None:
            files[file_id]['access_start_time'] = access_times['start']
            files[file_id]['access_end_time'] = access_times['end']
        
        if allowed_regions is not None:
            files[file_id]['allowed_regions'] = allowed_regions
        
        if self._write_json(self.files_file, files):
            return {'success': True, 'message': 'Access control updated'}
        else:
            return {'success': False, 'message': 'Failed to update access control'}
    
    def list_files_by_owner(self, owner):
        """List all files owned by a user"""
        files = self._read_json(self.files_file)
        owner_files = {}
        for file_id, metadata in files.items():
            if metadata['owner'] == owner:
                owner_files[file_id] = metadata
        return owner_files
    
    def list_accessible_files(self, username):
        """List all files that a user can access"""
        files = self._read_json(self.files_file)
        accessible_files = {}
        for file_id, metadata in files.items():
            if username in metadata['allowed_users']:
                accessible_files[file_id] = metadata
        return accessible_files
    
    def delete_file_metadata(self, file_id):
        """Delete file metadata"""
        files = self._read_json(self.files_file)
        
        if file_id not in files:
            return {'success': False, 'message': 'File not found'}
        
        del files[file_id]
        
        if self._write_json(self.files_file, files):
            return {'success': True, 'message': 'File metadata deleted'}
        else:
            return {'success': False, 'message': 'Failed to delete metadata'}
    
    # ==================== AUDIT LOG OPERATIONS ====================
    
    def log_event(self, event_type, username, file_id=None, details=None, ip_address=None, success=True):
        """Log an event to the audit log"""
        audit_logs = self._read_json(self.audit_file)
        
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'event_type': event_type,  # e.g., 'LOGIN', 'UPLOAD', 'DOWNLOAD', 'ACCESS_DENIED'
            'username': username,
            'file_id': file_id,
            'ip_address': ip_address,
            'success': success,
            'details': details or {}
        }
        
        audit_logs.append(log_entry)
        
        # Keep only last 1000 logs to prevent file from growing too large
        if len(audit_logs) > 1000:
            audit_logs = audit_logs[-1000:]
        
        self._write_json(self.audit_file, audit_logs)
    
    def get_audit_logs(self, username=None, file_id=None, limit=50):
        """Get audit logs with optional filters"""
        audit_logs = self._read_json(self.audit_file)
        
        # Filter logs
        filtered_logs = audit_logs
        
        if username:
            filtered_logs = [log for log in filtered_logs if log['username'] == username]
        
        if file_id:
            filtered_logs = [log for log in filtered_logs if log['file_id'] == file_id]
        
        # Return most recent logs
        return filtered_logs[-limit:][::-1]  # Reverse to get newest first


# Test the database
if __name__ == "__main__":
    print("🗄️  Testing Database...\n")
    
    db = Database()
    
    # Test user creation
    print("👤 Test 1: Creating test user...")
    result = db.create_user('testuser', 'test@example.com', 'hashed_password_here')
    print(f"   {result}\n")
    
    # Test getting user
    print("👤 Test 2: Getting user...")
    user = db.get_user('testuser')
    print(f"   User: {user}\n")
    
    # Test file metadata
    print("📄 Test 3: Saving file metadata...")
    result = db.save_file_metadata(
        'test_file_123',
        'testuser',
        'secret.txt',
        {'access_start_time': '10:00', 'access_end_time': '17:00'}
    )
    print(f"   {result}\n")
    
    # Test getting file metadata
    print("📄 Test 4: Getting file metadata...")
    file_meta = db.get_file_metadata('test_file_123')
    print(f"   Metadata: {file_meta}\n")
    
    # Test audit logging
    print("📋 Test 5: Logging event...")
    db.log_event('UPLOAD', 'testuser', 'test_file_123', {'size': '1024'}, '192.168.1.1', True)
    logs = db.get_audit_logs(limit=5)
    print(f"   Latest log: {logs[0] if logs else 'No logs'}\n")
    
    print("✅ Database tests completed!")