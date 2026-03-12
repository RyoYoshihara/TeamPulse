from datetime import date
from pydantic import BaseModel, EmailStr


class AccountCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "member"


class AccountUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = None
    role: str | None = None


class AccountInfo(BaseModel):
    email: str
    role: str


class MemberCreate(BaseModel):
    employee_code: str | None = None
    name: str
    department: str | None = None
    position: str | None = None
    monthly_capacity_hours: int | None = None
    employment_type: str | None = None
    joined_at: date | None = None
    account: AccountCreate | None = None


class MemberUpdate(BaseModel):
    employee_code: str | None = None
    name: str | None = None
    department: str | None = None
    position: str | None = None
    monthly_capacity_hours: int | None = None
    employment_type: str | None = None
    is_active: bool | None = None
    joined_at: date | None = None
    account: AccountUpdate | None = None


class MemberResponse(BaseModel):
    id: str
    organization_id: str
    employee_code: str | None = None
    name: str
    department: str | None = None
    position: str | None = None
    monthly_capacity_hours: int | None = None
    employment_type: str | None = None
    is_active: bool
    joined_at: date | None = None
    account: AccountInfo | None = None

    class Config:
        from_attributes = True


class MemberListResponse(BaseModel):
    items: list[MemberResponse]
    total: int
    page: int
    limit: int
