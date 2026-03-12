from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


def _to_response(project, assignment_count: int = 0) -> ProjectResponse:
    return ProjectResponse(
        id=str(project.id),
        organization_id=str(project.organization_id),
        project_code=project.project_code,
        name=project.name,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
        status=project.status,
        progress_rate=project.progress_rate,
        assignment_count=assignment_count,
    )


@router.get("", response_model=ProjectListResponse)
def list_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    status: str | None = None,
    start_date_from: date | None = None,
    start_date_to: date | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = project_service.get_projects(
        db, current_user.organization_id, page, limit, keyword, status, start_date_from, start_date_to
    )
    return ProjectListResponse(
        items=[
            _to_response(p, project_service.get_assignment_count(db, p.id))
            for p in items
        ],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = project_service.create_project(db, current_user.organization_id, body)
    return _to_response(project)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = project_service.get_project(db, current_user.organization_id, project_id)
    count = project_service.get_assignment_count(db, project.id)
    return _to_response(project, count)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = project_service.update_project(
        db, current_user.organization_id, project_id, body
    )
    count = project_service.get_assignment_count(db, project.id)
    return _to_response(project, count)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project_service.delete_project(db, current_user.organization_id, project_id)
