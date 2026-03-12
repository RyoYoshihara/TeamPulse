from datetime import date
from decimal import Decimal
from pydantic import BaseModel


class WorkLogCreate(BaseModel):
    task_id: str
    member_id: str
    work_date: date
    worked_hours: Decimal
    memo: str | None = None


class WorkLogUpdate(BaseModel):
    work_date: date | None = None
    worked_hours: Decimal | None = None
    memo: str | None = None


class WorkLogResponse(BaseModel):
    id: str
    organization_id: str
    task_id: str
    member_id: str
    work_date: date
    worked_hours: float
    memo: str | None = None
    task_title: str | None = None
    member_name: str | None = None
    project_name: str | None = None

    class Config:
        from_attributes = True


class WorkLogListResponse(BaseModel):
    items: list[WorkLogResponse]
    total: int
