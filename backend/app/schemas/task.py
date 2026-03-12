from datetime import date
from decimal import Decimal
from pydantic import BaseModel


class TaskCreate(BaseModel):
    project_id: str
    assignee_member_id: str | None = None
    title: str
    description: str | None = None
    status: str = "todo"
    priority: str = "medium"
    due_date: date | None = None
    estimated_hours: Decimal | None = None


class TaskUpdate(BaseModel):
    assignee_member_id: str | None = None
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: date | None = None
    estimated_hours: Decimal | None = None
    actual_hours: Decimal | None = None


class TaskStatusUpdate(BaseModel):
    status: str


class TaskResponse(BaseModel):
    id: str
    organization_id: str
    project_id: str
    assignee_member_id: str | None = None
    created_by_user_id: str
    title: str
    description: str | None = None
    status: str
    priority: str
    due_date: date | None = None
    estimated_hours: float | None = None
    actual_hours: float | None = None
    project_name: str | None = None
    assignee_name: str | None = None

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    limit: int
