from app.core.security import hash_password
from app.models.user import User
from tests.conftest import TestingSessionLocal


def admin_headers(client):
    with TestingSessionLocal() as db:
        db.add(
            User(
                full_name="Administrador",
                email="admin@example.com",
                hashed_password=hash_password(
                    "AdminPassword123"
                ),
                role="admin",
            )
        )
        db.commit()

    login = client.post(
        "/api/auth/login",
        data={
            "username": "admin@example.com",
            "password": "AdminPassword123",
        },
    )

    return {
        "Authorization": (
            f"Bearer {login.json()['access_token']}"
        )
    }


def test_regular_user_cannot_create_resource(
    client,
    auth_headers,
):
    response = client.post(
        "/api/resources/",
        headers=auth_headers,
        json={
            "name": "Mesa 1",
            "capacity": 4,
            "price_per_hour": 100,
        },
    )

    assert response.status_code == 403


def test_admin_can_create_resource(client):
    response = client.post(
        "/api/resources/",
        headers=admin_headers(client),
        json={
            "name": "Mesa 1",
            "capacity": 4,
            "price_per_hour": 100,
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Mesa 1"


def test_resource_rejects_negative_values(client):
    response = client.post(
        "/api/resources/",
        headers=admin_headers(client),
        json={
            "name": "Mesa 1",
            "capacity": 0,
            "price_per_hour": -1,
        },
    )

    assert response.status_code == 422