from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.schemas.dashboard import (
    DashboardSummary,
    MemberUtilization,
    ProjectProgress,
    DelayedTask,
)
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_summary(db, current_user.organization_id)


@router.get("/member-utilizations", response_model=list[MemberUtilization])
def get_member_utilizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_member_utilizations(db, current_user.organization_id)


@router.get("/project-progress", response_model=list[ProjectProgress])
def get_project_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_project_progress(db, current_user.organization_id)


@router.get("/delayed-tasks", response_model=list[DelayedTask])
def get_delayed_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_delayed_tasks(db, current_user.organization_id)
