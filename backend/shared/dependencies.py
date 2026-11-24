from typing import Optional

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from shared.database import get_db
from shared.security import decode_access_token
from auth.models import User
from config import settings

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user from JWT token"""
    token = credentials.credentials
    
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user_id = int(payload.get("sub"))  # Convert back to int
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require that the current user is an admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def check_content_ownership(owner_type, owner_id, current_user: User, db: Session):
    """Verify current_user has write access to content with given ownership."""
    from shared.enums import OwnerType
    if owner_type == OwnerType.system:
        if not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required for system content"
            )
    else:
        if owner_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="owner_id required for campaign content"
            )
        from gm.campaigns.models import CampaignMember
        member = db.query(CampaignMember).filter(
            CampaignMember.campaign_id == owner_id,
            CampaignMember.user_id == current_user.id,
            CampaignMember.role == 'gm'
        ).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="GM access required for this campaign's content"
            )

def require_campaign_gm(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Require that the current user is the GM of the given campaign"""
    from gm.campaigns.models import CampaignMember
    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == current_user.id,
        CampaignMember.role == 'gm'
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="GM access required for this campaign"
        )
    return current_user

# ── Reading campaign-owned compendium content ─────────────────────────────────
# Campaign homebrew/overrides are visible to that campaign's members only (security review, deploy T10 follow-up).
# The list check is attached once, at include time in main.py (COMPENDIUM_ROUTERS); every get-by-id route wraps its row
# in check_content_read. backend/tests/test_security_leaks.py covers all of them.

def _is_campaign_member(db: Session, campaign_id: int, user_id: int) -> bool:
    from gm.campaigns.models import CampaignMember
    return db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id,
    ).first() is not None


def require_campaign_query_member(
    campaign_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """`?campaign_id=N` merges campaign N's rows into a compendium list — only for N's members."""
    if campaign_id is not None and not _is_campaign_member(db, campaign_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this campaign",
        )


def check_content_read(row, current_user: User, db: Session):
    """Return a compendium row if the user may read it: system rows always, campaign rows for its members only."""
    from shared.enums import OwnerType
    if row.owner_type == OwnerType.campaign and not _is_campaign_member(db, row.owner_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this campaign",
        )
    return row
