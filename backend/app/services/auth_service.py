from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.security import verify_password, create_access_token
from app.models.user import User


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise AppException(
            code="UNAUTHORIZED",
            message="メールアドレスまたはパスワードが正しくありません",
            status_code=401,
        )
    if not verify_password(password, user.password_hash):
        raise AppException(
            code="UNAUTHORIZED",
            message="メールアドレスまたはパスワードが正しくありません",
            status_code=401,
        )
    if not user.is_active:
        raise AppException(
            code="FORBIDDEN",
            message="このアカウントは無効化されています",
            status_code=403,
        )
    # 最終ログイン日時を更新
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    return user


def create_token_for_user(user: User) -> str:
    return create_access_token(
        data={
            "sub": str(user.id),
            "organization_id": str(user.organization_id),
            "role": user.role,
        }
    )
