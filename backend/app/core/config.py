"""
Configuración centralizada. Lee variables de entorno desde .env
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    PROJECT_NAME: str = "API de Reservas"

    # Base de datos: local por defecto, en Azure usa la cadena de conexión
    # de Azure Database for PostgreSQL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/reservas"

    # Seguridad JWT
    SECRET_KEY: str = "cambia-esto-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas
    
    ADMIN_EMAIL: str = "admin@reservas.com"
    ADMIN_PASSWORD: str = "admin123"

    # CORS: agrega aquí la URL de tu frontend en Azure
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()
