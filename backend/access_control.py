from datetime import datetime, time
import requests
from database import Database

class AccessControl:
    """
    Zero-Trust Access Control System
    Verifies: Who, When, and Where before granting access
    """
    
    def __init__(self):
        """Initialize access control with database"""
        self.db = Database()
    
    def check_user_permission(self, username: str, file_id: str) -> dict:
        """
        Check if user has permission to access a file
        
        Args:
            username: Username requesting access
            file_id: File ID to access
        
        Returns:
            dict: Permission status
        """
        # Get file metadata
        file_meta = self.db.get_file_metadata(file_id)
        
        if not file_meta:
            return {
                'allowed': False,
                'reason': 'File not found',
                'check': 'file_exists'
            }
        
        # Check if user is in allowed list
        if username not in file_meta['allowed_users']:
            return {
                'allowed': False,
                'reason': f'User {username} not authorized to access this file',
                'check': 'user_permission'
            }
        
        return {
            'allowed': True,
            'reason': 'User has permission',
            'check': 'user_permission'
        }
    
    def check_time_based_access(self, file_id: str) -> dict:
        """
        Check if current time is within allowed access window
        
        Args:
            file_id: File ID to access
        
        Returns:
            dict: Time-based access status
        """
        # Get file metadata
        file_meta = self.db.get_file_metadata(file_id)
        
        if not file_meta:
            return {
                'allowed': False,
                'reason': 'File not found',
                'check': 'time_based'
            }
        
        # Get current time
        current_time = datetime.now().time()
        
        # Parse allowed time window
        try:
            start_time = datetime.strptime(file_meta['access_start_time'], '%H:%M').time()
            end_time = datetime.strptime(file_meta['access_end_time'], '%H:%M').time()
        except Exception as e:
            return {
                'allowed': False,
                'reason': f'Invalid time format in file metadata: {str(e)}',
                'check': 'time_based'
            }
        
        # Check if current time is within window
        if start_time <= current_time <= end_time:
            return {
                'allowed': True,
                'reason': f'Access allowed between {file_meta["access_start_time"]} and {file_meta["access_end_time"]}',
                'current_time': current_time.strftime('%H:%M:%S'),
                'check': 'time_based'
            }
        else:
            return {
                'allowed': False,
                'reason': f'Access only allowed between {file_meta["access_start_time"]} and {file_meta["access_end_time"]}',
                'current_time': current_time.strftime('%H:%M:%S'),
                'check': 'time_based'
            }
    
    def get_location_from_ip(self, ip_address: str) -> dict:
        """
        Get location information from IP address using ip-api.com (free)
        
        Args:
            ip_address: IP address to lookup
        
        Returns:
            dict: Location information
        """
        # Skip localhost/private IPs
        if ip_address in ['127.0.0.1', 'localhost'] or ip_address.startswith('192.168.'):
            return {
                'success': True,
                'country_code': 'IN',  # Default to India for local testing
                'country': 'India',
                'city': 'Local',
                'ip': ip_address,
                'is_local': True
            }
        
        try:
            # Call free IP geolocation API
            response = requests.get(f'http://ip-api.com/json/{ip_address}', timeout=3)
            
            if response.status_code == 200:
                data = response.json()
                
                if data['status'] == 'success':
                    return {
                        'success': True,
                        'country_code': data.get('countryCode', 'UNKNOWN'),
                        'country': data.get('country', 'Unknown'),
                        'city': data.get('city', 'Unknown'),
                        'region': data.get('regionName', 'Unknown'),
                        'ip': ip_address,
                        'is_local': False
                    }
            
            return {
                'success': False,
                'reason': 'Failed to get location data',
                'ip': ip_address
            }
        
        except Exception as e:
            return {
                'success': False,
                'reason': f'Location lookup failed: {str(e)}',
                'ip': ip_address
            }
    
    def check_location_based_access(self, file_id: str, ip_address: str) -> dict:
        """
        Check if access is allowed from user's location
        
        Args:
            file_id: File ID to access
            ip_address: User's IP address
        
        Returns:
            dict: Location-based access status
        """
        # Get file metadata
        file_meta = self.db.get_file_metadata(file_id)
        
        if not file_meta:
            return {
                'allowed': False,
                'reason': 'File not found',
                'check': 'location_based'
            }
        
        # Get location from IP
        location = self.get_location_from_ip(ip_address)
        
        if not location.get('success'):
            # If location lookup fails, deny access for security
            return {
                'allowed': False,
                'reason': location.get('reason', 'Unable to verify location'),
                'check': 'location_based'
            }
        
        # Check if country is in allowed list
        allowed_regions = file_meta.get('allowed_regions', [])
        country_code = location['country_code']
        
        if country_code in allowed_regions:
            return {
                'allowed': True,
                'reason': f'Access allowed from {location["country"]} ({country_code})',
                'location': location,
                'check': 'location_based'
            }
        else:
            return {
                'allowed': False,
                'reason': f'Access denied from {location["country"]} ({country_code}). Allowed regions: {", ".join(allowed_regions)}',
                'location': location,
                'check': 'location_based'
            }
    
    def verify_access(self, username: str, file_id: str, ip_address: str) -> dict:
        """
        Complete Zero-Trust verification: checks user, time, and location
        
        Args:
            username: Username requesting access
            file_id: File ID to access
            ip_address: User's IP address
        
        Returns:
            dict: Complete access verification result
        """
        verification_results = {
            'allowed': False,
            'username': username,
            'file_id': file_id,
            'ip_address': ip_address,
            'timestamp': datetime.now().isoformat(),
            'checks': {}
        }
        
        # Check 1: User Permission
        user_check = self.check_user_permission(username, file_id)
        verification_results['checks']['user_permission'] = user_check
        
        if not user_check['allowed']:
            verification_results['denied_reason'] = user_check['reason']
            verification_results['failed_check'] = 'user_permission'
            return verification_results
        
        # Check 2: Time-Based Access
        time_check = self.check_time_based_access(file_id)
        verification_results['checks']['time_based'] = time_check
        
        if not time_check['allowed']:
            verification_results['denied_reason'] = time_check['reason']
            verification_results['failed_check'] = 'time_based'
            return verification_results
        
        # Check 3: Location-Based Access
        location_check = self.check_location_based_access(file_id, ip_address)
        verification_results['checks']['location_based'] = location_check
        
        if not location_check['allowed']:
            verification_results['denied_reason'] = location_check['reason']
            verification_results['failed_check'] = 'location_based'
            return verification_results
        
        # All checks passed!
        verification_results['allowed'] = True
        verification_results['message'] = 'All Zero-Trust checks passed - Access granted!'
        
        return verification_results


# Test the access control
if __name__ == "__main__":
    print("🛡️  Testing Zero-Trust Access Control...\n")
    
    access_control = AccessControl()
    db = Database()
    
    # Setup: Create a test file with access control
    print("📝 Setup: Creating test file with access control...")
    file_id = 'test_file_zerotrust_123'
    db.save_file_metadata(
        file_id=file_id,
        owner='dhruv123',
        original_filename='secret_document.pdf',
        metadata={
            'access_start_time': '09:00',
            'access_end_time': '23:59',
            'allowed_regions': ['IN', 'US'],
            'encryption_metadata': {}
        }
    )
    
    # Add another user to allowed list
    db.update_file_access(
        file_id=file_id,
        allowed_users=['dhruv123', 'testuser']
    )
    print("   ✅ Test file created\n")
    
    # Test 1: Check user permission (authorized)
    print("👤 Test 1: Checking authorized user...")
    result = access_control.check_user_permission('dhruv123', file_id)
    print(f"   Allowed: {result['allowed']}")
    print(f"   Reason: {result['reason']}\n")
    
    # Test 2: Check user permission (unauthorized)
    print("👤 Test 2: Checking unauthorized user...")
    result = access_control.check_user_permission('hacker123', file_id)
    print(f"   Allowed: {result['allowed']}")
    print(f"   Reason: {result['reason']}\n")
    
    # Test 3: Check time-based access
    print("⏰ Test 3: Checking time-based access...")
    result = access_control.check_time_based_access(file_id)
    print(f"   Allowed: {result['allowed']}")
    print(f"   Reason: {result['reason']}")
    if 'current_time' in result:
        print(f"   Current time: {result['current_time']}\n")
    
    # Test 4: Check location from IP
    print("🌍 Test 4: Getting location from IP...")
    location = access_control.get_location_from_ip('127.0.0.1')
    print(f"   Success: {location['success']}")
    print(f"   Country: {location.get('country', 'N/A')} ({location.get('country_code', 'N/A')})")
    print(f"   Is Local: {location.get('is_local', False)}\n")
    
    # Test 5: Check location-based access
    print("🌍 Test 5: Checking location-based access...")
    result = access_control.check_location_based_access(file_id, '127.0.0.1')
    print(f"   Allowed: {result['allowed']}")
    print(f"   Reason: {result['reason']}\n")
    
    # Test 6: Complete Zero-Trust verification (should pass)
    print("🛡️  Test 6: Complete Zero-Trust verification (authorized)...")
    result = access_control.verify_access('dhruv123', file_id, '127.0.0.1')
    print(f"   Allowed: {result['allowed']}")
    if result['allowed']:
        print(f"   ✅ {result['message']}")
    else:
        print(f"   ❌ Denied: {result['denied_reason']}")
        print(f"   Failed check: {result['failed_check']}")
    print(f"   Checks performed: {list(result['checks'].keys())}\n")
    
    # Test 7: Complete Zero-Trust verification (should fail - unauthorized user)
    print("🛡️  Test 7: Complete Zero-Trust verification (unauthorized user)...")
    result = access_control.verify_access('hacker123', file_id, '127.0.0.1')
    print(f"   Allowed: {result['allowed']}")
    if result['allowed']:
        print(f"   ✅ {result['message']}")
    else:
        print(f"   ❌ Denied: {result['denied_reason']}")
        print(f"   Failed check: {result['failed_check']}\n")
    
    print("✅ Access Control tests completed!")