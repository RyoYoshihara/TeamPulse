from datetime import date
from pydantic import BaseModel


class DashboardSummary(BaseModel):
    active_projects_count: int
    open_tasks_count: int
    delayed_tasks_count: int
    over_capacity_members_count: int


class MemberUtilization(BaseModel):
    member_id: str
    name: str
    department: str | None = None
    current_allocation_rate: int
    task_count: int


class ProjectProgress(BaseModel):
    project_id: str
    name: str
    status: str
    progress_rate: int | None = None
    assignment_count: int


class DelayedTask(BaseModel):
    task_id: str
    title: str
    assignee_name: str | None = None
    due_date: date | None = None
    priority: str
    project_name: str | None = None
