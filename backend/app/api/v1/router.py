from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, members, projects, assignments, tasks, work_logs, dashboard

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(members.router)
api_router.include_router(projects.router)
api_router.include_router(assignments.router)
api_router.include_router(tasks.router)
api_router.include_router(work_logs.router)
api_router.include_router(dashboard.router)
