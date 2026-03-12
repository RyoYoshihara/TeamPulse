from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.schemas.member import (
    MemberCreate,
    MemberUpdate,
    MemberResponse,
    MemberListResponse,
)
from app.services import member_service

router = APIRouter(prefix="/members", tags=["members"])


def _to_response(member) -> MemberResponse:
    return MemberResponse(
        id=str(member.id),
        organization_id=str(member.organization_id),
        employee_code=member.employee_code,
        name=member.name,
        department=member.department,
        position=member.position,
        monthly_capacity_hours=member.monthly_capacity_hours,
        employment_type=member.employment_type,
        is_active=member.is_active,
        joined_at=member.joined_at,
    )


@router.get("", response_model=MemberListResponse)
def list_members(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    department: str | None = None,
    is_active: bool | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = member_service.get_members(
        db, current_user.organization_id, page, limit, keyword, department, is_active
    )
    return MemberListResponse(
        items=[_to_response(m) for m in items],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("", response_model=MemberResponse, status_code=201)
def create_member(
    body: MemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = member_service.create_member(db, current_user.organization_id, body)
    return _to_response(member)


@router.get("/{member_id}", response_model=MemberResponse)
def get_member(
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = member_service.get_member(db, current_user.organization_id, member_id)
    return _to_response(member)


@router.patch("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: UUID,
    body: MemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = member_service.update_member(
        db, current_user.organization_id, member_id, body
    )
    return _to_response(member)


@router.delete("/{member_id}", status_code=204)
def delete_member(
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member_service.delete_member(db, current_user.organization_id, member_id)
