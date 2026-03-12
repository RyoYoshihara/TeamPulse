import uuid

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.core.security import hash_password, create_access_token
from app.models.organization import Organization
from app.models.user import User
from app.models.member import Member

TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def org(db):
    org = Organization(id=uuid.uuid4(), name="Test Org", code="TEST")
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@pytest.fixture
def member(db, org):
    m = Member(
        id=uuid.uuid4(),
        organization_id=org.id,
        name="Test Member",
        employee_code="EMP001",
        department="Dev",
        position="Engineer",
        employment_type="full_time",
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@pytest.fixture
def user(db, org, member):
    u = User(
        id=uuid.uuid4(),
        organization_id=org.id,
        member_id=member.id,
        name="Test User",
        email="test@example.com",
        password_hash=hash_password("password"),
        role="admin",
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def auth_headers(user):
    token = create_access_token(
        {"sub": str(user.id), "organization_id": str(user.organization_id), "role": user.role}
    )
    return {"Authorization": f"Bearer {token}"}
