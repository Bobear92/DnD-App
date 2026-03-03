from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.schemas import UserRegister, UserLogin, UserResponse, TokenResponse
from auth.service import register_user, login_user
from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    user = register_user(user_data, db)
    return user

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token"""
    result = login_user(login_data, db)
    return result

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user