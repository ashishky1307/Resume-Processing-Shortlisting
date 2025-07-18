import os
import httpx
import logging
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer
from typing import Optional, Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

# Auth backend configuration
AUTH_BACKEND_URL = os.getenv('AUTH_BACKEND_URL', 'http://localhost:4000')

class AuthManager:
    """
    Manages authentication verification with the auth backend
    """
    
    @staticmethod
    async def verify_user_session(request: Request) -> Optional[Dict[str, Any]]:
        """
        Verify user session by calling the auth backend
        Returns user data if authenticated, None if not
        """
        try:
            # Debug: Log all cookies
            logger.info(f"All cookies received: {request.cookies}")
            
            # Extract session cookie from the request
            session_cookie = request.cookies.get('resume_session_cookie_name')
            
            logger.info(f"Session cookie found: {session_cookie is not None}")
            
            if not session_cookie:
                logger.warning("No session cookie found in request")
                return None
            
            # Call auth backend to verify session
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{AUTH_BACKEND_URL}/auth/status",
                    cookies={'resume_session_cookie_name': session_cookie},
                    timeout=5.0
                )
                
                logger.info(f"Auth backend response status: {response.status_code}")
                logger.info(f"Auth backend response: {response.text}")
                
                if response.status_code == 200:
                    auth_data = response.json()
                    if auth_data.get('authenticated', False):
                        logger.info(f"User authenticated: {auth_data.get('user', {}).get('email', 'Unknown')}")
                        return auth_data.get('user')
                
                logger.warning("User not authenticated or invalid session")
                return None
                
        except Exception as e:
            logger.error(f"Error verifying user session: {str(e)}")
            return None

# Dependency functions for FastAPI
async def get_current_user(request: Request) -> Dict[str, Any]:
    """
    FastAPI dependency to get current authenticated user
    Raises HTTPException if user is not authenticated
    """
    user = await AuthManager.verify_user_session(request)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please log in."
        )
    return user

async def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency to get current authenticated user (optional)
    Returns None if user is not authenticated (doesn't raise exception)
    """
    return await AuthManager.verify_user_session(request)
