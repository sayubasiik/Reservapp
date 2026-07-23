from app.core.security import hash_password
from app.models.business import Business
from app.models.user import User
from conftest import TestingSessionLocal


def create_user_headers(client, email, password, role):
    with TestingSessionLocal() as db:
        user = User(
            full_name="Usuario de prueba",
            email=email,
            hashed_password=hash_password(password),
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_id = user.id

    login = client.post(
        "/api/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    headers = {
        "Authorization": f"Bearer {login.json()['access_token']}",
    }

    return user_id, headers


def create_business_for_owner(owner_id):
    with TestingSessionLocal() as db:
        business = Business(
            owner_id=owner_id,
            name="Negocio existente",
            category="Restaurante",
        )
        db.add(business)
        db.commit()
        db.refresh(business)

        return business.id


def test_business_owner_can_create_own_business(client):
    owner_id, headers = create_user_headers(
        client,
        email="owner@example.com",
        password="OwnerPassword123",
        role="business_owner",
    )

    response = client.post(
        "/api/businesses/",
        headers=headers,
        json={
            "name": "Café Central",
            "category": "Cafetería",
            "address": "Centro",
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Café Central"
    assert response.json()["owner_id"] == owner_id
    assert response.json()["is_active"] is True


def test_client_cannot_create_business(client, auth_headers):
    response = client.post(
        "/api/businesses/",
        headers=auth_headers,
        json={
            "name": "Negocio no permitido",
        },
    )

    assert response.status_code == 403


def test_owner_cannot_create_business_for_another_user(client):
    owner_id, headers = create_user_headers(
        client,
        email="owner@example.com",
        password="OwnerPassword123",
        role="business_owner",
    )

    response = client.post(
        "/api/businesses/",
        headers=headers,
        json={
            "owner_id": owner_id + 1,
            "name": "Negocio ajeno",
        },
    )

    assert response.status_code == 403


def test_owner_cannot_update_another_owners_business(client):
    first_owner_id, first_headers = create_user_headers(
        client,
        email="first@example.com",
        password="FirstPassword123",
        role="business_owner",
    )

    second_owner_id, _ = create_user_headers(
        client,
        email="second@example.com",
        password="SecondPassword123",
        role="business_owner",
    )

    assert first_owner_id != second_owner_id

    business_id = create_business_for_owner(second_owner_id)

    response = client.patch(
        f"/api/businesses/{business_id}",
        headers=first_headers,
        json={
            "name": "Nombre modificado",
        },
    )

    assert response.status_code == 403