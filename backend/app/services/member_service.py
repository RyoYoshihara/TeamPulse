from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.member import Member
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
    db.commit()
    db.refresh(member)
    return member


def update_member(
    db: Session, organization_id: UUID, member_id: UUID, data: MemberUpdate
) -> Member:
    member = get_member(db, organization_id, member_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(member, key, value)
    db.commit()
    db.refresh(member)
    return member


def delete_member(db: Session, organization_id: UUID, member_id: UUID) -> None:
    member = get_member(db, organization_id, member_id)
    db.delete(member)
    db.commit()
