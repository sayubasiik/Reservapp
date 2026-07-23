from app.core.security import hash_password
from app.models.business import Business
from app.models.user import User
from conftest import TestingSessionLocal


def create_admin_headers(client):
    with TestingSessionLocal() as db:
        admin = User(
            full_name="Administrador",
            email="admin@example.com",
            hashed_password=hash_password("AdminPassword123"),
            role="admin",
        )
        db.add(admin)
        db.commit()

    login = client.post(
        "/api/auth/login",
        data={
            "username": "admin@example.com",
            "password": "AdminPassword123",
        },
    )

    return {
        "Authorization": f"Bearer {login.json()['access_token']}",
    }


def create_business():
    with TestingSessionLocal() as db:
        owner = User(
            full_name="Propietario",
            email="owner@example.com",
            hashed_password=hash_password("OwnerPassword123"),
            role="business_owner",
        )
        db.add(owner)
        db.flush()

        business = Business(
            owner_id=owner.id,
            name="Negocio de prueba",
            category="Restaurante",
        )
        db.add(business)
        db.commit()
        db.refresh(business)

        return business.id


def test_regular_user_cannot_create_resource(client, auth_headers):
    response = client.post(
        "/api/resources/",
        headers=auth_headers,
        json={
            "business_id": 1,
            "name": "Mesa 1",
            "capacity": 4,
            "price_per_hour": 100,
        },
    )

    assert response.status_code == 403


def test_admin_can_create_resource(client):
    business_id = create_business()
    headers = create_admin_headers(client)

    response = client.post(
        "/api/resources/",
        headers=headers,
        json={
            "business_id": business_id,
            "name": "Mesa 1",
            "category": "Mesa",
            "capacity": 4,
            "price_per_hour": 100,
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Mesa 1"
    assert response.json()["business_id"] == business_id


def test_resource_rejects_negative_values(client):
    headers = create_admin_headers(client)

    response = client.post(
        "/api/resources/",
        headers=headers,
        json={
            "business_id": 1,
            "name": "Mesa inválida",
            "capacity": 0,
            "price_per_hour": -1,
        },
    )

    assert response.status_code == 422