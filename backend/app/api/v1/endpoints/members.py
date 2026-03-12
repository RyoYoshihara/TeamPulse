from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.schemas.member import (
    AccountInfo,
    MemberCreate,
    MemberUpdate,
    MemberResponse,
    MemberListResponse,
)
from app.services import member_service, assignment_service
from app.schemas.assignment import AllocationSummary, AssignmentResponse
from app.models.project import Project

router = APIRouter(prefix="/members", tags=["members"])


def _to_response(member, db: Session) -> MemberResponse:
    user = member_service.get_user_by_member(db, member.id)
    account = AccountInfo(email=user.email, role=user.role) if user else None
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
        account=account,
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
        items=[_to_response(m, db) for m in items],
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
    return _to_response(member, db)


@router.get("/{member_id}", response_model=MemberResponse)
def get_member(
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = member_service.get_member(db, current_user.organization_id, member_id)
    return _to_response(member, db)


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
    return _to_response(member, db)


@router.delete("/{member_id}", status_code=204)
def delete_member(
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member_service.delete_member(db, current_user.organization_id, member_id)


@router.get("/{member_id}/allocation-summary", response_model=AllocationSummary)
def get_allocation_summary(
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_rate, assignments = assignment_service.get_member_allocation_summary(
        db, current_user.organization_id, member_id
    )
    items = []
    for a in assignments:
        project = db.query(Project).filter(Project.id == a.project_id).first()
        items.append(AssignmentResponse(
            id=str(a.id),
            organization_id=str(a.organization_id),
            project_id=str(a.project_id),
            member_id=str(a.member_id),
            allocation_rate=a.allocation_rate,
            start_date=a.start_date,
            end_date=a.end_date,
            role=a.role,
            is_primary=a.is_primary,
            project_name=project.name if project else None,
        ))
    return AllocationSummary(
        member_id=str(member_id),
        current_allocation_rate=total_rate,
        assignments=items,
    )
