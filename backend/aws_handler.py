import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import os
from dotenv import load_dotenv
import json
from datetime import datetime

# Load environment variables
load_dotenv()

class AWSHandler:
    """
    Handles all AWS S3 interactions for CloudSentinel
    """
    
    def __init__(self):
        """Initialize AWS S3 client"""
        try:
            # Get credentials from .env file
            self.aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
            self.aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
            self.region = os.getenv('AWS_REGION')
            self.bucket_name = os.getenv('S3_BUCKET_NAME')
            
            # Verify credentials are loaded
            if not all([self.aws_access_key, self.aws_secret_key, self.region, self.bucket_name]):
                raise ValueError("Missing AWS credentials in .env file")
            
            # Create S3 client
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key,
                region_name=self.region
            )
            
            print(f"✅ AWS S3 client initialized successfully")
            print(f"   Bucket: {self.bucket_name}")
            print(f"   Region: {self.region}")
            
        except Exception as e:
            print(f"❌ Failed to initialize AWS S3 client: {str(e)}")
            raise
    
    def upload_file(self, file_data: bytes, filename: str, metadata: dict = None) -> dict:
        """
        Upload encrypted file to S3
        
        Args:
            file_data: The encrypted file content as bytes
            filename: Name to save the file as
            metadata: Optional metadata (like salt, original filename, etc.)
        
        Returns:
            dict: Upload status and file info
        """
        try:
            # Generate a unique key for S3 (adds timestamp to avoid duplicates)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            s3_key = f"encrypted/{timestamp}_{filename}"
            
            # Prepare metadata for S3
            s3_metadata = {}
            if metadata:
                # Convert metadata to strings (S3 only accepts string metadata)
                for key, value in metadata.items():
                    if isinstance(value, bytes):
                        # Convert bytes to base64 string for storage
                        import base64
                        s3_metadata[key] = base64.b64encode(value).decode('utf-8')
                    else:
                        s3_metadata[key] = str(value)
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_data,
                Metadata=s3_metadata
            )
            
            return {
                'success': True,
                'message': 'File uploaded successfully',
                's3_key': s3_key,
                'bucket': self.bucket_name,
                'size': len(file_data)
            }
        
        except NoCredentialsError:
            return {
                'success': False,
                'message': 'AWS credentials not found or invalid'
            }
        
        except ClientError as e:
            return {
                'success': False,
                'message': f'AWS S3 error: {str(e)}'
            }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Upload failed: {str(e)}'
            }
    
    def download_file(self, s3_key: str) -> dict:
        """
        Download encrypted file from S3
        
        Args:
            s3_key: The S3 key (path) of the file to download
        
        Returns:
            dict: File data and metadata
        """
        try:
            # Download from S3
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            # Read file data
            file_data = response['Body'].read()
            
            # Get metadata
            metadata = response.get('Metadata', {})
            
            # Convert base64 strings back to bytes if needed
            import base64
            processed_metadata = {}
            for key, value in metadata.items():
                if key == 'salt':  # We know salt should be bytes
                    processed_metadata[key] = base64.b64decode(value)
                else:
                    processed_metadata[key] = value
            
            return {
                'success': True,
                'message': 'File downloaded successfully',
                'file_data': file_data,
                'metadata': processed_metadata,
                'size': len(file_data)
            }
        
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                return {
                    'success': False,
                    'message': 'File not found in S3'
                }
            else:
                return {
                    'success': False,
                    'message': f'AWS S3 error: {str(e)}'
                }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Download failed: {str(e)}'
            }
    
    def list_files(self) -> dict:
        """
        List all files in the S3 bucket
        
        Returns:
            dict: List of files with their info
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix='encrypted/'
            )
            
            if 'Contents' not in response:
                return {
                    'success': True,
                    'message': 'No files found',
                    'files': []
                }
            
            files = []
            for obj in response['Contents']:
                files.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'].strftime('%Y-%m-%d %H:%M:%S'),
                    'filename': obj['Key'].split('/')[-1]  # Get just the filename
                })
            
            return {
                'success': True,
                'message': f'Found {len(files)} files',
                'files': files
            }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to list files: {str(e)}'
            }
    
    def delete_file(self, s3_key: str) -> dict:
        """
        Delete a file from S3
        
        Args:
            s3_key: The S3 key of the file to delete
        
        Returns:
            dict: Deletion status
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            return {
                'success': True,
                'message': 'File deleted successfully'
            }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Delete failed: {str(e)}'
            }


# Test function
if __name__ == "__main__":
    print("☁️  Testing AWS S3 Handler...\n")
    
    try:
        # Initialize handler
        aws = AWSHandler()
        
        # Test 1: Upload a test file
        print("\n📤 Test 1: Uploading test file...")
        test_data = b"This is encrypted test data from CloudSentinel!"
        test_metadata = {
            'salt': b'test_salt_123456',
            'original_filename': 'test.txt'
        }
        
        upload_result = aws.upload_file(test_data, 'test_file.enc', test_metadata)
        
        if upload_result['success']:
            print("✅ Upload successful!")
            print(f"   S3 Key: {upload_result['s3_key']}")
            print(f"   Size: {upload_result['size']} bytes")
            s3_key = upload_result['s3_key']
        else:
            print(f"❌ Upload failed: {upload_result['message']}")
            exit(1)
        
        # Test 2: List files
        print("\n📋 Test 2: Listing all files...")
        list_result = aws.list_files()
        
        if list_result['success']:
            print(f"✅ {list_result['message']}")
            for file in list_result['files']:
                print(f"   - {file['filename']} ({file['size']} bytes)")
        else:
            print(f"❌ List failed: {list_result['message']}")
        
        # Test 3: Download the file
        print("\n📥 Test 3: Downloading test file...")
        download_result = aws.download_file(s3_key)
        
        if download_result['success']:
            print("✅ Download successful!")
            print(f"   Size: {download_result['size']} bytes")
            print(f"   Data matches: {download_result['file_data'] == test_data}")
            print(f"   Metadata: {download_result['metadata']}")
        else:
            print(f"❌ Download failed: {download_result['message']}")
        
        # Test 4: Delete the test file
        print("\n🗑️  Test 4: Deleting test file...")
        delete_result = aws.delete_file(s3_key)
        
        if delete_result['success']:
            print("✅ Delete successful!")
        else:
            print(f"❌ Delete failed: {delete_result['message']}")
        
        print("\n✅ All AWS S3 tests completed!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")