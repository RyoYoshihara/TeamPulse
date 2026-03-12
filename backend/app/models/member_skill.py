import uuid

from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class MemberSkill(Base):
    __tablename__ = "member_skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    member_id = Column(
        UUID(as_uuid=True), ForeignKey("members.id"), nullable=False
    )
    skill_id = Column(
        UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False
    )
    level = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint(
            "organization_id", "member_id", "skill_id",
            name="uq_member_skill"
        ),
    )
