from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import hashlib
import secrets
from datetime import datetime, timezone

from sqlalchemy import func

from auth.models import User, PasswordResetToken
from auth.schemas import UserRegister, UserLogin
from shared.security import hash_password, verify_password, create_access_token
from datetime import timedelta
from config import settings

def register_user(user_data: UserRegister, db: Session) -> User:
    """Register a new user"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        is_admin=False  # Regular users are not admins by default
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

def login_user(login_data: UserLogin, db: Session) -> dict:
    """Authenticate a user and return access token"""
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
    data={"sub": str(user.id)},  # Convert to string
    expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


# ── Password reset (post-deploy T4) ───────────────────────────────────────────

INVALID_RESET_LINK = "This reset link is invalid or has expired. Request a new one."


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def create_password_reset(db: Session, email: str) -> tuple[User, str] | None:
    """A fresh one-time token for the account with this email, or None if there is no such account.

    The caller must answer the same way either way (no account enumeration). Any older unused link for the user is
    revoked, so only the newest email works. Returns the RAW token for the link; only its hash is stored.
    """
    user = db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()
    if user is None:
        return None
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)
    ).delete(synchronize_session=False)
    raw = secrets.token_urlsafe(32)
    db.add(PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_token(raw),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_minutes),
    ))
    db.commit()
    return user, raw


def reset_password(db: Session, raw_token: str, new_password: str) -> User:
    """Spend a reset token: set the new password and sign out every existing session. 400 if invalid/used/expired."""
    row = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == _hash_token(raw_token)).first()
    now = datetime.now(timezone.utc)
    if row is None or row.used_at is not None or row.expires_at <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INVALID_RESET_LINK)
    user = db.query(User).filter(User.id == row.user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INVALID_RESET_LINK)
    user.password_hash = hash_password(new_password)
    user.password_changed_at = now
    row.used_at = now
    # Every other outstanding link for this user dies with this one.
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id, PasswordResetToken.id != row.id
    ).delete(synchronize_session=False)
    db.commit()
    db.refresh(user)
    return user
