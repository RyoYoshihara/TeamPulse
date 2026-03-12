def test_login_success(client, user):
    res = client.post("/api/v1/auth/login", json={
        "email": "test@example.com", "password": "password"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_login_wrong_password(client, user):
    res = client.post("/api/v1/auth/login", json={
        "email": "test@example.com", "password": "wrong"
    })
    assert res.status_code == 401


def test_login_unknown_email(client, user):
    res = client.post("/api/v1/auth/login", json={
        "email": "unknown@example.com", "password": "password"
    })
    assert res.status_code == 401


def test_me(client, user, auth_headers):
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "test@example.com"


def test_me_no_auth(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 403
