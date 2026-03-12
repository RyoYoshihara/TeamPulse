"""初期データ投入スクリプト"""

import uuid

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.organization import Organization
from app.models.user import User
from app.models.member import Member


def seed():
    db: Session = SessionLocal()

    # 既にデータがあればスキップ
    existing = db.query(Organization).first()
    if existing:
        print("Seed data already exists. Skipping.")
        db.close()
        return

    # 組織
    org_id = uuid.uuid4()
    org = Organization(
        id=org_id,
        name="Sample Corp",
        code="sample",
        status="active",
    )
    db.add(org)
    db.flush()

    # メンバー
    admin_member_id = uuid.uuid4()
    admin_member = Member(
        id=admin_member_id,
        organization_id=org_id,
        employee_code="EMP001",
        name="Admin User",
        department="Engineering",
        position="Manager",
        monthly_capacity_hours=160,
        employment_type="full_time",
        is_active=True,
    )
    db.add(admin_member)
    db.flush()

    # 管理者ユーザー
    admin_user = User(
        id=uuid.uuid4(),
        organization_id=org_id,
        member_id=admin_member_id,
        name="Admin User",
        email="admin@example.com",
        password_hash=hash_password("password"),
        role="admin",
        is_active=True,
    )
    db.add(admin_user)

    db.commit()
    db.close()

    print("Seed data created successfully!")
    print("  Email:    admin@example.com")
    print("  Password: password")


if __name__ == "__main__":
    seed()
