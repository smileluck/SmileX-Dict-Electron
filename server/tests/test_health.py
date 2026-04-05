from fastapi import status


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == status.HTTP_200_OK


def test_health_returns_json(client):
    resp = client.get("/api/health")
    data = resp.json()
    assert isinstance(data, dict)
