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
    ):
        return client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": password,
                "full_name": full_name,
            },
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