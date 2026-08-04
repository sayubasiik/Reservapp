"""Configuración centralizada y validada desde variables de entorno."""

from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    PROJECT_NAME: str = "API de Reservas"

    # No hay valores de respaldo para datos sensibles: un despliegue incompleto
    # debe fallar al arrancar en vez de usar credenciales conocidas.
    DATABASE_URL: str

    # Seguridad JWT
    SECRET_KEY: str
    ALGORITHM: Literal["HS256"] = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas

    # Solo son necesarios al ejecutar manualmente `python -m app.seed`.
    ADMIN_EMAIL: str | None = None
    ADMIN_PASSWORD: str | None = None

    # Desarrollo local seguro por defecto. Producción exige orígenes HTTPS.
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        secret = value.strip()
        if len(secret) < 32:
            raise ValueError("SECRET_KEY debe tener al menos 32 caracteres")
        return secret

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        database_url = value.strip()
        if not database_url:
            raise ValueError("DATABASE_URL no puede estar vacío")
        return database_url

    @field_validator("CORS_ORIGINS")
    @classmethod
    def normalize_cors_origins(cls, origins: list[str]) -> list[str]:
        normalized = [origin.strip().rstrip("/") for origin in origins]
        if not all(
            origin.startswith(("http://", "https://"))
            for origin in normalized
        ):
            raise ValueError("CORS_ORIGINS solo admite orígenes HTTP o HTTPS")
        return normalized

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.ENVIRONMENT != "production":
            return self

        database_url = self.DATABASE_URL.lower()
        if not database_url.startswith(("postgresql://", "postgres://")):
            raise ValueError("Producción requiere PostgreSQL")
        if "sslmode=require" not in database_url:
            raise ValueError("DATABASE_URL debe exigir sslmode=require en producción")

        if not self.CORS_ORIGINS:
            raise ValueError("Producción requiere al menos un origen CORS")
        if any(
            origin == "*"
            or not origin.startswith("https://")
            or "localhost" in origin
            for origin in self.CORS_ORIGINS
        ):
            raise ValueError("Producción solo admite orígenes CORS HTTPS explícitos")

        insecure_prefixes = ("dev-", "change-", "replace-", "cambia-")
        if self.SECRET_KEY.lower().startswith(insecure_prefixes):
            raise ValueError("SECRET_KEY usa un valor de desarrollo")
        if self.ADMIN_PASSWORD and self.ADMIN_PASSWORD.lower().startswith(
            insecure_prefixes
        ):
            raise ValueError("ADMIN_PASSWORD usa un valor de desarrollo")
        if self.ADMIN_PASSWORD and len(self.ADMIN_PASSWORD) < 12:
            raise ValueError("ADMIN_PASSWORD debe tener al menos 12 caracteres")

        return self


settings = Settings()
