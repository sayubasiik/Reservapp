"""
Configuración centralizada. Lee variables de entorno desde .env
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "API de Reservas"

    # Base de datos: local por defecto, en Azure usa la cadena de conexión
    # de Azure Database for PostgreSQL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/reservas"

    # Seguridad JWT
    SECRET_KEY: str = "cambia-esto-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas

    # CORS: agrega aquí la URL de tu frontend en Azure
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
