# Línea base y configuración segura — 3 de agosto de 2026

## Punto recuperable

- `production`: `049d49510782d436cf49c198f9746682390533aa`
- Rama de respaldo: `backup/production-post-pr15-2026-08-03`
- Tag: `baseline-production-2026-08-03`
- Rama de trabajo: `chore/stabilize-security-config`

Este commit corresponde al estado posterior al PR #15 y al smoke test exitoso
del frontend y backend desplegados en Azure. La rama de trabajo parte directamente
de ese commit y no modifica `production`.

## Línea base verificada

- Backend: 34 pruebas aprobadas antes de los cambios.
- Frontend: `npm ci`, `npm run lint` y `npm run build` aprobados.
- Azure frontend: HTTP 200 en la pantalla pública.
- Azure backend: HTTP 200 en el endpoint de salud.
- CORS: el frontend de Azure es aceptado y un origen externo es rechazado.
- PostCSS: dependencia transitiva actualizada de 8.5.20 a 8.5.25.

Las migraciones tienen una sola cabeza y están ordenadas así:

1. `ac4b2d7d5bed` — esquema inicial.
2. `304310cc3e91` — negocios y propiedad de recursos.

La segunda migración usa SQL de PostgreSQL y no debe validarse con SQLite. La
prueba completa de `alembic upgrade head` queda reservada para un PostgreSQL
local o de QA; nunca se debe ejecutar contra Azure sin respaldo y coordinación.

## Variables requeridas antes de fusionar o desplegar

Configurar en Azure App Service, sin escribir valores reales en Git:

- `ENVIRONMENT=production`
- `DATABASE_URL`: PostgreSQL y `sslmode=require`.
- `SECRET_KEY`: valor aleatorio de 32 caracteres o más.
- `CORS_ORIGINS`: arreglo JSON con la URL HTTPS exacta del frontend.
- `ADMIN_EMAIL` y `ADMIN_PASSWORD`: solo si se ejecutará manualmente el seed.

En GitHub Actions deben existir `ACR_USERNAME`, `ACR_PASSWORD` y
`VITE_API_URL`. No copiar sus valores a archivos, logs, issues o PRs.

## Auditoría de dependencias

`npm audit` conserva dos alertas moderadas de React Router 6.30.4. Se revisaron
los usos de `navigate`, `Navigate` y rutas dinámicas: la aplicación no pasa URLs
externas ni parámetros de consulta sin validar a esas APIs, y no usa SSR.

Referencias: [GHSA-wrjc-x8rr-h8h6](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6)
y [GHSA-jjmj-jmhj-qwj2](https://github.com/remix-run/react-router/security/advisories/GHSA-jjmj-jmhj-qwj2).

La línea 6.x no tiene parche. React Router 7.18.1 corrige esas alertas y compiló
correctamente en un ensayo aislado, pero introduce una alerta alta asociada al
modo RSC, que ReservApp tampoco usa. Para no combinar una migración mayor con
este bloque de configuración antes de la presentación, no se actualiza React
Router en esta rama. CI sí bloqueará nuevas vulnerabilidades altas o críticas
en dependencias de producción mediante `npm audit --omit=dev --audit-level=high`.

## Resultado de esta rama

- Backend: 41 pruebas aprobadas y dependencias consistentes con `pip check`.
- Configuración tipo producción: validada con PostgreSQL, SSL y el origen Azure.
- Alembic: una sola cabeza (`304310cc3e91`) y dos revisiones ordenadas.
- Frontend: instalación limpia, auditoría sin alertas altas/críticas, lint y build.
- Azure público: registro y recuperación cargan; `/inicio` sin sesión redirige a
  `/bienvenida`; no se enviaron formularios ni se alteraron datos.

## Validación y reversión

Antes del merge:

```bash
cd backend
python -m pytest

cd ../frontend
npm ci
npm run lint
npm run build
```

Después del despliegue, repetir health check, login por cada rol y los smoke
tests de negocios, recursos, reservaciones, dashboard y PDF.

Si el nuevo contenedor no inicia por configuración, restaurar la imagen del
commit `049d495` y revisar las variables anteriores. No usar `alembic stamp`,
`downgrade` ni modificar la base de Azure durante esa reversión.
