from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AppException
from app.db.session import get_db
from app.models.user import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise AppException(
                code="UNAUTHORIZED", message="無効なトークンです", status_code=401
            )
    except JWTError:
        raise AppException(
            code="UNAUTHORIZED", message="トークンの検証に失敗しました", status_code=401
        )

    user = db.query(User).filter(User.id == UUID(user_id)).first()
    if user is None:
        raise AppException(
            code="UNAUTHORIZED", message="ユーザーが見つかりません", status_code=401
        )
    if not user.is_active:
        raise AppException(
            code="FORBIDDEN", message="このアカウントは無効化されています", status_code=403
        )
    return user


def require_role(*roles: str):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise AppException(
                code="FORBIDDEN", message="この操作を行う権限がありません", status_code=403
            )
        return current_user
    return role_checker
