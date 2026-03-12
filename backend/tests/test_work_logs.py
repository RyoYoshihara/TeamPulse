import pytest


@pytest.fixture
def project(client, user, auth_headers):
    res = client.post("/api/v1/projects", headers=auth_headers, json={
        "name": "WL Test Project", "status": "active"
    })
    return res.json()


@pytest.fixture
def task(client, user, auth_headers, project):
    res = client.post("/api/v1/tasks", headers=auth_headers, json={
        "project_id": project["id"],
        "title": "WL Test Task",
        "estimated_hours": 10,
    })
    return res.json()


@pytest.fixture
def work_log(client, user, auth_headers, task, member):
    res = client.post("/api/v1/work-logs", headers=auth_headers, json={
        "task_id": task["id"],
        "member_id": str(member.id),
        "work_date": "2026-04-05",
        "worked_hours": 3.0,
        "memo": "Test work",
    })
    return res.json()


def test_create_work_log(client, user, auth_headers, task, member):
    res = client.post("/api/v1/work-logs", headers=auth_headers, json={
        "task_id": task["id"],
        "member_id": str(member.id),
        "work_date": "2026-04-06",
        "worked_hours": 2.5,
    })
    assert res.status_code == 201
    assert res.json()["worked_hours"] == 2.5


def test_list_work_logs(client, user, auth_headers, work_log):
    res = client.get("/api/v1/work-logs", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total"] >= 1


def test_update_work_log(client, user, auth_headers, work_log):
    res = client.patch(f"/api/v1/work-logs/{work_log['id']}", headers=auth_headers, json={
        "worked_hours": 5.0
    })
    assert res.status_code == 200
    assert res.json()["worked_hours"] == 5.0


def test_actual_hours_sync(client, user, auth_headers, task, member):
    # Create two work logs
    client.post("/api/v1/work-logs", headers=auth_headers, json={
        "task_id": task["id"], "member_id": str(member.id),
        "work_date": "2026-04-05", "worked_hours": 3.0,
    })
    client.post("/api/v1/work-logs", headers=auth_headers, json={
        "task_id": task["id"], "member_id": str(member.id),
        "work_date": "2026-04-06", "worked_hours": 2.0,
    })
    # Check task actual_hours is sum
    res = client.get(f"/api/v1/tasks/{task['id']}", headers=auth_headers)
    assert res.json()["actual_hours"] == 5.0


def test_delete_work_log(client, user, auth_headers, work_log):
    res = client.delete(f"/api/v1/work-logs/{work_log['id']}", headers=auth_headers)
    assert res.status_code == 204
