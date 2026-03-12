import uuid

from sqlalchemy import Column, String, Boolean, Integer, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Member(Base):
    __tablename__ = "members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    employee_code = Column(String(100), nullable=True)
    name = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    position = Column(String(255), nullable=True)
    monthly_capacity_hours = Column(Integer, nullable=True)
    employment_type = Column(String(50), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    joined_at = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
