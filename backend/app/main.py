"""
Punto de entrada de la aplicación de Reservas.
Ejecutar con: uvicorn app.main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.routers import auth, businesses, reservations, resources, users

# Crear tablas al iniciar (en producción usa Alembic para migraciones)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="API de reservas en general — proyecto integrador",
)

# CORS: permite que el frontend (React) consuma la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(users.router, prefix="/api/users", tags=["Usuarios"])
app.include_router(businesses.router, prefix="/api/businesses",tags=["Negocios"])
app.include_router(resources.router, prefix="/api/resources", tags=["Recursos"])
app.include_router(reservations.router, prefix="/api/reservations", tags=["Reservas"])


@app.get("/", tags=["Health"])
def health_check():
    """Endpoint de salud — útil para Azure App Service."""
    return {"status": "ok", "app": settings.PROJECT_NAME}
