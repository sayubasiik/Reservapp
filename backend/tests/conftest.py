import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = (
    "test-secret-key-that-is-not-used-in-production"
)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.models.reservation import Reservation  # noqa: F401
from app.models.resource import Resource  # noqa: F401
from app.models.user import User  # noqa: F401
from app.main import app


TEST_DATABASE_URL = "sqlite:///./reservapp_test.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def reset_database():
    app.dependency_overrides[get_db] = override_get_db

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    print("Tablas detectadas:", list(Base.metadata.tables.keys()))

    yield

    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def register_user(client):
    def _register(
        email: str = "cliente@example.com",
        password: str = "Password123",
        full_name: str = "Cliente Prueba",
        role: str | None = None,
    ):
        payload = {
            "email": email,
            "password": password,
            "full_name": full_name,
        }

        if role is not None:
            payload["role"] = role

        return client.post(
            "/api/auth/register",
            json=payload,
        )

    return _register


@pytest.fixture
def auth_headers(client, register_user):
    register_user()

    response = client.post(
        "/api/auth/login",
        data={
            "username": "cliente@example.com",
            "password": "Password123",
        },
    )

    return {
        "Authorization": (
            f"Bearer {response.json()['access_token']}"
        )
    }

@pytest.fixture
def owner_headers(client, register_user):
    """Sesión de un dueño de negocio: es quien usa el panel administrativo."""
    register_user(
        email="dueno@example.com",
        password="Password123",
        full_name="Dueño Prueba",
        role="business_owner",
    )
    response = client.post(
        "/api/auth/login",
        data={"username": "dueno@example.com", "password": "Password123"},
    )
    return {
        "Authorization": f"Bearer {response.json()['access_token']}"
    }


@pytest.fixture
def business_with_data(client, owner_headers):
    """Crea un negocio con un recurso y una reserva, para probar métricas."""
    business = client.post(
        "/api/businesses/",
        json={"name": "Negocio Prueba", "category": "Belleza"},
        headers=owner_headers,
    ).json()

    resource = client.post(
        "/api/resources/",
        json={
            "name": "Recurso Prueba",
            "category": "Sala",
            "capacity": 4,
            "price_per_hour": 100,
            "business_id": business["id"],
        },
        headers=owner_headers,
    ).json()

    return {"business": business, "resource": resource}


@pytest.fixture
def db_session():
    """
    Sesion directa a la BD de pruebas.

    Sirve para preparar estados que la API no expone, como marcar una
    reserva como 'completed' (no existe endpoint para completar una reserva).
    """
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
