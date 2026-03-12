import pytest


@pytest.fixture
def project(client, user, auth_headers):
    res = client.post("/api/v1/projects", headers=auth_headers, json={
        "name": "Dashboard Project", "status": "active", "progress_rate": 40
    })
    return res.json()


def test_summary(client, user, auth_headers, project):
    res = client.get("/api/v1/dashboard/summary", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "active_projects_count" in data
    assert "open_tasks_count" in data
    assert "delayed_tasks_count" in data
    assert "over_capacity_members_count" in data
    assert data["active_projects_count"] >= 1


def test_member_utilizations(client, user, auth_headers, member):
    res = client.get("/api/v1/dashboard/member-utilizations", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert len(res.json()) >= 1


def test_project_progress(client, user, auth_headers, project):
    res = client.get("/api/v1/dashboard/project-progress", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert len(res.json()) >= 1
    assert res.json()[0]["progress_rate"] == 40


def test_delayed_tasks(client, user, auth_headers, project):
    # Create an overdue task
    client.post("/api/v1/tasks", headers=auth_headers, json={
        "project_id": project["id"],
        "title": "Overdue Task",
        "due_date": "2020-01-01",
        "priority": "high",
    })
    res = client.get("/api/v1/dashboard/delayed-tasks", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1
    assert res.json()[0]["title"] == "Overdue Task"
