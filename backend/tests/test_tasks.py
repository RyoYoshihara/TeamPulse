import pytest


@pytest.fixture
def project(client, user, auth_headers):
    res = client.post("/api/v1/projects", headers=auth_headers, json={
        "name": "Task Test Project", "status": "active"
    })
    return res.json()


@pytest.fixture
def task(client, user, auth_headers, project, member):
    res = client.post("/api/v1/tasks", headers=auth_headers, json={
        "project_id": project["id"],
        "assignee_member_id": str(member.id),
        "title": "Test Task",
        "priority": "high",
        "due_date": "2026-12-31",
        "estimated_hours": 8,
    })
    return res.json()


def test_create_task(client, user, auth_headers, project):
    res = client.post("/api/v1/tasks", headers=auth_headers, json={
        "project_id": project["id"],
        "title": "New Task",
    })
    assert res.status_code == 201
    assert res.json()["title"] == "New Task"
    assert res.json()["status"] == "todo"


def test_list_tasks(client, user, auth_headers, task):
    res = client.get("/api/v1/tasks", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total"] >= 1


def test_get_task(client, user, auth_headers, task):
    res = client.get(f"/api/v1/tasks/{task['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["title"] == "Test Task"


def test_update_task(client, user, auth_headers, task):
    res = client.patch(f"/api/v1/tasks/{task['id']}", headers=auth_headers, json={
        "title": "Updated Task"
    })
    assert res.status_code == 200
    assert res.json()["title"] == "Updated Task"


def test_update_task_status(client, user, auth_headers, task):
    res = client.patch(f"/api/v1/tasks/{task['id']}/status", headers=auth_headers, json={
        "status": "in_progress"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "in_progress"


def test_filter_tasks_by_status(client, user, auth_headers, task):
    res = client.get("/api/v1/tasks?status=todo", headers=auth_headers)
    assert res.status_code == 200
    assert all(t["status"] == "todo" for t in res.json()["items"])


def test_delete_task(client, user, auth_headers, task):
    res = client.delete(f"/api/v1/tasks/{task['id']}", headers=auth_headers)
    assert res.status_code == 204
