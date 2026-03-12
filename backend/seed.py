"""デモデータ投入スクリプト

Usage:
  docker compose exec backend python seed.py
  docker compose exec backend python seed.py --reset  # 既存データを削除して再投入
"""
import sys
import uuid
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.security import hash_password
from app.models.organization import Organization
from app.models.user import User
from app.models.member import Member
from app.models.project import Project
from app.models.project_assignment import ProjectAssignment
from app.models.task import Task
from app.models.work_log import WorkLog


def seed():
    db: Session = SessionLocal()

    # Check if data already exists
    if db.query(Organization).first():
        if "--reset" not in sys.argv:
            print("データが既に存在します。--reset オプションで再投入できます。")
            db.close()
            return
        print("既存データを削除中...")
        db.query(WorkLog).delete()
        db.query(Task).delete()
        db.query(ProjectAssignment).delete()
        db.query(Project).delete()
        db.query(User).delete()
        db.query(Member).delete()
        db.query(Organization).delete()
        db.commit()
        print("削除完了。再投入します。")

    today = date.today()
    org_id = uuid.uuid4()

    # --- Organization ---
    org = Organization(id=org_id, name="株式会社テックパルス", code="TECHPULSE")
    db.add(org)
    db.flush()

    # --- Members ---
    members_data = [
        {"name": "田中 太郎", "employee_code": "EMP001", "department": "開発部", "position": "テックリード", "employment_type": "full_time"},
        {"name": "佐藤 花子", "employee_code": "EMP002", "department": "開発部", "position": "シニアエンジニア", "employment_type": "full_time"},
        {"name": "鈴木 一郎", "employee_code": "EMP003", "department": "開発部", "position": "エンジニア", "employment_type": "full_time"},
        {"name": "高橋 美咲", "employee_code": "EMP004", "department": "デザイン部", "position": "UIデザイナー", "employment_type": "full_time"},
        {"name": "伊藤 健太", "employee_code": "EMP005", "department": "開発部", "position": "エンジニア", "employment_type": "contract"},
        {"name": "渡辺 さくら", "employee_code": "EMP006", "department": "QA部", "position": "QAエンジニア", "employment_type": "full_time"},
        {"name": "山本 大輔", "employee_code": "EMP007", "department": "インフラ部", "position": "SRE", "employment_type": "full_time"},
        {"name": "中村 優子", "employee_code": "EMP008", "department": "開発部", "position": "エンジニア", "employment_type": "part_time"},
    ]
    members = []
    for md in members_data:
        m = Member(
            id=uuid.uuid4(), organization_id=org_id,
            monthly_capacity_hours=160, is_active=True,
            joined_at=today - timedelta(days=365),
            **md,
        )
        db.add(m)
        members.append(m)
    db.flush()

    # --- Users (login accounts for first 3 members) ---
    users_data = [
        {"member": members[0], "email": "tanaka@example.com", "role": "admin"},
        {"member": members[1], "email": "sato@example.com", "role": "manager"},
        {"member": members[2], "email": "suzuki@example.com", "role": "member"},
    ]
    users = []
    for ud in users_data:
        u = User(
            id=uuid.uuid4(), organization_id=org_id,
            member_id=ud["member"].id,
            name=ud["member"].name,
            email=ud["email"],
            password_hash=hash_password("password123"),
            role=ud["role"],
        )
        db.add(u)
        users.append(u)
    db.flush()
    admin_user = users[0]

    # --- Projects ---
    projects_data = [
        {
            "name": "顧客管理システム刷新",
            "project_code": "PRJ-001",
            "description": "既存の顧客管理システムをモダン技術スタックで再構築",
            "status": "active",
            "start_date": today - timedelta(days=60),
            "end_date": today + timedelta(days=120),
            "progress_rate": 35,
        },
        {
            "name": "社内ポータルサイト構築",
            "project_code": "PRJ-002",
            "description": "社内情報共有のためのポータルサイト新規構築",
            "status": "active",
            "start_date": today - timedelta(days=30),
            "end_date": today + timedelta(days=90),
            "progress_rate": 15,
        },
        {
            "name": "モバイルアプリ v2.0",
            "project_code": "PRJ-003",
            "description": "既存モバイルアプリの大型アップデート",
            "status": "planning",
            "start_date": today + timedelta(days=14),
            "end_date": today + timedelta(days=180),
            "progress_rate": 0,
        },
        {
            "name": "データ分析基盤整備",
            "project_code": "PRJ-004",
            "description": "データレイク・BIダッシュボード環境の整備",
            "status": "on_hold",
            "start_date": today - timedelta(days=90),
            "end_date": today + timedelta(days=60),
            "progress_rate": 50,
        },
        {
            "name": "セキュリティ監査対応",
            "project_code": "PRJ-005",
            "description": "年次セキュリティ監査への対応と改善",
            "status": "active",
            "start_date": today - timedelta(days=14),
            "end_date": today + timedelta(days=45),
            "progress_rate": 20,
        },
    ]
    projects = []
    for pd in projects_data:
        p = Project(id=uuid.uuid4(), organization_id=org_id, **pd)
        db.add(p)
        projects.append(p)
    db.flush()

    # --- Project Assignments ---
    assignments_data = [
        # PRJ-001: 顧客管理システム
        {"project": projects[0], "member": members[0], "allocation_rate": 40, "role": "テックリード", "is_primary": True},
        {"project": projects[0], "member": members[1], "allocation_rate": 60, "role": "バックエンド", "is_primary": False},
        {"project": projects[0], "member": members[2], "allocation_rate": 80, "role": "フロントエンド", "is_primary": False},
        {"project": projects[0], "member": members[3], "allocation_rate": 30, "role": "UI設計", "is_primary": False},
        # PRJ-002: ポータル
        {"project": projects[1], "member": members[0], "allocation_rate": 20, "role": "レビュー", "is_primary": False},
        {"project": projects[1], "member": members[4], "allocation_rate": 100, "role": "開発", "is_primary": True},
        {"project": projects[1], "member": members[3], "allocation_rate": 50, "role": "デザイン", "is_primary": False},
        # PRJ-003: モバイルアプリ (planning)
        {"project": projects[2], "member": members[1], "allocation_rate": 30, "role": "設計", "is_primary": True},
        # PRJ-005: セキュリティ
        {"project": projects[4], "member": members[6], "allocation_rate": 80, "role": "SRE", "is_primary": True},
        {"project": projects[4], "member": members[5], "allocation_rate": 40, "role": "テスト", "is_primary": False},
    ]
    for ad in assignments_data:
        a = ProjectAssignment(
            id=uuid.uuid4(), organization_id=org_id,
            project_id=ad["project"].id, member_id=ad["member"].id,
            allocation_rate=ad["allocation_rate"], role=ad["role"],
            is_primary=ad["is_primary"],
            start_date=ad["project"].start_date,
            end_date=ad["project"].end_date,
        )
        db.add(a)
    db.flush()

    # --- Tasks ---
    tasks_data = [
        # PRJ-001 tasks
        {"project": projects[0], "assignee": members[1], "title": "API設計書作成", "status": "done", "priority": "high", "due_date": today - timedelta(days=30), "estimated_hours": 16, "actual_hours": 14},
        {"project": projects[0], "assignee": members[2], "title": "ログイン画面実装", "status": "done", "priority": "high", "due_date": today - timedelta(days=20), "estimated_hours": 24, "actual_hours": 20},
        {"project": projects[0], "assignee": members[1], "title": "顧客一覧API実装", "status": "in_progress", "priority": "high", "due_date": today + timedelta(days=5), "estimated_hours": 20, "actual_hours": 8},
        {"project": projects[0], "assignee": members[2], "title": "顧客一覧画面実装", "status": "todo", "priority": "medium", "due_date": today + timedelta(days=10), "estimated_hours": 16, "actual_hours": 0},
        {"project": projects[0], "assignee": members[1], "title": "顧客詳細API実装", "status": "todo", "priority": "medium", "due_date": today + timedelta(days=15), "estimated_hours": 12, "actual_hours": 0},
        {"project": projects[0], "assignee": members[3], "title": "UI/UXデザイン改善", "status": "review", "priority": "medium", "due_date": today - timedelta(days=3), "estimated_hours": 10, "actual_hours": 12},
        {"project": projects[0], "assignee": members[0], "title": "コードレビュー体制構築", "status": "in_progress", "priority": "low", "due_date": today + timedelta(days=7), "estimated_hours": 8, "actual_hours": 3},
        # PRJ-002 tasks
        {"project": projects[1], "assignee": members[4], "title": "ポータルトップページ実装", "status": "in_progress", "priority": "high", "due_date": today + timedelta(days=3), "estimated_hours": 24, "actual_hours": 10},
        {"project": projects[1], "assignee": members[4], "title": "お知らせ機能実装", "status": "todo", "priority": "medium", "due_date": today + timedelta(days=14), "estimated_hours": 16, "actual_hours": 0},
        {"project": projects[1], "assignee": members[3], "title": "ポータルデザイン作成", "status": "in_progress", "priority": "high", "due_date": today - timedelta(days=5), "estimated_hours": 20, "actual_hours": 15},
        # PRJ-005 tasks
        {"project": projects[4], "assignee": members[6], "title": "脆弱性スキャン実施", "status": "in_progress", "priority": "critical", "due_date": today + timedelta(days=2), "estimated_hours": 8, "actual_hours": 4},
        {"project": projects[4], "assignee": members[5], "title": "ペネトレーションテスト", "status": "todo", "priority": "high", "due_date": today + timedelta(days=10), "estimated_hours": 24, "actual_hours": 0},
        {"project": projects[4], "assignee": members[6], "title": "監査レポート作成", "status": "todo", "priority": "medium", "due_date": today + timedelta(days=20), "estimated_hours": 12, "actual_hours": 0},
    ]
    tasks = []
    for td in tasks_data:
        t = Task(
            id=uuid.uuid4(), organization_id=org_id,
            project_id=td["project"].id,
            assignee_member_id=td["assignee"].id,
            created_by_user_id=admin_user.id,
            title=td["title"], status=td["status"],
            priority=td["priority"], due_date=td["due_date"],
            estimated_hours=td["estimated_hours"],
            actual_hours=td["actual_hours"],
        )
        db.add(t)
        tasks.append(t)
    db.flush()

    # --- Work Logs (for tasks with actual_hours > 0) ---
    for t in tasks:
        if t.actual_hours and t.actual_hours > 0:
            remaining = float(t.actual_hours)
            work_date = t.due_date - timedelta(days=10) if t.due_date else today - timedelta(days=5)
            while remaining > 0:
                hours = min(remaining, 4.0)
                wl = WorkLog(
                    id=uuid.uuid4(), organization_id=org_id,
                    task_id=t.id, member_id=t.assignee_member_id,
                    work_date=work_date,
                    worked_hours=hours,
                )
                db.add(wl)
                remaining -= hours
                work_date += timedelta(days=1)
    db.flush()

    db.commit()

    # Collect info before closing session
    org_name = org.name
    org_code = org.code
    member_count = len(members)
    user_count = len(users)
    project_count = len(projects)
    task_count = len(tasks)
    login_info = [(ud["email"], ud["member"].name, ud["role"]) for ud in users_data]

    db.close()

    print("デモデータ投入完了!")
    print(f"  組織: {org_name} (code: {org_code})")
    print(f"  メンバー: {member_count}名")
    print(f"  ユーザー: {user_count}名")
    print(f"  プロジェクト: {project_count}件")
    print(f"  タスク: {task_count}件")
    print()
    print("ログイン情報:")
    for email, name, role in login_info:
        print(f"  {email} / password123 (role: {role})")


if __name__ == "__main__":
    seed()
