from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from models import User, TokenData, AuthResponse, LoginRequest, SetPasswordRequest, ResetPasswordRequest

router = APIRouter()
security = HTTPBearer()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 days (30 * 24 * 60)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def validate_password(password: str) -> bool:
    """Validate password meets requirements: 8+ chars, 1 letter, 1 number"""
    if len(password) < 8:
        return False
    
    has_letter = any(c.isalpha() for c in password)
    has_number = any(c.isdigit() for c in password)
    
    return has_letter and has_number

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Dependency to get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(
            user_id=user_id,
            email=payload.get("email"),
            role=payload.get("role")
        )
    except JWTError:
        raise credentials_exception
    
    # TODO: Get user from database using token_data.user_id
    # For now, return a mock user based on token data
    user = User(
        id=token_data.user_id,
        email=token_data.email,
        role=token_data.role
    )
    return user

@router.post("/login", response_model=AuthResponse)
async def login(login_request: LoginRequest):
    """
    Authenticate user with email and password
    """
    # TODO: Get user from database by email
    # TODO: Verify password
    # For now, this is a placeholder implementation
    
    # Validate email domain
    if not login_request.email.lower().endswith('@prizepicks.com'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only @prizepicks.com email addresses are allowed"
        )
    
    # TODO: Replace with actual database lookup
    # user = get_user_by_email(login_request.email)
    # if not user or not user.password:
    #     raise HTTPException(
    #         status_code=status.HTTP_404_NOT_FOUND,
    #         detail="User not found or password not set"
    #     )
    
    # if not verify_password(login_request.password, user.password):
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Incorrect password"
    #     )
    
    # Mock response for now
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": "mock-user-id",
            "email": login_request.email,
            "role": "analyst"
        },
        expires_delta=access_token_expires
    )
    
    user = User(
        id="mock-user-id",
        email=login_request.email,
        role="analyst"
    )
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.post("/set-password")
async def set_password(request: SetPasswordRequest):
    """
    Set password for existing user (migration flow)
    """
    # Validate email domain
    if not request.email.lower().endswith('@prizepicks.com'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only @prizepicks.com email addresses are allowed"
        )
    
    # Validate password
    if not validate_password(request.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one letter and one number"
        )
    
    # TODO: Get user from database
    # TODO: Update user password
    # user = get_user_by_email(request.email)
    # if not user:
    #     raise HTTPException(status_code=404, detail="User not found")
    
    # hashed_password = get_password_hash(request.password)
    # update_user_password(user.id, hashed_password)
    
    return {"message": "Password set successfully"}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, current_user: User = Depends(get_current_user)):
    """
    Admin endpoint to reset user password
    """
    # TODO: Check if current user is admin
    # For now, allow any authenticated user to reset passwords (admin functionality)
    
    # Validate password
    if not validate_password(request.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one letter and one number"
        )
    
    # TODO: Update user password in database
    # hashed_password = get_password_hash(request.new_password)
    # update_user_password(request.user_id, hashed_password)
    
    return {"message": "Password reset successfully"}

@router.post("/validate", response_model=AuthResponse)
async def validate_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate JWT token and return user information
    """
    user = await get_current_user(credentials)
    return AuthResponse(
        access_token=credentials.credentials,
        token_type="bearer",
        user=user
    )

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Refresh JWT token
    """
    user = await get_current_user(credentials)
    
    # Create new token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.id,
            "email": user.email,
            "role": user.role
        },
        expires_delta=access_token_expires
    )
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information
    """
    return current_user
