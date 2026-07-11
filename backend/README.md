# Backend - Sistema de Reservas

API REST construida con **FastAPI + SQLAlchemy** para gestionar reservas en general.

## 🚀 Requisitos previos

- **Python 3.11+**
- **PostgreSQL 12+** (local o en Azure)
- **Git**

## 📦 Instalación local

### 1. Crear entorno virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

```bash
# Copiar template
cp .env.example .env

# Editar .env con tu BD
# DATABASE_URL=postgresql://usuario:password@localhost:5432/reservas
```

### 4. Crear base de datos (si usas PostgreSQL local)

```bash
psql -U postgres
CREATE DATABASE reservas;
\q
```

### 5. Ejecutar servidor

```bash
uvicorn app.main:app --reload
```

Abre http://localhost:8000/docs para la documentación interactiva (Swagger).

---

## 📋 Endpoints principales

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| **POST** | `/api/auth/register` | Registrar usuario | No |
| **POST** | `/api/auth/login` | Login (devuelve JWT) | No |
| **GET** | `/api/users/me` | Mi perfil | Sí |
| **GET** | `/api/resources` | Listar recursos | No |
| **GET** | `/api/resources/{id}/availability` | Consultar disponibilidad | No |
| **POST** | `/api/resources` | Crear recurso | Admin |
| **POST** | `/api/reservations` | Crear reserva | Sí |
| **GET** | `/api/reservations/me` | Mis reservas | Sí |
| **DELETE** | `/api/reservations/{id}` | Cancelar reserva | Sí |

---

## 🧪 Próximos pasos

- [ ] Implementar **Alembic** para migraciones de BD profesionales
- [ ] Agregar **pytest** con test suite completa
- [ ] Paginación en listados
- [ ] Manejo de zonas horarias
- [ ] Deploy a Azure App Service

---

## 🐳 Docker (para producción)

```bash
# Construir imagen
docker build -t reservas-api .

# Correr contenedor
docker run -p 8000:8000 --env-file .env reservas-api
```

---

## 📚 Estructura de carpetas

```
backend/
├── app/
│   ├── main.py                    # Entrada de FastAPI
│   ├── core/
│   │   ├── config.py              # Config de entorno
│   │   ├── database.py            # SQLAlchemy
│   │   └── security.py            # JWT, hashing
│   ├── models/                    # Tablas SQLAlchemy
│   ├── schemas/                   # Validación Pydantic
│   ├── routers/                   # Endpoints agrupados
│   └── services/                  # Lógica de negocio
├── requirements.txt               # Dependencias
├── .env.example                   # Template de env vars
├── Dockerfile                     # Para containerizar
└── README.md                      # Este archivo
```

---

## ✅ Regla de negocio crítica: Anti-traslapes

**No se permite que dos reservas se traslapen en el mismo recurso.**

Fórmula: `traslape = (inicio_existente < fin_nuevo) AND (fin_existente > inicio_nuevo)`

Si hay traslape → HTTP 409 Conflict.

---

## 🤝 Contribuir

1. Crea una rama: `git checkout -b feature/nombre`
2. Haz cambios y commit: `git commit -m "Descripción"`
3. Push: `git push origin feature/nombre`
4. Abre un Pull Request

---

## 📝 Licencia

MIT
