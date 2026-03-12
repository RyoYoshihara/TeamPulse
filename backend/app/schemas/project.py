from datetime import date
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    project_code: str | None = None
    name: str
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str = "planning"
    progress_rate: int | None = 0


class ProjectUpdate(BaseModel):
    project_code: str | None = None
    name: str | None = None
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None
    progress_rate: int | None = None


class ProjectResponse(BaseModel):
    id: str
    organization_id: str
    project_code: str | None = None
    name: str
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str
    progress_rate: int | None = None
    assignment_count: int = 0

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    limit: int
