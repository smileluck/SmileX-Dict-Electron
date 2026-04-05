from fastapi import status


def test_register(client):
    resp = client.post(
        "/api/auth/register",
        json={"username": "newuser", "password": "Test@1234"},
    )
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["username"] == "newuser"


def test_register_duplicate(client):
    client.post(
        "/api/auth/register",
        json={"username": "dupuser", "password": "Test@1234"},
    )
    resp = client.post(
        "/api/auth/register",
        json={"username": "dupuser", "password": "Test@5678"},
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


def test_login(client):
    client.post(
        "/api/auth/register",
        json={"username": "loginuser", "password": "Test@1234"},
    )
    resp = client.post(
        "/api/auth/login",
        json={"username": "loginuser", "password": "Test@1234"},
    )
    assert resp.status_code == status.HTTP_200_OK
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={"username": "wrongpw", "password": "Test@1234"},
    )
    resp = client.post(
        "/api/auth/login",
        json={"username": "wrongpw", "password": "Wrong@9999"},
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
