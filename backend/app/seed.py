"""
Crea un administrador, un negocio y recursos de demostración.

Ejecutar desde backend/ con el entorno virtual activo:
    python -m app.seed

Puede ejecutarse varias veces sin duplicar datos.
"""

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.business import Business
from app.models.reservation import Reservation  # noqa: F401
from app.models.resource import Resource
from app.models.user import User


DEMO_OWNER_EMAIL = "owner.demo@reservapp.local"
DEMO_BUSINESS_NAME = "ReservApp Demo"


def seed():
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        raise RuntimeError(
            "Define ADMIN_EMAIL y ADMIN_PASSWORD antes de ejecutar el seed"
        )

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        admin = db.query(User).filter(
            User.email == settings.ADMIN_EMAIL
        ).first()

        if admin:
            print(f"El administrador ya existe: {admin.email}")
        else:
            admin = User(
                full_name="Administrator",
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role="admin",
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"Administrador creado: {admin.email}")

        owner = db.query(User).filter(
            User.email == DEMO_OWNER_EMAIL
        ).first()

        if not owner:
            owner = User(
                full_name="Propietario Demo",
                email=DEMO_OWNER_EMAIL,
                hashed_password=hash_password("DemoPassword123"),
                role="business_owner",
            )
            db.add(owner)
            db.commit()
            db.refresh(owner)
            print(f"Propietario de demostración creado: {owner.email}")

        business = db.query(Business).filter(
            Business.name == DEMO_BUSINESS_NAME,
            Business.owner_id == owner.id,
        ).first()

        if not business:
            business = Business(
                owner_id=owner.id,
                name=DEMO_BUSINESS_NAME,
                description="Negocio de demostración de ReservApp",
                category="Servicios",
                address="Aguascalientes, México",
            )
            db.add(business)
            db.commit()
            db.refresh(business)
            print(f"Negocio de demostración creado: {business.name}")

        orphan_resources = db.query(Resource).filter(
            Resource.business_id.is_(None)
        ).all()

        for resource in orphan_resources:
            resource.business_id = business.id

        if orphan_resources:
            db.commit()
            print(
                f"{len(orphan_resources)} recursos existentes "
                "fueron asociados al negocio de demostración"
            )

        if db.query(Resource).count() > 0:
            print("Ya existen recursos; no se crean ejemplos adicionales")
        else:
            examples = [
                Resource(
                    business_id=business.id,
                    name="Sala de Juntas A",
                    description="Sala con proyector y pizarrón",
                    category="Sala",
                    capacity=10,
                    price_per_hour=150,
                ),
                Resource(
                    business_id=business.id,
                    name="Cancha de Fútbol Rápido",
                    description="Cancha techada con iluminación nocturna",
                    category="Cancha",
                    capacity=12,
                    price_per_hour=300,
                ),
                Resource(
                    business_id=business.id,
                    name="Mesa 5 - Terraza",
                    description="Mesa para cuatro personas",
                    category="Mesa",
                    capacity=4,
                    price_per_hour=0,
                ),
            ]
            db.add_all(examples)
            db.commit()
            print(f"{len(examples)} recursos de ejemplo creados")

        print("\nSeed completado")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
