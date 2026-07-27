# Usa imagen oficial de Python
FROM python:3.11-slim

# Establece directorio de trabajo
WORKDIR /app

# Copia requirements
COPY requirements.txt .

# Instala dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copia código de la app
COPY . .

# Expone puerto
EXPOSE 8000

# Comando para correr la app con gunicorn + uvicorn workers
CMD alembic upgrade head && exec gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
