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

- `src/App.tsx`: rutas; estudios, recetas, perfil y el directorio de médicos requieren sesión.
- `src/components/Layout.tsx`: barra de navegación y pie, comunes a todas las pantallas.
- `src/pages/`: pantallas de inicio, registro, inicio de sesión y directorio de médicos.
- `src/api/clients.ts`: `usersApi`, `estudiosApi` y `recetasApi` (axios). Si hay un token en `localStorage` (`appsalud_token`) lo mandan solo como `Authorization: Bearer`. Las URLs se cambian con un `.env` (ver `frontend/.env.example`).
- Estilos en `src/index.css`, con los colores como variables en `:root` (tiene modo oscuro).

## Usuarios y médicos
- Registro: `POST /auth/register` con `nombre`, `email` y `password` (mínimo 6 caracteres). Los registros públicos tienen el rol `paciente`.
- Inicio de sesión: `POST /auth/login`; devuelve `access_token`.
- Directorio: `GET /users/medicos` requiere `Authorization: Bearer <access_token>` y devuelve nombre y correo de las cuentas con rol `medico`.
- Para ejecutar las pruebas del frontend: `cd frontend && npm test`. Para las del servicio de usuarios: `cd users-service && npm test`.
