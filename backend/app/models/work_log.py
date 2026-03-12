import uuid

from sqlalchemy import Column, Numeric, Date, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class WorkLog(Base):
    __tablename__ = "work_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    task_id = Column(
        UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False
    )
    member_id = Column(
        UUID(as_uuid=True), ForeignKey("members.id"), nullable=False
    )
    work_date = Column(Date, nullable=False)
    worked_hours = Column(Numeric(5, 2), nullable=False)
    memo = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
