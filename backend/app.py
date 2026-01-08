from flask import Flask, request, jsonify, send_file
from flask_cors import CORS, cross_origin
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
from werkzeug.utils import secure_filename
import os
import io
from dotenv import load_dotenv

# Import our custom modules
from encryption import FileEncryption
from aws_handler import AWSHandler
from user_manager import UserManager
from access_control import AccessControl
from audit_logger import AuditLogger
from database import Database

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
jwt = JWTManager(app)

# Initialize our handlers
encryptor = FileEncryption()
aws_handler = AWSHandler()
user_manager = UserManager()
access_control = AccessControl()
audit_logger = AuditLogger()
database = Database()

# Configuration
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xlsx', 'zip'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_extension(filename):
    """Get file extension"""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def get_client_ip():
    """Get client's IP address"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0]
    return request.remote_addr or '127.0.0.1'


# ==================== PUBLIC ENDPOINTS (No Authentication) ====================

@app.route('/')
def home():
    """Home endpoint - API status"""
    return jsonify({
        'status': 'success',
        'message': 'CloudSentinel Zero-Trust API is running! 🛡️',
        'version': '2.0 - Zero Trust Edition',
        'features': [
            'User Authentication',
            'File Encryption (AES-256)',
            'Zero-Trust Access Control',
            'Time-Based Access',
            'Location-Based Access',
            'Audit Logging'
        ],
        'endpoints': {
            'auth': {
                'register': '/api/auth/register',
                'login': '/api/auth/login',
                'user_info': '/api/auth/me'
            },
            'files': {
                'upload': '/api/upload',
                'download': '/api/download/<file_id>',
                'list': '/api/files',
                'my_files': '/api/files/my',
                'share': '/api/files/<file_id>/share',
                'delete': '/api/files/<file_id>'
            },
            'audit': {
                'my_activity': '/api/audit/me',
                'file_activity': '/api/audit/file/<file_id>',
                'security_report': '/api/audit/report'
            }
        }
    })


@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({
                'success': False,
                'message': 'Username, email, and password are required'
            }), 400
        
        # Register user
        result = user_manager.register_user(username, email, password)
        
        if result['success']:
            # Log registration
            audit_logger.log_authentication(
                username, 
                'REGISTER', 
                get_client_ip(), 
                True
            )
            return jsonify(result), 201
        else:
            return jsonify(result), 400
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Registration failed: {str(e)}'
        }), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not all([username, password]):
            return jsonify({
                'success': False,
                'message': 'Username and password are required'
            }), 400
        
        # Attempt login
        result = user_manager.login_user(username, password, get_client_ip())
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 401
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Login failed: {str(e)}'
        }), 500


# ==================== PROTECTED ENDPOINTS (Require Authentication) ====================

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_user_info():
    """Get current user information"""
    try:
        current_user = get_jwt_identity()
        result = user_manager.get_user_info(current_user)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get user info: {str(e)}'
        }), 500


@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """
    Upload and encrypt a file with Zero-Trust metadata
    
    Requires JWT authentication
    """
    try:
        current_user = get_jwt_identity()
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        password = request.form.get('password')
        
        # Optional: Access control settings
        allowed_users = request.form.get('allowed_users', current_user)  # Comma-separated usernames
        access_start_time = request.form.get('access_start_time', os.getenv('DEFAULT_ACCESS_START_TIME', '09:00'))
        access_end_time = request.form.get('access_end_time', os.getenv('DEFAULT_ACCESS_END_TIME', '18:00'))
        allowed_regions = request.form.get('allowed_regions', os.getenv('ALLOWED_REGIONS', 'IN,US,GB'))
        
        # Validate inputs
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        if not password:
            return jsonify({
                'success': False,
                'message': 'Password is required'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Read file data
        file_data = file.read()
        
        # Check file size
        if len(file_data) > MAX_FILE_SIZE:
            return jsonify({
                'success': False,
                'message': f'File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)} MB'
            }), 400
        
        # Get original filename
        original_filename = secure_filename(file.filename)
        file_extension = get_file_extension(original_filename)
        
        # Step 1: Encrypt the file
        print(f"🔐 Encrypting file: {original_filename} for user: {current_user}")
        encryption_result = encryptor.encrypt_file(file_data, password)
        
        if not encryption_result['success']:
            return jsonify({
                'success': False,
                'message': encryption_result['message']
            }), 500
        
        # Step 2: Upload encrypted file to S3
        print(f"☁️  Uploading to S3...")
        encrypted_filename = f"{current_user}_{original_filename}.encrypted"
        
        upload_result = aws_handler.upload_file(
            file_data=encryption_result['encrypted_data'],
            filename=encrypted_filename,
            metadata={
                'salt': encryption_result['salt'],
                'original_filename': original_filename,
                'file_extension': file_extension,
                'owner': current_user
            }
        )
        
        if not upload_result['success']:
            return jsonify({
                'success': False,
                'message': upload_result['message']
            }), 500
        
        # Step 3: Save file metadata with Zero-Trust access control
        file_id = upload_result['s3_key']
        
        # Parse allowed users
        allowed_users_list = [u.strip() for u in allowed_users.split(',') if u.strip()]
        if current_user not in allowed_users_list:
            allowed_users_list.insert(0, current_user)  # Owner always has access
        
        # Parse allowed regions
        allowed_regions_list = [r.strip() for r in allowed_regions.split(',') if r.strip()]
        
        metadata_result = database.save_file_metadata(
            file_id=file_id,
            owner=current_user,
            original_filename=original_filename,
            metadata={
                'access_start_time': access_start_time,
                'access_end_time': access_end_time,
                'allowed_regions': allowed_regions_list,
                'encryption_metadata': {
                    'encrypted_size': upload_result['size'],
                    'original_size': len(file_data)
                }
            }
        )
        
        if not metadata_result['success']:
            return jsonify({
                'success': False,
                'message': 'File uploaded but metadata save failed'
            }), 500
        
        # Update allowed users list
        database.update_file_access(file_id, allowed_users=allowed_users_list)
        
        # Step 4: Log the upload
        audit_logger.log_upload(
            current_user,
            file_id,
            original_filename,
            len(file_data),
            get_client_ip()
        )
        
        # Success!
        return jsonify({
            'success': True,
            'message': 'File uploaded and encrypted successfully! 🎉',
            'file_id': file_id,
            'original_filename': original_filename,
            'encrypted_size': upload_result['size'],
            'original_size': len(file_data),
            'access_control': {
                'allowed_users': allowed_users_list,
                'time_window': f"{access_start_time} - {access_end_time}",
                'allowed_regions': allowed_regions_list
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Upload failed: {str(e)}'
        }), 500


@app.route('/api/download/<path:file_id>', methods=['POST'])
@jwt_required()
def download_file(file_id):
    """
    Download and decrypt a file with Zero-Trust verification
    
    Requires JWT authentication
    Verifies: User permission, Time window, Location
    """
    try:
        current_user = get_jwt_identity()
        client_ip = get_client_ip()
        
        # Get password from request
        data = request.get_json()
        password = data.get('password')
        
        if not password:
            return jsonify({
                'success': False,
                'message': 'Password is required'
            }), 400
        
        # ZERO-TRUST VERIFICATION
        print(f"🛡️  Zero-Trust verification for {current_user} accessing {file_id}")
        verification = access_control.verify_access(current_user, file_id, client_ip)
        
        if not verification['allowed']:
            # Log access denied
            audit_logger.log_access_denied(
                current_user,
                file_id,
                verification['denied_reason'],
                verification['failed_check'],
                client_ip,
                details=verification['checks']
            )
            
            return jsonify({
                'success': False,
                'message': f"Access Denied: {verification['denied_reason']}",
                'failed_check': verification['failed_check'],
                'details': verification['checks']
            }), 403
        
        print(f"✅ Zero-Trust verification passed!")
        
        # Step 1: Download encrypted file from S3
        print(f"☁️  Downloading from S3: {file_id}")
        download_result = aws_handler.download_file(file_id)
        
        if not download_result['success']:
            audit_logger.log_download(current_user, file_id, 'unknown', client_ip, success=False)
            return jsonify({
                'success': False,
                'message': download_result['message']
            }), 404
        
        # Step 2: Decrypt the file
        print(f"🔓 Decrypting file...")
        decryption_result = encryptor.decrypt_file(
            encrypted_data=download_result['file_data'],
            password=password,
            salt=download_result['metadata']['salt']
        )
        
        if not decryption_result['success']:
            audit_logger.log_download(current_user, file_id, 
                                     download_result['metadata'].get('original_filename', 'unknown'), 
                                     client_ip, success=False)
            return jsonify({
                'success': False,
                'message': 'Decryption failed - Wrong password?'
            }), 401
        
        # Step 3: Log successful download
        original_filename = download_result['metadata'].get('original_filename', 'decrypted_file')
        audit_logger.log_download(current_user, file_id, original_filename, client_ip, success=True)
        
        # Step 4: Send decrypted file to user
        return send_file(
            io.BytesIO(decryption_result['decrypted_data']),
            as_attachment=True,
            download_name=original_filename
        )
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Download failed: {str(e)}'
        }), 500


@app.route('/api/files', methods=['GET'])
@jwt_required()
def list_all_accessible_files():
    """List all files the current user can access"""
    try:
        current_user = get_jwt_identity()
        
        # Get files user can access
        accessible_files = database.list_accessible_files(current_user)
        
        return jsonify({
            'success': True,
            'message': f'Found {len(accessible_files)} accessible files',
            'files': accessible_files
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to list files: {str(e)}'
        }), 500


@app.route('/api/files/my', methods=['GET'])
@jwt_required()
def list_my_files():
    """List files owned by current user"""
    try:
        current_user = get_jwt_identity()
        
        # Get files owned by user
        my_files = database.list_files_by_owner(current_user)
        
        return jsonify({
            'success': True,
            'message': f'Found {len(my_files)} owned files',
            'files': my_files
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to list files: {str(e)}'
        }), 500


@app.route('/api/files/<path:file_id>/share', methods=['POST'])
@jwt_required()
def share_file(file_id):
    """Update file access permissions (owner only)"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        # Get file metadata
        file_meta = database.get_file_metadata(file_id)
        
        if not file_meta:
            return jsonify({
                'success': False,
                'message': 'File not found'
            }), 404
        
        # Check if current user is the owner
        if file_meta['owner'] != current_user:
            return jsonify({
                'success': False,
                'message': 'Only file owner can modify permissions'
            }), 403
        
        # Update access control
        allowed_users = data.get('allowed_users')
        access_times = data.get('access_times')
        allowed_regions = data.get('allowed_regions')
        
        result = database.update_file_access(
            file_id,
            allowed_users=allowed_users,
            access_times=access_times,
            allowed_regions=allowed_regions
        )
        
        if result['success']:
            # Log permission change
            audit_logger.log_permission_change(
                current_user,
                file_id,
                data,
                get_client_ip()
            )
        
        return jsonify(result), 200 if result['success'] else 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to update permissions: {str(e)}'
        }), 500


@app.route('/api/files/<path:file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(file_id):
    """Delete a file (owner only)"""
    try:
        current_user = get_jwt_identity()
        
        # Get file metadata
        file_meta = database.get_file_metadata(file_id)
        
        if not file_meta:
            return jsonify({
                'success': False,
                'message': 'File not found'
            }), 404
        
        # Check if current user is the owner
        if file_meta['owner'] != current_user:
            return jsonify({
                'success': False,
                'message': 'Only file owner can delete files'
            }), 403
        
        # Delete from S3
        aws_result = aws_handler.delete_file(file_id)
        
        if not aws_result['success']:
            return jsonify(aws_result), 500
        
        # Delete metadata
        db_result = database.delete_file_metadata(file_id)
        
        if db_result['success']:
            # Log deletion
            audit_logger.log_file_deletion(
                current_user,
                file_id,
                file_meta['original_filename'],
                get_client_ip()
            )
        
        return jsonify(db_result), 200 if db_result['success'] else 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Delete failed: {str(e)}'
        }), 500


@app.route('/api/audit/me', methods=['GET'])
@jwt_required()
def get_my_activity():
    """Get current user's activity logs"""
    try:
        current_user = get_jwt_identity()
        limit = request.args.get('limit', 50, type=int)
        
        result = audit_logger.get_user_activity(current_user, limit)
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get activity: {str(e)}'
        }), 500


@app.route('/api/audit/file/<path:file_id>', methods=['GET'])
@jwt_required()
def get_file_activity(file_id):
    """Get activity logs for a specific file"""
    try:
        current_user = get_jwt_identity()
        limit = request.args.get('limit', 50, type=int)
        
        # Check if user has access to this file
        file_meta = database.get_file_metadata(file_id)
        
        if not file_meta:
            return jsonify({
                'success': False,
                'message': 'File not found'
            }), 404
        
        if current_user not in file_meta['allowed_users']:
            return jsonify({
                'success': False,
                'message': 'You do not have access to this file'
            }), 403
        
        result = audit_logger.get_file_activity(file_id, limit)
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get file activity: {str(e)}'
        }), 500


@app.route('/api/audit/report', methods=['GET'])
@jwt_required()
def get_security_report():
    """Get security report for current user"""
    try:
        current_user = get_jwt_identity()
        
        report = audit_logger.generate_security_report(current_user)
        
        return jsonify({
            'success': True,
            'report': report
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to generate report: {str(e)}'
        }), 500


# ==================== RUN SERVER ====================

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🛡️  CloudSentinel Zero-Trust Backend Server Starting...")
    print("="*70)
    print(f"✅ User authentication enabled (JWT)")
    print(f"✅ Zero-Trust access control active")
    print(f"✅ Audit logging enabled")
    print(f"✅ Encryption module loaded (AES-256)")
    print(f"✅ AWS S3 handler initialized")
    print(f"✅ Bucket: {os.getenv('S3_BUCKET_NAME')}")
    print(f"✅ Region: {os.getenv('AWS_REGION')}")
    print("="*70)
    print("📡 Server will run on: http://127.0.0.1:5000")
    print("="*70 + "\n")
    
    # Run Flask server
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=True  # Shows detailed errors (disable in production!)
    )