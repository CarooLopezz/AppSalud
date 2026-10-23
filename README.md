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

La app queda en **https://localhost**. Es la única puerta de entrada: el nginx del frontend sirve la app y reenvía `/api/users`, `/api/estudios` y `/api/recetas` a cada servicio. Los servicios no publican sus puertos (3001-3003), así que desde afuera de Docker solo se llega a ellos por HTTPS. Si entrás por `http://localhost`, te redirige a HTTPS.

El certificado es autofirmado y se genera solo la primera vez. Por eso el navegador avisa que la conexión "no es privada": tocá **Configuración avanzada → Continuar a localhost**.

Dentro de Docker cada servicio recibe `PORT` y `MONGO_URI` (`mongodb://mongo:27017/appsalud_<servicio>`) como variables de entorno. `users-service` y `estudios-service` además reciben `JWT_SECRET`: se toma de un `.env` en la raíz del proyecto, o usa `clave_de_desarrollo` si no existe (solo para desarrollo).

## Seguridad: HTTPS y Wireshark
Con HTTPS, la contraseña del login y el token viajan cifrados: en Wireshark solo se ve "TLS Application Data". En la base, las contraseñas se guardan encriptadas con bcrypt.

**Test automático** (con la app levantada en Docker y Wireshark instalado). Captura el tráfico mientras se registra un usuario, hace login y pide sus estudios, y verifica que ni la contraseña, ni el email, ni el token aparezcan en la captura. También verifica que por HTTP solo haya una redirección y que los puertos 3001-3003 estén cerrados:

```
node --test tests/wireshark.test.mjs
```

**Para verlo a mano en Wireshark:** elegí la interfaz *Adapter for loopback traffic capture*, filtrá con `tcp.port == 443`, hacé login en https://localhost y fijate que los paquetes digan *TLS* y *Application Data*, sin ningún `POST /auth/login` legible.

> Ojo: con `npm run start:dev` (sin Docker) los servicios siguen en `http://localhost:3001-3003` y ahí la contraseña **sí** se ve. Eso es solo para desarrollar; la entrega y la demo se hacen con Docker.

## Logs de errores
Los tres servicios anotan cada error en el log con su servicio, ruta y motivo (`src/common/todos-los-errores.filter.ts`):

- **4xx** (error del que hizo el pedido: datos inválidos, sin token, no existe) → `WARN`, por ejemplo `POST /auth/login → 401: Credenciales inválidas`.
- **5xx** (error del servidor) → `ERROR`, con el detalle completo. Al usuario solo le llega "Error interno del servidor".
- También se anotan los errores de GraphQL (recetas-service) y los que pasan fuera de un pedido (promesas sin `catch`).
- **Nunca** se anotan el cuerpo del pedido, los headers ni la query: en los logs no quedan contraseñas, tokens ni emails.

Para verlos con Docker:

```
docker compose logs -f users-service estudios-service recetas-service
```

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

Tests del seed (necesitan Mongo en `localhost:27017` o en `MONGO_URL`; usan bases propias que se borran al terminar):

```bash
cd seed && npm test
```
