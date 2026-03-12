from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.project_assignment import ProjectAssignment
from app.models.project import Project
from app.models.member import Member
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate


def get_assignments(
    db: Session,
    organization_id: UUID,
    project_id: UUID | None = None,
    member_id: UUID | None = None,
) -> list[ProjectAssignment]:
    query = db.query(ProjectAssignment).filter(
        ProjectAssignment.organization_id == organization_id
    )
    if project_id:
        query = query.filter(ProjectAssignment.project_id == project_id)
    if member_id:
        query = query.filter(ProjectAssignment.member_id == member_id)
    return query.order_by(ProjectAssignment.created_at.desc()).all()


def get_assignment(
    db: Session, organization_id: UUID, assignment_id: UUID
) -> ProjectAssignment:
    assignment = (
        db.query(ProjectAssignment)
        .filter(
            ProjectAssignment.id == assignment_id,
            ProjectAssignment.organization_id == organization_id,
        )
        .first()
    )
    if not assignment:
        raise AppException(
            code="NOT_FOUND", message="アサインが見つかりません", status_code=404
        )
    return assignment


def create_assignment(
    db: Session, organization_id: UUID, data: AssignmentCreate
) -> ProjectAssignment:
    # Validate project exists
    project = (
        db.query(Project)
        .filter(Project.id == UUID(data.project_id), Project.organization_id == organization_id)
        .first()
    )
    if not project:
        raise AppException(code="NOT_FOUND", message="プロジェクトが見つかりません", status_code=404)

    # Validate member exists
    member = (
        db.query(Member)
        .filter(Member.id == UUID(data.member_id), Member.organization_id == organization_id)
        .first()
    )
    if not member:
        raise AppException(code="NOT_FOUND", message="メンバーが見つかりません", status_code=404)

    assignment = ProjectAssignment(
        organization_id=organization_id,
        project_id=UUID(data.project_id),
        member_id=UUID(data.member_id),
        allocation_rate=data.allocation_rate,
        start_date=data.start_date,
        end_date=data.end_date,
        role=data.role,
        is_primary=data.is_primary,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def update_assignment(
    db: Session, organization_id: UUID, assignment_id: UUID, data: AssignmentUpdate
) -> ProjectAssignment:
    assignment = get_assignment(db, organization_id, assignment_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(assignment, key, value)
    db.commit()
    db.refresh(assignment)
    return assignment


def delete_assignment(
    db: Session, organization_id: UUID, assignment_id: UUID
) -> None:
    assignment = get_assignment(db, organization_id, assignment_id)
    db.delete(assignment)
    db.commit()


def get_member_allocation_summary(
    db: Session, organization_id: UUID, member_id: UUID
) -> tuple[int, list[ProjectAssignment]]:
    """Returns (total_allocation_rate, assignments) for a member's current assignments."""
    today = date.today()
    assignments = (
        db.query(ProjectAssignment)
        .filter(
            ProjectAssignment.organization_id == organization_id,
            ProjectAssignment.member_id == member_id,
        )
        .all()
    )
    # Filter to current assignments (no end_date or end_date >= today)
    current = [
        a for a in assignments
        if a.end_date is None or a.end_date >= today
    ]
    total_rate = sum(a.allocation_rate for a in current)
    return total_rate, current
