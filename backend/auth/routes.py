from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status, Query
from sqlalchemy.orm import Session
from typing import List
from auth.schemas import (
    UserRegister, UserLogin, UserResponse, TokenResponse, UserSearchResult,
    ForgotPasswordRequest, ResetPasswordRequest, MessageResponse,
)
from auth.service import register_user, login_user, create_password_reset, reset_password
from auth import emails
from auth import rate_limit
from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, background: BackgroundTasks, db: Session = Depends(get_db)):
    """Register a new user. Sends a welcome email and tells the admin (after the response; a failed email never fails
    registration)."""
    user = register_user(user_data, db)
    background.add_task(emails.send_welcome, user.email, user.username)
    background.add_task(emails.send_new_account_notice, user.username)
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
    q: str = Query(..., min_length=1),  # from the first letter (T3: browsable); still capped at 10 usernames
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


# ── Password reset (post-deploy T4) ───────────────────────────────────────────

FORGOT_PASSWORD_REPLY = "If an account uses that email, we've sent a link to reset its password."


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(data: ForgotPasswordRequest, request: Request, background: BackgroundTasks,
                    db: Session = Depends(get_db)):
    """Email a one-time reset link. The reply is the same whether or not the account exists (no enumeration), and the
    email goes out after the response so its timing gives nothing away. Throttled: 5 per email per IP an hour."""
    ip = request.client.host if request.client else None
    wait = rate_limit.FORGOT_PASSWORD.retry_after(ip, data.email)
    if wait:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many reset requests. Try again later.",
            headers={"Retry-After": str(wait)},
        )
    rate_limit.FORGOT_PASSWORD.record(ip, data.email)
    found = create_password_reset(db, data.email)
    if found:
        user, raw_token = found
        background.add_task(emails.send_password_reset, user.email, user.username, raw_token)
    return {"message": FORGOT_PASSWORD_REPLY}


@router.post("/reset-password", response_model=MessageResponse)
def reset_password_endpoint(data: ResetPasswordRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    """Set a new password with a reset token. Signs out every existing session; 400 if the link is bad or used."""
    user = reset_password(db, data.token, data.new_password)
    background.add_task(emails.send_password_changed, user.email, user.username)
    return {"message": "Your password has been changed. Log in with your new password."}
