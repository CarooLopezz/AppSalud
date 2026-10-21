# AppSalud – Agenda personal de salud

Integrantes: Adriana Antunes (Usuarios y Médicos), Iara Fernández (Estudios), Lara Magallanes (Recetas), Carolina López (Infraestructura)

## Cómo empezar
1. Clonar el repo y pasarse a dev: `git checkout dev`
2. Crear tu rama: `git checkout -b tu-nombre/tu-modulo`
3. Instalar en tu carpeta y en frontend: `npm install`
4. Levantar Mongo: `docker compose up -d mongo`
5. Correr tu servicio: `npm run start:dev`

| Servicio | Puerto |
|---|---|
| users-service | 3001 |
| estudios-service | 3002 |
| recetas-service | 3003 |
| frontend | 5173 |
| mongo | 27017 |

## Levantar todo con Docker
Requiere Docker Desktop abierto.

```bash
docker compose up -d --build   # construye y levanta mongo, los 3 servicios y el frontend
docker compose ps              # ver estado
docker compose logs -f users-service
docker compose down            # apagar (agregar -v para borrar los datos de Mongo)
```

Dentro de Docker cada servicio recibe `PORT` y `MONGO_URI` (`mongodb://mongo:27017/appsalud_<servicio>`) como variables de entorno. `users-service` además recibe `JWT_SECRET`: se toma de un `.env` en la raíz del proyecto, o usa `clave_de_desarrollo` si no existe (solo para desarrollo).

## Frontend
`cd frontend && npm run dev` → http://localhost:5173

- `src/App.tsx`: rutas. Cada módulo reemplaza su `<EnConstruccion />` por su página real.
- `src/components/Layout.tsx`: barra de navegación y pie, comunes a todas las pantallas.
- `src/pages/`: una página por pantalla (`Inicio.tsx` ya está hecha).
- `src/api/clients.ts`: `usersApi`, `estudiosApi` y `recetasApi` (axios). Si hay un token en `localStorage` (`appsalud_token`) lo mandan solo como `Authorization: Bearer`. Las URLs se cambian con un `.env` (ver `frontend/.env.example`).
- Estilos en `src/index.css`, con los colores como variables en `:root` (tiene modo oscuro).

## Datos de ejemplo (seed)
Carga usuarios, medicamentos, estudios y recetas de ejemplo para probar la app. Se puede correr varias veces: no duplica nada, actualiza los usuarios y medicamentos de ejemplo y reemplaza sus estudios y recetas.

```bash
# Con Docker (con mongo levantado)
docker compose run --rm seed

# Sin Docker (con un Mongo local en localhost:27017)
cd seed && npm install && npm run seed
```

Usuarios de ejemplo, todos con contraseña `demo1234`:

| Email | Rol | Tiene |
|---|---|---|
| ana@appsalud.com | paciente | 3 estudios, 2 recetas |
| juan@appsalud.com | paciente | 2 estudios, 2 recetas |
| laura.mendez@appsalud.com | medico | — |

Carga en las mismas bases que usa el docker-compose: `appsalud_users`, `appsalud_estudios` y `appsalud_recetas`. Si corrés los servicios sin Docker, usá esos mismos nombres en su `MONGO_URI`, o cambialos en el seed con `MONGO_URL`, `USERS_DB`, `ESTUDIOS_DB` y `RECETAS_DB`.
