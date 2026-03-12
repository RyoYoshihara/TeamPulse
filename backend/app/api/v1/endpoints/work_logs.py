from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.member import Member
from app.models.project import Project
from app.schemas.work_log import (
    WorkLogCreate,
    WorkLogUpdate,
    WorkLogResponse,
    WorkLogListResponse,
)
from app.services import work_log_service

router = APIRouter(prefix="/work-logs", tags=["work-logs"])


def _to_response(wl, db: Session) -> WorkLogResponse:
    task = db.query(Task).filter(Task.id == wl.task_id).first()
    member = db.query(Member).filter(Member.id == wl.member_id).first()
    project = None
    if task:
        project = db.query(Project).filter(Project.id == task.project_id).first()
    return WorkLogResponse(
        id=str(wl.id),
        organization_id=str(wl.organization_id),
        task_id=str(wl.task_id),
        member_id=str(wl.member_id),
        work_date=wl.work_date,
        worked_hours=float(wl.worked_hours),
        memo=wl.memo,
        task_title=task.title if task else None,
        member_name=member.name if member else None,
        project_name=project.name if project else None,
    )


@router.get("", response_model=WorkLogListResponse)
def list_work_logs(
    task_id: UUID | None = None,
    member_id: UUID | None = None,
    project_id: UUID | None = None,
    work_date_from: date | None = None,
    work_date_to: date | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = work_log_service.get_work_logs(
        db, current_user.organization_id,
        task_id, member_id, project_id, work_date_from, work_date_to,
    )
    return WorkLogListResponse(
        items=[_to_response(wl, db) for wl in items],
        total=len(items),
    )


@router.post("", response_model=WorkLogResponse, status_code=201)
def create_work_log(
    body: WorkLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wl = work_log_service.create_work_log(db, current_user.organization_id, body)
    return _to_response(wl, db)


@router.patch("/{work_log_id}", response_model=WorkLogResponse)
def update_work_log(
    work_log_id: UUID,
    body: WorkLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wl = work_log_service.update_work_log(
        db, current_user.organization_id, work_log_id, body
    )
    return _to_response(wl, db)


@router.delete("/{work_log_id}", status_code=204)
def delete_work_log(
    work_log_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    work_log_service.delete_work_log(db, current_user.organization_id, work_log_id)
