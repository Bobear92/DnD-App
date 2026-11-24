from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.orm import Session
from typing import List
from auth.schemas import UserRegister, UserLogin, UserResponse, TokenResponse, UserSearchResult
from auth.service import register_user, login_user
from auth import rate_limit
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
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Login and get access token. Too many failures for one email from one IP → 429 (auth/rate_limit.py)."""
    ip = request.client.host if request.client else None
    wait = rate_limit.retry_after(ip, login_data.email)
    if wait:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Try again later.",
            headers={"Retry-After": str(wait)},
        )
    try:
        result = login_user(login_data, db)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            rate_limit.record_failure(ip, login_data.email)
        raise
    rate_limit.record_success(ip, login_data.email)
    return result

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user

@router.get("/users/search", response_model=List[UserSearchResult])
def search_users(
    q: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search users by username (GM invite flow). Never matches or returns emails."""
    return (
        db.query(User)
        .filter(
            User.username.ilike(f"%{q}%"),
            User.id != current_user.id,
        )
        .limit(10)
        .all()
    )