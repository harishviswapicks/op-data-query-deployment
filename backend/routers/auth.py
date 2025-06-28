from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
import os
import uuid
from models import User, TokenData, AuthResponse, LoginRequest, SetPasswordRequest, ResetPasswordRequest
from database import get_db, get_user_by_email, get_user_by_id, create_user, update_user_password

router = APIRouter()
security = HTTPBearer()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
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

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
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
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        email = payload.get("email")
        role = payload.get("role")
        if email is None or role is None:
            raise credentials_exception
        token_data = TokenData(
            user_id=str(user_id),
            email=str(email),
            role=str(role)
        )
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    db_user = get_user_by_id(db, token_data.user_id)
    if db_user is None:
        raise credentials_exception
    
    # Ensure role is one of the valid types
    user_role = str(db_user.role)
    if user_role not in ["analyst", "general_employee"]:
        user_role = "analyst"  # Default to analyst if invalid role
    
    user = User(
        id=str(db_user.id),
        email=str(db_user.email),
        role=user_role  # type: ignore
    )
    return user

@router.post("/login", response_model=AuthResponse)
async def login(login_request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with email and password
    """
    # Validate email domain
    if not login_request.email.lower().endswith('@prizepicks.com'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only @prizepicks.com email addresses are allowed"
        )
    
    # Get user from database
    db_user = get_user_by_email(db, login_request.email)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please contact your administrator to set up your account."
        )
    
    if db_user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password not set. Please use the set password flow first."
        )
    
    if not verify_password(login_request.password, str(db_user.password_hash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(db_user.id),
            "email": str(db_user.email),
            "role": str(db_user.role)
        },
        expires_delta=access_token_expires
    )
    
    # Ensure role is one of the valid types
    user_role = str(db_user.role)
    if user_role not in ["analyst", "general_employee"]:
        user_role = "analyst"  # Default to analyst if invalid role
    
    user = User(
        id=str(db_user.id),
        email=str(db_user.email),
        role=user_role  # type: ignore
    )
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.post("/set-password")
async def set_password(request: SetPasswordRequest, db: Session = Depends(get_db)):
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
    
    # Get or create user
    db_user = get_user_by_email(db, request.email)
    if not db_user:
        # Create new user if they don't exist
        user_id = str(uuid.uuid4())
        db_user = create_user(db, user_id, request.email, "analyst")
    
    # Hash and set password
    hashed_password = get_password_hash(request.password)
    success = update_user_password(db, str(db_user.id), hashed_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set password"
        )
    
    return {"message": "Password set successfully"}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Admin endpoint to reset user password
    """
    # Check if current user exists (basic auth check)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Validate password
    if not validate_password(request.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one letter and one number"
        )
    
    # Hash and update password
    hashed_password = get_password_hash(request.new_password)
    success = update_user_password(db, request.user_id, hashed_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "Password reset successfully"}

@router.post("/validate", response_model=AuthResponse)
async def validate_token(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """
    Validate JWT token and return user information
    """
    user = await get_current_user(credentials, db)
    return AuthResponse(
        access_token=credentials.credentials,
        token_type="bearer",
        user=user
    )

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """
    Refresh JWT token
    """
    user = await get_current_user(credentials, db)
    
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

@router.get("/profile")
async def get_user_profile(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """
    Get user profile information (for frontend auth check)
    """
    try:
        user = await get_current_user(credentials, db)
        return {"user": user}
    except HTTPException:
        # Return 401 if token is invalid or user doesn't exist
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
