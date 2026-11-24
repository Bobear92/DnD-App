from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

# Request schemas
PASSWORD_MIN_LENGTH = 8  # mirrored by the register form (frontend/src/auth/pages/Login.jsx)


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str = Field(..., min_length=PASSWORD_MIN_LENGTH)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Response schemas
class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserSearchResult(BaseModel):
    # No email: any logged-in user can search, so an email here let a short query harvest every address.
    id: int
    username: str

    class Config:
        from_attributes = True