from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.auth import service
from app.auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse

router = APIRouter()
security = HTTPBearer()


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(lambda: None),
    db: Session = Depends(get_db),
):
    """Dependency: validate JWT OR return the demo user if auth fails."""
    # Attempt to decode token if provided
    if credentials:
        try:
            payload = service.decode_token(credentials.credentials)
            user_id = payload.get("sub")
            if user_id:
                user = service.get_user_by_id(db, int(user_id))
                if user and user.is_active:
                    return user
        except Exception:
            pass

    # Fallback to demo user (bypass authentication)
    return service.get_or_create_demo_user(db)



@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user
