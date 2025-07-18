import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Get AWS credentials from environment variables
AWS_ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.environ.get("AWS_SECRET_KEY")
AWS_BUCKET_NAME = os.environ.get("AWS_BUCKET_NAME")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")




# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize S3 client
try:
    s3_client = boto3.client(
        's3',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY
    )
except Exception as e:
    logger.error(f"Error initializing S3 client: {str(e)}")
    s3_client = None

def upload_file_to_s3(file_path, object_name=None):
    """
    Upload a file to an S3 bucket
    
    Parameters:
    file_path (str): Local file path to upload
    object_name (str): S3 object name. If not specified, file_name is used
    
    Returns:
    (bool, str): Tuple of success status and S3 URL or error message
    """
    if s3_client is None:
        return False, "S3 client not initialized. Check AWS credentials."
    
    # If S3 object name is not specified, use file name
    if object_name is None:
        object_name = os.path.basename(file_path)
    
    # Determine content type based on file extension
    content_type = 'application/octet-stream'  # default
    file_extension = object_name.lower().split('.')[-1] if '.' in object_name else ''
    
    content_type_map = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'rtf': 'application/rtf'
    }
    
    if file_extension in content_type_map:
        content_type = content_type_map[file_extension]
          # Upload the file with proper content type and disposition
    try:
        extra_args = {
            'ContentType': content_type,
            'ContentDisposition': 'inline',
            'CacheControl': 'max-age=86400',  # Cache for 1 day
        }
        
        # Add specific headers for Office documents to help with viewing
        if file_extension in ['doc', 'docx']:
            extra_args['Metadata'] = {
                'viewer-compatible': 'true',
                'file-type': file_extension
            }
        
        s3_client.upload_file(
            file_path, 
            AWS_BUCKET_NAME, 
            object_name,
            ExtraArgs=extra_args
        )
        s3_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{object_name}"
        return True, s3_url
    except ClientError as e:
        logger.error(f"Error uploading file to S3: {str(e)}")
        return False, str(e)

def download_file_from_s3(object_name, file_path):
    """
    Download a file from an S3 bucket
    
    Parameters:
    object_name (str): S3 object name
    file_path (str): Local file path to download to
    
    Returns:
    bool: True if download was successful, False otherwise
    """
    if s3_client is None:
        return False
    
    try:
        s3_client.download_file(AWS_BUCKET_NAME, object_name, file_path)
        return True
    except ClientError as e:
        logger.error(f"Error downloading file from S3: {str(e)}")
        return False

def generate_presigned_url(object_name, expiration=3600, inline=True):
    """
    Generate a presigned URL for an S3 object
    
    Parameters:
    object_name (str): S3 object name
    expiration (int): Time in seconds for the URL to remain valid
    inline (bool): If True, set Content-Disposition to inline for browser viewing
    
    Returns:
    (bool, str): Tuple of success status and presigned URL or error message
    """
    if s3_client is None:
        return False, "S3 client not initialized. Check AWS credentials."
    
    try:
        params = {
            'Bucket': AWS_BUCKET_NAME,
            'Key': object_name
        }
        
        # Add Content-Disposition header for inline viewing
        if inline:
            params['ResponseContentDisposition'] = 'inline'
        
        url = s3_client.generate_presigned_url(
            'get_object',
            Params=params,
            ExpiresIn=expiration
        )
        return True, url
    except ClientError as e:
        logger.error(f"Error generating presigned URL: {str(e)}")
        return False, str(e)

def delete_file_from_s3(object_name):
    """
    Delete a file from an S3 bucket
    
    Parameters:
    object_name (str): S3 object name
    
    Returns:
    bool: True if deletion was successful, False otherwise
    """
    if s3_client is None:
        return False
    
    try:
        s3_client.delete_object(Bucket=AWS_BUCKET_NAME, Key=object_name)
        return True
    except ClientError as e:
        logger.error(f"Error deleting file from S3: {str(e)}")
        return False
