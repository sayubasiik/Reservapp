def test_register_normalizes_user_data(client, register_user):
    response = register_user(
        email="CLIENTE@EXAMPLE.COM",
        full_name="  Cliente   Prueba  ",
    )

    assert response.status_code == 201
    assert response.json()["email"] == "cliente@example.com"
    assert response.json()["full_name"] == "Cliente Prueba"
    assert response.json()["role"] == "client"
    assert "hashed_password" not in response.json()

def test_register_rejects_duplicate_email(client, register_user):
    assert register_user().status_code == 201

    response = register_user(email="CLIENTE@example.com")

    assert response.status_code == 400
    assert response.json()["detail"] == "El correo ya está registrado"

def test_register_rejects_weak_password(register_user):
    response = register_user(password="1234567")

    assert response.status_code == 422


def test_login_and_get_current_user(client, register_user):
    register_user()

    login = client.post(
        "/api/auth/login",
        data={
            "username": "CLIENTE@EXAMPLE.COM",
            "password": "Password123",
        },
    )

    assert login.status_code == 200

    token = login.json()["access_token"]
    profile = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert profile.status_code == 200
    assert profile.json()["email"] == "cliente@example.com"


def test_protected_endpoint_rejects_missing_token(client):
    response = client.get("/api/users/me")

    assert response.status_code == 401

def test_register_defaults_to_client_role(register_user):
    response = register_user()

    assert response.status_code == 201
    assert response.json()["role"] == "client"


def test_register_accepts_business_owner_role(register_user):
    response = register_user(role="business_owner")

    assert response.status_code == 201
    assert response.json()["role"] == "business_owner"


def test_register_rejects_admin_role(register_user):
    response = register_user(role="admin")

    assert response.status_code == 422


def test_register_rejects_unknown_role(register_user):
    response = register_user(role="manager")

    assert response.status_code == 422
    
