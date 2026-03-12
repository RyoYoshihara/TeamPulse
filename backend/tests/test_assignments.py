import pytest


@pytest.fixture
def project(client, user, auth_headers):
    res = client.post("/api/v1/projects", headers=auth_headers, json={
        "name": "Assign Test Project", "status": "active"
    })
    return res.json()


@pytest.fixture
def assignment(client, user, auth_headers, project, member):
    res = client.post("/api/v1/project-assignments", headers=auth_headers, json={
        "project_id": project["id"],
        "member_id": str(member.id),
        "allocation_rate": 50,
        "role": "backend",
        "is_primary": True,
    })
    return res.json()


def test_create_assignment(client, user, auth_headers, project, member):
    res = client.post("/api/v1/project-assignments", headers=auth_headers, json={
        "project_id": project["id"],
        "member_id": str(member.id),
        "allocation_rate": 30,
    })
    assert res.status_code == 201
    assert res.json()["allocation_rate"] == 30


def test_list_assignments(client, user, auth_headers, assignment):
    res = client.get("/api/v1/project-assignments", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total"] >= 1


def test_update_assignment(client, user, auth_headers, assignment):
    res = client.patch(f"/api/v1/project-assignments/{assignment['id']}", headers=auth_headers, json={
        "allocation_rate": 80
    })
    assert res.status_code == 200
    assert res.json()["allocation_rate"] == 80


def test_delete_assignment(client, user, auth_headers, assignment):
    res = client.delete(f"/api/v1/project-assignments/{assignment['id']}", headers=auth_headers)
    assert res.status_code == 204


def test_allocation_summary(client, user, auth_headers, assignment, member):
    res = client.get(f"/api/v1/members/{member.id}/allocation-summary", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["current_allocation_rate"] == 50
