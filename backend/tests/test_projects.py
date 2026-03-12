import pytest


@pytest.fixture
def project(client, user, auth_headers):
    res = client.post("/api/v1/projects", headers=auth_headers, json={
        "name": "Test Project", "project_code": "PRJ-001",
        "status": "active", "progress_rate": 20
    })
    return res.json()


def test_create_project(client, user, auth_headers):
    res = client.post("/api/v1/projects", headers=auth_headers, json={
        "name": "New Project", "status": "planning"
    })
    assert res.status_code == 201
    assert res.json()["name"] == "New Project"


def test_list_projects(client, user, auth_headers, project):
    res = client.get("/api/v1/projects", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total"] >= 1


def test_get_project(client, user, auth_headers, project):
    res = client.get(f"/api/v1/projects/{project['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Test Project"


def test_update_project(client, user, auth_headers, project):
    res = client.patch(f"/api/v1/projects/{project['id']}", headers=auth_headers, json={
        "progress_rate": 50
    })
    assert res.status_code == 200
    assert res.json()["progress_rate"] == 50


def test_filter_by_status(client, user, auth_headers, project):
    res = client.get("/api/v1/projects?status=active", headers=auth_headers)
    assert res.status_code == 200
    assert all(p["status"] == "active" for p in res.json()["items"])


def test_delete_project(client, user, auth_headers, project):
    res = client.delete(f"/api/v1/projects/{project['id']}", headers=auth_headers)
    assert res.status_code == 204
