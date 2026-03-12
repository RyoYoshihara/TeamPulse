from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import LoginRequest, LoginResponse, MeResponse, UserResponse
from app.services.auth_service import authenticate_user, create_token_for_user
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    token = create_token_for_user(user)
    return LoginResponse(
        access_token=token,
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            role=user.role,
            organization_id=str(user.organization_id),
        ),
    )


@router.post("/logout")
def logout():
    return {"success": True, "message": "ログアウトしました"}


@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return MeResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        organization_id=str(current_user.organization_id),
        member_id=str(current_user.member_id) if current_user.member_id else None,
    )
