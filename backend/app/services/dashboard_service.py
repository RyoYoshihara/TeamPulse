from datetime import date
from uuid import UUID

from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.task import Task
from app.models.member import Member
from app.models.project_assignment import ProjectAssignment


def get_summary(db: Session, organization_id: UUID) -> dict:
    today = date.today()

    active_projects = db.query(Project).filter(
        Project.organization_id == organization_id,
        Project.status == "active",
    ).count()

    open_tasks = db.query(Task).filter(
        Task.organization_id == organization_id,
        Task.status.in_(["todo", "in_progress", "review"]),
    ).count()

    delayed_tasks = db.query(Task).filter(
        Task.organization_id == organization_id,
        Task.status.in_(["todo", "in_progress", "review"]),
        Task.due_date < today,
    ).count()

    # Over-capacity: members with current allocation > 100%
    members = db.query(Member).filter(
        Member.organization_id == organization_id,
        Member.is_active == True,
    ).all()
    over_count = 0
    for m in members:
        total = db.query(sqlfunc.coalesce(sqlfunc.sum(ProjectAssignment.allocation_rate), 0)).filter(
            ProjectAssignment.member_id == m.id,
            (ProjectAssignment.end_date >= today) | (ProjectAssignment.end_date.is_(None)),
        ).scalar()
        if total > 100:
            over_count += 1

    return {
        "active_projects_count": active_projects,
        "open_tasks_count": open_tasks,
        "delayed_tasks_count": delayed_tasks,
        "over_capacity_members_count": over_count,
    }


def get_member_utilizations(db: Session, organization_id: UUID) -> list[dict]:
    today = date.today()
    members = db.query(Member).filter(
        Member.organization_id == organization_id,
        Member.is_active == True,
    ).order_by(Member.name).all()

    result = []
    for m in members:
        alloc = db.query(sqlfunc.coalesce(sqlfunc.sum(ProjectAssignment.allocation_rate), 0)).filter(
            ProjectAssignment.member_id == m.id,
            (ProjectAssignment.end_date >= today) | (ProjectAssignment.end_date.is_(None)),
        ).scalar()
        task_count = db.query(Task).filter(
            Task.assignee_member_id == m.id,
            Task.status.in_(["todo", "in_progress", "review"]),
        ).count()
        result.append({
            "member_id": str(m.id),
            "name": m.name,
            "department": m.department,
            "current_allocation_rate": int(alloc),
            "task_count": task_count,
        })
    return result


def get_project_progress(db: Session, organization_id: UUID) -> list[dict]:
    projects = db.query(Project).filter(
        Project.organization_id == organization_id,
        Project.status.in_(["planning", "active", "on_hold"]),
    ).order_by(Project.created_at.desc()).all()

    result = []
    for p in projects:
        assign_count = db.query(ProjectAssignment).filter(
            ProjectAssignment.project_id == p.id,
        ).count()
        result.append({
            "project_id": str(p.id),
            "name": p.name,
            "status": p.status,
            "progress_rate": p.progress_rate,
            "assignment_count": assign_count,
        })
    return result


def get_delayed_tasks(db: Session, organization_id: UUID) -> list[dict]:
    today = date.today()
    tasks = db.query(Task).filter(
        Task.organization_id == organization_id,
        Task.status.in_(["todo", "in_progress", "review"]),
        Task.due_date < today,
    ).order_by(Task.due_date).all()

    from app.models.project import Project as Proj
    result = []
    for t in tasks:
        assignee = db.query(Member).filter(Member.id == t.assignee_member_id).first() if t.assignee_member_id else None
        project = db.query(Proj).filter(Proj.id == t.project_id).first()
        result.append({
            "task_id": str(t.id),
            "title": t.title,
            "assignee_name": assignee.name if assignee else None,
            "due_date": t.due_date,
            "priority": t.priority,
            "project_name": project.name if project else None,
        })
    return result
