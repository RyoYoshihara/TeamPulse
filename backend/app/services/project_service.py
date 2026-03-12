from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.project import Project
from app.models.project_assignment import ProjectAssignment
from app.schemas.project import ProjectCreate, ProjectUpdate


def get_projects(
    db: Session,
    organization_id: UUID,
    page: int = 1,
    limit: int = 20,
    keyword: str | None = None,
    status: str | None = None,
    start_date_from: date | None = None,
    start_date_to: date | None = None,
) -> tuple[list[Project], int]:
    query = db.query(Project).filter(Project.organization_id == organization_id)

    if keyword:
        query = query.filter(Project.name.ilike(f"%{keyword}%"))
    if status:
        query = query.filter(Project.status == status)
    if start_date_from:
        query = query.filter(Project.start_date >= start_date_from)
    if start_date_to:
        query = query.filter(Project.start_date <= start_date_to)

    total = query.count()
    items = query.order_by(Project.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return items, total


def get_project(db: Session, organization_id: UUID, project_id: UUID) -> Project:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == organization_id)
        .first()
    )
    if not project:
        raise AppException(
            code="NOT_FOUND", message="プロジェクトが見つかりません", status_code=404
        )
    return project


def get_assignment_count(db: Session, project_id: UUID) -> int:
    return db.query(ProjectAssignment).filter(
        ProjectAssignment.project_id == project_id
    ).count()


def create_project(
    db: Session, organization_id: UUID, data: ProjectCreate
) -> Project:
    project = Project(
        organization_id=organization_id,
        project_code=data.project_code,
        name=data.name,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
        status=data.status,
        progress_rate=data.progress_rate,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(
    db: Session, organization_id: UUID, project_id: UUID, data: ProjectUpdate
) -> Project:
    project = get_project(db, organization_id, project_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, organization_id: UUID, project_id: UUID) -> None:
    project = get_project(db, organization_id, project_id)
    db.delete(project)
    db.commit()
