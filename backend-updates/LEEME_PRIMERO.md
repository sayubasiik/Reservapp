# ReservVap — Kit de actualización del proyecto

Este paquete alinea el código existente (backend de FastAPI) con los mockups
(plataforma multi-negocio) y con la rúbrica de Diseño de Interfaces.

## Contenido

```
reservvap-kit/
├── docker-compose.yml        ← NUEVO: orquesta db + api + web
├── backend-updates/          ← Archivos que REEMPLAZAN/AGREGAN al repo del backend
│   └── app/
│       ├── models/           ← user.py y reservation.py REEMPLAZAN los existentes
│       │                        business.py, service.py, business_hours.py son NUEVOS
│       │                        (resource.py se ELIMINA)
│       ├── services/reservation_service.py  ← REEMPLAZA (horarios + lock anti-carrera)
│       └── routers/businesses.py            ← NUEVO (incluye /availability)
├── frontend/                 ← NUEVO: esqueleto React+TS+Vite alineado a la rúbrica
└── docs/GUIA_DE_ESTILOS.md   ← NUEVO: cubre el 10% de "Documentación de diseños"
```

## Cómo aplicar los cambios del backend

1. Copiar los archivos de `backend-updates/app/` sobre el repo, respetando rutas.
2. **Eliminar** `app/models/resource.py`, `app/schemas/resource.py`, `app/routers/resources.py`.
3. Actualizar `app/main.py`: quitar el router de resources y registrar:
   ```python
   from app.routers import businesses
   app.include_router(businesses.router, prefix="/api/businesses", tags=["Negocios"])
   ```
4. **Trabajo del equipo (no incluido a propósito — se los van a preguntar):**
   - Schemas Pydantic: `BusinessCreate/Out`, `ServiceCreate/Out`, `BusinessHoursIn`,
     `ReservationCreate/Out`
   - Router de services (CRUD bajo `/api/businesses/{id}/services`, solo owner)
   - Router de business_hours (`GET/PUT /api/businesses/{id}/hours`, solo owner)
   - Actualizar `reservations.py` para usar la nueva firma de `create_reservation`
   - Registro con selección de rol (`customer` | `business_owner`)
   - Migraciones con Alembic (sustituir `create_all`)

## Cómo levantar todo

```bash
# En la raíz del repo (donde está docker-compose.yml):
docker compose up --build
# API:      http://localhost:8000/docs
# Frontend: http://localhost:5173
```

## Decisiones a comunicar al profesor (sección "Limitations" de la presentación)

- **Pago simulado:** por seguridad (PCI-DSS) no se capturan tarjetas reales;
  el flujo ofrece "Pagar en el lugar". Integración con Stripe test = trabajo futuro.
- **Staff individual** (barbero asignado), **mensajes** y **galería**: fuera de alcance
  de esta versión; el modelo lo permite como extensión futura.
- **Reseñas y favoritos:** se implementan solo si el cronograma lo permite (semana 4).

## Reparto sugerido (equipo de 4)

| Rol | Semana 2 | Semana 3 | Semana 4 |
|---|---|---|---|
| A (backend) | Schemas + routers faltantes | Endpoint availability afinado | Tests pytest |
| B (backend/infra) | Alembic + docker-compose | Seed de datos demo | CI GitHub Actions |
| C (frontend) | Páginas de auth + Home | Flujo de reserva 5 pasos | Responsive + estados de error |
| D (frontend) | Cards + navegación | Mis Reservas + Dashboard | Guía de estilos final + presentación EN |

**Regla de la rúbrica:** el profesor pregunta a CUALQUIERA sobre CUALQUIER parte.
Reservar 1 día de la semana 4 para walkthrough cruzado de código.
