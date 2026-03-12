from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


def get_tasks(
    db: Session,
    organization_id: UUID,
    page: int = 1,
    limit: int = 20,
    project_id: UUID | None = None,
    assignee_member_id: UUID | None = None,
    status: str | None = None,
    priority: str | None = None,
    due_date_from: date | None = None,
    due_date_to: date | None = None,
    keyword: str | None = None,
) -> tuple[list[Task], int]:
    query = db.query(Task).filter(Task.organization_id == organization_id)

    if project_id:
        query = query.filter(Task.project_id == project_id)
    if assignee_member_id:
        query = query.filter(Task.assignee_member_id == assignee_member_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if due_date_from:
        query = query.filter(Task.due_date >= due_date_from)
    if due_date_to:
        query = query.filter(Task.due_date <= due_date_to)
    if keyword:
        query = query.filter(Task.title.ilike(f"%{keyword}%"))

    total = query.count()
    items = query.order_by(Task.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return items, total


def get_task(db: Session, organization_id: UUID, task_id: UUID) -> Task:
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.organization_id == organization_id)
        .first()
    )
    if not task:
        raise AppException(
            code="NOT_FOUND", message="タスクが見つかりません", status_code=404
        )
    return task


def create_task(
    db: Session, organization_id: UUID, created_by_user_id: UUID, data: TaskCreate
) -> Task:
    task = Task(
        organization_id=organization_id,
        project_id=UUID(data.project_id),
        assignee_member_id=UUID(data.assignee_member_id) if data.assignee_member_id else None,
        created_by_user_id=created_by_user_id,
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        due_date=data.due_date,
        estimated_hours=data.estimated_hours,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(
    db: Session, organization_id: UUID, task_id: UUID, data: TaskUpdate
) -> Task:
    task = get_task(db, organization_id, task_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "assignee_member_id" and value:
            value = UUID(value)
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


def update_task_status(
    db: Session, organization_id: UUID, task_id: UUID, status: str
) -> Task:
    task = get_task(db, organization_id, task_id)
    task.status = status
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, organization_id: UUID, task_id: UUID) -> None:
    task = get_task(db, organization_id, task_id)
    db.delete(task)
    db.commit()
