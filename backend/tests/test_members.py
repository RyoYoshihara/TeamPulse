def test_list_members(client, user, auth_headers, member):
    res = client.get("/api/v1/members", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1


def test_create_member(client, user, auth_headers):
    res = client.post("/api/v1/members", headers=auth_headers, json={
        "name": "New Member", "department": "Sales"
    })
    assert res.status_code == 201
    assert res.json()["name"] == "New Member"


def test_get_member(client, user, auth_headers, member):
    res = client.get(f"/api/v1/members/{member.id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Test Member"


def test_update_member(client, user, auth_headers, member):
    res = client.patch(f"/api/v1/members/{member.id}", headers=auth_headers, json={
        "position": "Senior"
    })
    assert res.status_code == 200
    assert res.json()["position"] == "Senior"


def test_delete_member(client, user, auth_headers, db):
    from app.models.member import Member
    import uuid
    m = Member(id=uuid.uuid4(), organization_id=user.organization_id, name="To Delete")
    db.add(m)
    db.commit()
    res = client.delete(f"/api/v1/members/{m.id}", headers=auth_headers)
    assert res.status_code == 204


def test_search_members(client, user, auth_headers, member):
    res = client.get("/api/v1/members?keyword=Test", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total"] >= 1
