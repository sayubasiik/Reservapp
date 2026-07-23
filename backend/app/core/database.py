"""
Configuración de SQLAlchemy y conexión a base de datos.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

connect_args = (
    {"check_same_thread": False}
    if settings.DATABASE_URL.startswith("sqlite")
    else {}
)
# Motor y sesión
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,  # Cambiar a True para ver queries SQL
    pool_pre_ping=True,  # Verifica conexiones antes de usar
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para todos los modelos
Base = declarative_base()


def get_db():
    """Dependency para obtener sesión de BD en cada request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
