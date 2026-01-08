from database import Database
from datetime import datetime
import json

class AuditLogger:
    """
    Audit logging system for CloudSentinel
    Tracks all security-relevant events
    """
    
    def __init__(self):
        """Initialize audit logger with database"""
        self.db = Database()
    
    def log_upload(self, username: str, file_id: str, filename: str, size: int, ip_address: str) -> None:
        """Log file upload event"""
        self.db.log_event(
            event_type='FILE_UPLOAD',
            username=username,
            file_id=file_id,
            details={
                'filename': filename,
                'size': size,
                'action': 'File uploaded and encrypted'
            },
            ip_address=ip_address,
            success=True
        )
        print(f"📋 Logged: {username} uploaded {filename}")
    
    def log_download(self, username: str, file_id: str, filename: str, ip_address: str, success: bool = True) -> None:
        """Log file download event"""
        self.db.log_event(
            event_type='FILE_DOWNLOAD',
            username=username,
            file_id=file_id,
            details={
                'filename': filename,
                'action': 'File downloaded and decrypted' if success else 'Download failed'
            },
            ip_address=ip_address,
            success=success
        )
        status = "✅" if success else "❌"
        print(f"📋 Logged: {status} {username} download attempt for {filename}")
    
    def log_access_denied(self, username: str, file_id: str, reason: str, failed_check: str, ip_address: str, details: dict = None) -> None:
        """Log access denied event"""
        log_details = {
            'reason': reason,
            'failed_check': failed_check,
            'action': 'Access denied by Zero-Trust policy'
        }
        if details:
            log_details.update(details)
        
        self.db.log_event(
            event_type='ACCESS_DENIED',
            username=username,
            file_id=file_id,
            details=log_details,
            ip_address=ip_address,
            success=False
        )
        print(f"📋 Logged: ❌ Access denied for {username} - {reason}")
    
    def log_permission_change(self, username: str, file_id: str, changes: dict, ip_address: str) -> None:
        """Log permission/access control changes"""
        self.db.log_event(
            event_type='PERMISSION_CHANGE',
            username=username,
            file_id=file_id,
            details={
                'changes': changes,
                'action': 'File access control updated'
            },
            ip_address=ip_address,
            success=True
        )
        print(f"📋 Logged: {username} modified permissions for {file_id}")
    
    def log_file_deletion(self, username: str, file_id: str, filename: str, ip_address: str) -> None:
        """Log file deletion event"""
        self.db.log_event(
            event_type='FILE_DELETE',
            username=username,
            file_id=file_id,
            details={
                'filename': filename,
                'action': 'File permanently deleted'
            },
            ip_address=ip_address,
            success=True
        )
        print(f"📋 Logged: {username} deleted {filename}")
    
    def log_authentication(self, username: str, event_type: str, ip_address: str, success: bool, details: dict = None) -> None:
        """Log authentication events (login, logout, etc.)"""
        self.db.log_event(
            event_type=event_type,
            username=username,
            details=details or {},
            ip_address=ip_address,
            success=success
        )
        status = "✅" if success else "❌"
        print(f"📋 Logged: {status} {event_type} for {username}")
    
    def get_user_activity(self, username: str, limit: int = 50) -> dict:
        """Get activity logs for a specific user"""
        logs = self.db.get_audit_logs(username=username, limit=limit)
        
        return {
            'success': True,
            'username': username,
            'total_events': len(logs),
            'logs': logs
        }
    
    def get_file_activity(self, file_id: str, limit: int = 50) -> dict:
        """Get activity logs for a specific file"""
        logs = self.db.get_audit_logs(file_id=file_id, limit=limit)
        
        return {
            'success': True,
            'file_id': file_id,
            'total_events': len(logs),
            'logs': logs
        }
    
    def get_recent_activity(self, limit: int = 50) -> dict:
        """Get recent activity logs"""
        logs = self.db.get_audit_logs(limit=limit)
        
        return {
            'success': True,
            'total_events': len(logs),
            'logs': logs
        }
    
    def get_security_summary(self, username: str = None) -> dict:
        """Get security summary statistics"""
        logs = self.db.get_audit_logs(username=username, limit=1000)
        
        summary = {
            'total_events': len(logs),
            'successful_events': 0,
            'failed_events': 0,
            'access_denied': 0,
            'uploads': 0,
            'downloads': 0,
            'login_attempts': 0,
            'failed_logins': 0,
            'event_types': {}
        }
        
        for log in logs:
            # Count successes and failures
            if log['success']:
                summary['successful_events'] += 1
            else:
                summary['failed_events'] += 1
            
            # Count specific event types
            event_type = log['event_type']
            summary['event_types'][event_type] = summary['event_types'].get(event_type, 0) + 1
            
            # Count specific events
            if event_type == 'ACCESS_DENIED':
                summary['access_denied'] += 1
            elif event_type == 'FILE_UPLOAD':
                summary['uploads'] += 1
            elif event_type == 'FILE_DOWNLOAD':
                summary['downloads'] += 1
            elif event_type in ['LOGIN_SUCCESS', 'LOGIN_FAILED']:
                summary['login_attempts'] += 1
                if event_type == 'LOGIN_FAILED':
                    summary['failed_logins'] += 1
        
        return {
            'success': True,
            'summary': summary
        }
    
    def generate_security_report(self, username: str = None) -> str:
        """Generate a human-readable security report"""
        summary = self.get_security_summary(username)['summary']
        
        report = f"""
╔══════════════════════════════════════════════════════════════╗
║           CloudSentinel Security Report                      ║
╚══════════════════════════════════════════════════════════════╝

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{'User: ' + username if username else 'All Users'}

📊 Overall Statistics:
   • Total Events: {summary['total_events']}
   • Successful: {summary['successful_events']} ✅
   • Failed: {summary['failed_events']} ❌

🔒 Security Events:
   • Access Denied: {summary['access_denied']}
   • Failed Logins: {summary['failed_logins']}

📁 File Operations:
   • Uploads: {summary['uploads']}
   • Downloads: {summary['downloads']}

🔐 Authentication:
   • Login Attempts: {summary['login_attempts']}
   • Failed Logins: {summary['failed_logins']}

📋 Event Type Breakdown:
"""
        for event_type, count in summary['event_types'].items():
            report += f"   • {event_type}: {count}\n"
        
        report += "\n" + "="*64 + "\n"
        
        return report


# Test the audit logger
if __name__ == "__main__":
    print("📋 Testing Audit Logger...\n")
    
    logger = AuditLogger()
    
    # Test 1: Log upload
    print("Test 1: Logging file upload...")
    logger.log_upload('dhruv123', 'file_001', 'secret.pdf', 2048, '192.168.1.100')
    print()
    
    # Test 2: Log successful download
    print("Test 2: Logging successful download...")
    logger.log_download('dhruv123', 'file_001', 'secret.pdf', '192.168.1.100', success=True)
    print()
    
    # Test 3: Log access denied
    print("Test 3: Logging access denied...")
    logger.log_access_denied(
        'hacker123', 
        'file_001', 
        'User not authorized', 
        'user_permission',
        '123.45.67.89',
        {'attempted_action': 'download'}
    )
    print()
    
    # Test 4: Log authentication
    print("Test 4: Logging authentication events...")
    logger.log_authentication('dhruv123', 'LOGIN_SUCCESS', '192.168.1.100', True)
    logger.log_authentication('hacker123', 'LOGIN_FAILED', '123.45.67.89', False, {'reason': 'Invalid password'})
    print()
    
    # Test 5: Get user activity
    print("Test 5: Getting user activity...")
    activity = logger.get_user_activity('dhruv123', limit=10)
    print(f"   Found {activity['total_events']} events for {activity['username']}")
    if activity['logs']:
        print(f"   Latest event: {activity['logs'][0]['event_type']} at {activity['logs'][0]['timestamp']}")
    print()
    
    # Test 6: Get security summary
    print("Test 6: Getting security summary...")
    summary = logger.get_security_summary()
    print(f"   Total events: {summary['summary']['total_events']}")
    print(f"   Successful: {summary['summary']['successful_events']}")
    print(f"   Failed: {summary['summary']['failed_events']}")
    print(f"   Access denied: {summary['summary']['access_denied']}")
    print()
    
    # Test 7: Generate security report
    print("Test 7: Generating security report...")
    report = logger.generate_security_report('dhruv123')
    print(report)
    
    print("✅ Audit Logger tests completed!")