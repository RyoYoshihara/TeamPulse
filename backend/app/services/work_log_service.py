from datetime import date
from uuid import UUID

from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.work_log import WorkLog
from app.models.task import Task
from app.schemas.work_log import WorkLogCreate, WorkLogUpdate


def get_work_logs(
    db: Session,
    organization_id: UUID,
    task_id: UUID | None = None,
    member_id: UUID | None = None,
    project_id: UUID | None = None,
    work_date_from: date | None = None,
    work_date_to: date | None = None,
) -> list[WorkLog]:
    query = db.query(WorkLog).filter(WorkLog.organization_id == organization_id)

    if task_id:
        query = query.filter(WorkLog.task_id == task_id)
    if member_id:
        query = query.filter(WorkLog.member_id == member_id)
    if project_id:
        task_ids = [
            t.id for t in db.query(Task.id).filter(
                Task.organization_id == organization_id,
                Task.project_id == project_id,
            ).all()
        ]
        query = query.filter(WorkLog.task_id.in_(task_ids))
    if work_date_from:
        query = query.filter(WorkLog.work_date >= work_date_from)
    if work_date_to:
        query = query.filter(WorkLog.work_date <= work_date_to)

    return query.order_by(WorkLog.work_date.desc(), WorkLog.created_at.desc()).all()


def get_work_log(db: Session, organization_id: UUID, work_log_id: UUID) -> WorkLog:
    wl = (
        db.query(WorkLog)
        .filter(WorkLog.id == work_log_id, WorkLog.organization_id == organization_id)
        .first()
    )
    if not wl:
        raise AppException(code="NOT_FOUND", message="工数ログが見つかりません", status_code=404)
    return wl


def create_work_log(db: Session, organization_id: UUID, data: WorkLogCreate) -> WorkLog:
    wl = WorkLog(
        organization_id=organization_id,
        task_id=UUID(data.task_id),
        member_id=UUID(data.member_id),
        work_date=data.work_date,
        worked_hours=data.worked_hours,
        memo=data.memo,
    )
    db.add(wl)
    db.commit()
    db.refresh(wl)
    _sync_actual_hours(db, wl.task_id)
    return wl


def update_work_log(
    db: Session, organization_id: UUID, work_log_id: UUID, data: WorkLogUpdate
) -> WorkLog:
    wl = get_work_log(db, organization_id, work_log_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(wl, key, value)
    db.commit()
    db.refresh(wl)
    _sync_actual_hours(db, wl.task_id)
    return wl


def delete_work_log(db: Session, organization_id: UUID, work_log_id: UUID) -> None:
    wl = get_work_log(db, organization_id, work_log_id)
    task_id = wl.task_id
    db.delete(wl)
    db.commit()
    _sync_actual_hours(db, task_id)


def _sync_actual_hours(db: Session, task_id: UUID) -> None:
    """Sync task.actual_hours from sum of work_logs."""
    total = (
        db.query(sqlfunc.sum(WorkLog.worked_hours))
        .filter(WorkLog.task_id == task_id)
        .scalar()
    )
    task = db.query(Task).filter(Task.id == task_id).first()
    if task:
        task.actual_hours = total or 0
        db.commit()
