from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.security import hash_password
from app.models.member import Member
from app.models.user import User
from app.schemas.member import MemberCreate, MemberUpdate


def get_members(
    db: Session,
    organization_id: UUID,
    page: int = 1,
    limit: int = 20,
    keyword: str | None = None,
    department: str | None = None,
    is_active: bool | None = None,
) -> tuple[list[Member], int]:
    query = db.query(Member).filter(Member.organization_id == organization_id)

    if keyword:
        query = query.filter(Member.name.ilike(f"%{keyword}%"))
    if department:
        query = query.filter(Member.department == department)
    if is_active is not None:
        query = query.filter(Member.is_active == is_active)

    total = query.count()
    items = query.order_by(Member.name).offset((page - 1) * limit).limit(limit).all()
    return items, total


def get_member(db: Session, organization_id: UUID, member_id: UUID) -> Member:
    member = (
        db.query(Member)
        .filter(Member.id == member_id, Member.organization_id == organization_id)
        .first()
    )
    if not member:
        raise AppException(
            code="NOT_FOUND", message="メンバーが見つかりません", status_code=404
        )
    return member


def get_user_by_member(db: Session, member_id: UUID) -> User | None:
    return db.query(User).filter(User.member_id == member_id).first()


def create_member(
    db: Session, organization_id: UUID, data: MemberCreate
) -> Member:
    member = Member(
        organization_id=organization_id,
        employee_code=data.employee_code,
        name=data.name,
        department=data.department,
        position=data.position,
        monthly_capacity_hours=data.monthly_capacity_hours,
        employment_type=data.employment_type,
        joined_at=data.joined_at,
    )
    db.add(member)
    db.flush()

    if data.account:
        existing = db.query(User).filter(User.email == data.account.email).first()
        if existing:
            raise AppException(
                code="DUPLICATE_EMAIL",
                message="このメールアドレスは既に使用されています",
                status_code=409,
            )
        user = User(
            organization_id=organization_id,
            member_id=member.id,
            name=data.name,
            email=data.account.email,
            password_hash=hash_password(data.account.password),
            role=data.account.role,
        )
        db.add(user)

    db.commit()
    db.refresh(member)
    return member


def update_member(
    db: Session, organization_id: UUID, member_id: UUID, data: MemberUpdate
) -> Member:
    member = get_member(db, organization_id, member_id)
    update_data = data.model_dump(exclude_unset=True)

    # Handle account separately
    account_data = update_data.pop("account", None)

    for key, value in update_data.items():
        setattr(member, key, value)

    if account_data is not None:
        user = get_user_by_member(db, member_id)
        if user:
            if "email" in account_data and account_data["email"] is not None:
                existing = db.query(User).filter(
                    User.email == account_data["email"], User.id != user.id
                ).first()
                if existing:
                    raise AppException(
                        code="DUPLICATE_EMAIL",
                        message="このメールアドレスは既に使用されています",
                        status_code=409,
                    )
                user.email = account_data["email"]
            if "password" in account_data and account_data["password"] is not None:
                user.password_hash = hash_password(account_data["password"])
            if "role" in account_data and account_data["role"] is not None:
                user.role = account_data["role"]
        else:
            # Create new account for existing member
            email = account_data.get("email")
            password = account_data.get("password")
            if email and password:
                existing = db.query(User).filter(User.email == email).first()
                if existing:
                    raise AppException(
                        code="DUPLICATE_EMAIL",
                        message="このメールアドレスは既に使用されています",
                        status_code=409,
                    )
                user = User(
                    organization_id=organization_id,
                    member_id=member_id,
                    name=member.name,
                    email=email,
                    password_hash=hash_password(password),
                    role=account_data.get("role", "member"),
                )
                db.add(user)

    db.commit()
    db.refresh(member)
    return member


def delete_member(db: Session, organization_id: UUID, member_id: UUID) -> None:
    member = get_member(db, organization_id, member_id)
    # Delete associated user account if exists
    user = get_user_by_member(db, member_id)
    if user:
        db.delete(user)
        db.flush()
    db.delete(member)
    db.commit()
