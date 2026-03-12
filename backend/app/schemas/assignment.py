from datetime import date
from pydantic import BaseModel, Field


class AssignmentCreate(BaseModel):
    project_id: str
    member_id: str
    allocation_rate: int = Field(ge=0, le=100)
    start_date: date | None = None
    end_date: date | None = None
    role: str | None = None
    is_primary: bool = False


class AssignmentUpdate(BaseModel):
    allocation_rate: int | None = Field(None, ge=0, le=100)
    start_date: date | None = None
    end_date: date | None = None
    role: str | None = None
    is_primary: bool | None = None


class AssignmentResponse(BaseModel):
    id: str
    organization_id: str
    project_id: str
    member_id: str
    allocation_rate: int
    start_date: date | None = None
    end_date: date | None = None
    role: str | None = None
    is_primary: bool
    project_name: str | None = None
    member_name: str | None = None

    class Config:
        from_attributes = True


class AssignmentListResponse(BaseModel):
    items: list[AssignmentResponse]
    total: int


class AllocationSummary(BaseModel):
    member_id: str
    current_allocation_rate: int
    assignments: list[AssignmentResponse]
