from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.member import Member
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskResponse,
    TaskListResponse,
)
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _to_response(task, db: Session) -> TaskResponse:
    project = db.query(Project).filter(Project.id == task.project_id).first()
    assignee = db.query(Member).filter(Member.id == task.assignee_member_id).first() if task.assignee_member_id else None
    return TaskResponse(
        id=str(task.id),
        organization_id=str(task.organization_id),
        project_id=str(task.project_id),
        assignee_member_id=str(task.assignee_member_id) if task.assignee_member_id else None,
        created_by_user_id=str(task.created_by_user_id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        estimated_hours=float(task.estimated_hours) if task.estimated_hours else None,
        actual_hours=float(task.actual_hours) if task.actual_hours else None,
        project_name=project.name if project else None,
        assignee_name=assignee.name if assignee else None,
    )


@router.get("", response_model=TaskListResponse)
def list_tasks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    project_id: UUID | None = None,
    assignee_member_id: UUID | None = None,
    status: str | None = None,
    priority: str | None = None,
    due_date_from: date | None = None,
    due_date_to: date | None = None,
    keyword: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = task_service.get_tasks(
        db, current_user.organization_id, page, limit,
        project_id, assignee_member_id, status, priority,
        due_date_from, due_date_to, keyword,
    )
    return TaskListResponse(
        items=[_to_response(t, db) for t in items],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(
    body: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = task_service.create_task(
        db, current_user.organization_id, current_user.id, body
    )
    return _to_response(task, db)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = task_service.get_task(db, current_user.organization_id, task_id)
    return _to_response(task, db)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: UUID,
    body: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = task_service.update_task(
        db, current_user.organization_id, task_id, body
    )
    return _to_response(task, db)


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: UUID,
    body: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = task_service.update_task_status(
        db, current_user.organization_id, task_id, body.status
    )
    return _to_response(task, db)


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task_service.delete_task(db, current_user.organization_id, task_id)
