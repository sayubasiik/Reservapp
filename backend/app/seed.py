"""
Script de prueba de los datos.
Crear un usuario admin y recursos de ejemplo si no existen.
Ejecutar desde la carpeta backend/ con el venv activo:
    python -m app.seed
Se puede correr varias veces sin duplicar datos.

"""

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.user import User
from app.models.resource import Resource
from app.models.reservation import Reservation  # noqa: F401 (registra la tabla)

def seed():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        #---Usuario admin----
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if admin:
            print(f"El admin ya existe: {admin.email}")
        else:
            admin = User(
                full_name="Administrator",
                email=settings.ADMIN_EMAIL,
                hashed_password = hash_password(settings.ADMIN_PASSWORD),
                role = "admin",
            )
            db.add(admin)
            db.commit()
            print(f"Admin creado correctamente : {settings.ADMIN_EMAIL}")
            
        if db.query(Resource).count() > 0:
            print("Ya existen recursos, no se crean ejemplos")
        else:
            ejemplos = [
                Resource(
                    name="Sala de Juntas A",
                    description="Sala con proyector y pizarrón, ideal para juntas",
                    category="Sala",
                    capacity=10,
                    price_per_hour=150,
                ),
                Resource(
                    name="Cancha de Fútbol Rápido",
                    description="Cancha techada con iluminación nocturna",
                    category="cancha",
                    capacity=12,
                    price_per_hour=300,
                ),
                Resource(
                    name="Mesa 5 - Terraza",
                    description="Mesa para 4 personas en zona de terraza",
                    category="Sesa",
                    capacity=4,
                    price_per_hour=0,
                ),
            ]
            db.add_all(ejemplos)
            db.commit()
            print(f"{len(ejemplos)} recursos de ejemplo creados")

        print("\n Seed completado")
    finally:
        db.close()


if __name__ == "__main__":
    seed()