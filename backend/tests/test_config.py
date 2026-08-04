import pytest
from pydantic import ValidationError

from app.core.config import Settings


VALID_SECRET = "a-strong-random-secret-with-more-than-32-characters"


def build_settings(**overrides):
    values = {
        "DATABASE_URL": "sqlite://",
        "SECRET_KEY": VALID_SECRET,
        "ENVIRONMENT": "test",
        "CORS_ORIGINS": ["http://localhost:5173"],
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)


def test_secret_key_requires_minimum_length():
    with pytest.raises(ValidationError, match="al menos 32 caracteres"):
        build_settings(SECRET_KEY="short-secret")


def test_database_url_cannot_be_empty():
    with pytest.raises(ValidationError, match="DATABASE_URL no puede estar vacío"):
        build_settings(DATABASE_URL="   ")


def test_production_requires_postgresql_with_ssl():
    with pytest.raises(ValidationError, match="Producción requiere PostgreSQL"):
        build_settings(
            ENVIRONMENT="production",
            CORS_ORIGINS=["https://reservapp.example"],
        )

    with pytest.raises(ValidationError, match="sslmode=require"):
        build_settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://user:password@database/reservapp",
            CORS_ORIGINS=["https://reservapp.example"],
        )


def test_production_rejects_unsafe_cors_origins():
    with pytest.raises(ValidationError, match="orígenes CORS HTTPS explícitos"):
        build_settings(
            ENVIRONMENT="production",
            DATABASE_URL=(
                "postgresql://user:password@database/reservapp?sslmode=require"
            ),
            CORS_ORIGINS=["http://localhost:5173"],
        )


def test_production_rejects_development_credentials():
    with pytest.raises(ValidationError, match="SECRET_KEY usa un valor de desarrollo"):
        build_settings(
            ENVIRONMENT="production",
            DATABASE_URL=(
                "postgresql://user:password@database/reservapp?sslmode=require"
            ),
            SECRET_KEY="dev-only-secret-key-with-at-least-32-characters",
            CORS_ORIGINS=["https://reservapp.example"],
        )


def test_valid_production_configuration():
    settings = build_settings(
        ENVIRONMENT="production",
        DATABASE_URL=(
            "postgresql://user:password@database/reservapp?sslmode=require"
        ),
        CORS_ORIGINS=["https://reservapp.example/"],
    )

    assert settings.ENVIRONMENT == "production"
    assert settings.CORS_ORIGINS == ["https://reservapp.example"]
