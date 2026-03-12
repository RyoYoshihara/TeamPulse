from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.member import Member
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentListResponse,
    AllocationSummary,
)
from app.services import assignment_service

router = APIRouter(prefix="/project-assignments", tags=["assignments"])


def _to_response(assignment, db: Session) -> AssignmentResponse:
    project = db.query(Project).filter(Project.id == assignment.project_id).first()
    member = db.query(Member).filter(Member.id == assignment.member_id).first()
    return AssignmentResponse(
        id=str(assignment.id),
        organization_id=str(assignment.organization_id),
        project_id=str(assignment.project_id),
        member_id=str(assignment.member_id),
        allocation_rate=assignment.allocation_rate,
        start_date=assignment.start_date,
        end_date=assignment.end_date,
        role=assignment.role,
        is_primary=assignment.is_primary,
        project_name=project.name if project else None,
        member_name=member.name if member else None,
    )


@router.get("", response_model=AssignmentListResponse)
def list_assignments(
    project_id: UUID | None = None,
    member_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = assignment_service.get_assignments(
        db, current_user.organization_id, project_id, member_id
    )
    return AssignmentListResponse(
        items=[_to_response(a, db) for a in items],
        total=len(items),
    )


@router.post("", response_model=AssignmentResponse, status_code=201)
def create_assignment(
    body: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = assignment_service.create_assignment(
        db, current_user.organization_id, body
    )
    return _to_response(assignment, db)


@router.patch("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: UUID,
    body: AssignmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = assignment_service.update_assignment(
        db, current_user.organization_id, assignment_id, body
    )
    return _to_response(assignment, db)


@router.delete("/{assignment_id}", status_code=204)
def delete_assignment(
    assignment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment_service.delete_assignment(
        db, current_user.organization_id, assignment_id
    )
