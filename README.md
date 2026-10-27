# AppSalud – Agenda personal de salud

AppSalud es una aplicación web para que cada persona tenga **su información de salud en un solo lugar**: sus estudios médicos, sus recetas y medicamentos, los datos de sus médicos y sus turnos. Cada usuario entra con su cuenta y solo ve lo suyo.

Integrantes: Adriana Antunes (Usuarios, Médicos y Agenda), Iara Fernández (Estudios), Lara Magallanes (Recetas), Carolina López (Infraestructura, tests y entrega).

## Qué hace
- **Cuentas:** registro e inicio de sesión con contraseña encriptada (bcrypt) y token JWT.
- **Médicos:** directorio de los profesionales registrados.
- **Agenda:** turnos entre pacientes y médicos.
- **Estudios:** cada paciente guarda y consulta sus estudios médicos.
- **Recetas:** recetas y medicamentos, con archivo adjunto y alertas de recetas por vencer.

## Arquitectura
Son tres microservicios (NestJS + MongoDB) y un frontend (React + Vite). En producción, todo pasa por un único punto de entrada HTTPS (ver [Seguridad](#seguridad-https-y-wireshark)).

| Parte | Tecnología | Puerto (sin Docker) |
|---|---|---|
| users-service (usuarios, médicos, agenda, login) | NestJS REST | 3001 |
| estudios-service | NestJS REST | 3002 |
| recetas-service | NestJS GraphQL | 3003 |
| frontend | React + Vite | 5173 |
| mongo | MongoDB | 27017 |

## Cómo empezar (desarrollo)
1. Clonar el repo y pasarse a dev: `git checkout dev`
2. Crear tu rama: `git checkout -b tu-nombre/tu-modulo`
3. Instalar en tu carpeta y en `frontend`: `npm install`
4. Levantar Mongo: `docker compose up -d mongo`
5. Correr tu servicio: `npm run start:dev` (y el frontend con `npm run dev`)

> En este modo los servicios quedan en `http://localhost:3001-3003`. Es solo para desarrollar; **la demo y la entrega se hacen con Docker** (HTTPS).

## Levantar todo con Docker
Requiere Docker Desktop abierto.

```bash
docker compose up -d --build   # construye y levanta mongo, los 3 servicios y el frontend
docker compose ps              # ver estado
docker compose logs -f users-service
docker compose down            # apagar (agregar -v para borrar los datos de Mongo)
```

La app queda en **https://localhost**. Es la única puerta de entrada: el nginx del frontend sirve la app y reenvía `/api/users`, `/api/estudios` y `/api/recetas` a cada servicio. Los servicios no publican sus puertos (3001-3003), así que desde afuera de Docker solo se llega a ellos por HTTPS. Si entrás por `http://localhost`, te redirige a HTTPS.

El certificado es autofirmado y se genera solo la primera vez. Por eso el navegador avisa que la conexión "no es privada": tocá **Configuración avanzada → Continuar a localhost** (o usá [mkcert](#certificado-de-confianza-candado-en-el-navegador) para el candado).

Dentro de Docker cada servicio recibe `PORT` y `MONGO_URI` (`mongodb://mongo:27017/appsalud_<servicio>`) como variables de entorno. `users-service` y `estudios-service` además reciben `JWT_SECRET`: se toma de un `.env` en la raíz del proyecto, o usa `clave_de_desarrollo` si no existe (solo para desarrollo).

Para cargar datos de ejemplo, ver [Datos de ejemplo (seed)](#datos-de-ejemplo-seed).

## Seguridad: HTTPS y Wireshark
Con HTTPS, la contraseña del login y el token viajan cifrados: en Wireshark solo se ve "TLS Application Data". En la base, las contraseñas se guardan encriptadas con bcrypt.

**Test automático** (con la app levantada en Docker y Wireshark instalado). Captura el tráfico mientras se registra un usuario, hace login y pide sus estudios, y verifica que ni la contraseña, ni el email, ni el token aparezcan en la captura. También verifica que por HTTP solo haya una redirección y que los puertos 3001-3003 estén cerrados:

```
node --test tests/wireshark.test.mjs
```

**Para verlo a mano en Wireshark:** elegí la interfaz *Adapter for loopback traffic capture*, filtrá con `tcp.port == 443`, hacé login en https://localhost y fijate que los paquetes digan *TLS* y *Application Data*, sin ningún `POST /auth/login` legible.

> Ojo: con `npm run start:dev` (sin Docker) los servicios siguen en `http://localhost:3001-3003` y ahí la contraseña **sí** se ve.

### Certificado de confianza (candado en el navegador)
Sin esto, la conexión igual está cifrada, pero el navegador muestra "No seguro" porque el certificado es autofirmado. Con [mkcert](https://github.com/FiloSottile/mkcert) se crea un certificado que tu compu reconoce como de confianza. Se hace **una vez por compu**, en PowerShell, desde la raíz del proyecto:

```
winget install FiloSottile.mkcert
mkcert -install
mkdir certs
mkcert -cert-file certs/server.crt -key-file certs/server.key localhost 127.0.0.1 ::1
docker compose restart frontend
```

- `winget install`: después de instalarlo, abrí una terminal nueva para que reconozca el comando `mkcert`.
- `mkcert -install`: Windows pregunta si confiás en la autoridad "mkcert": aceptá. Queda solo en tu compu.
- La carpeta `certs/` no se sube a GitHub. Si está vacía, nginx genera el certificado autofirmado como antes.
- Después de reiniciar, cerrá y volvé a abrir el navegador y entrá a https://localhost: tiene que aparecer el candado.

### Límite de intentos (fuerza bruta)
Para que nadie pueda adivinar una contraseña probando miles de veces, `users-service` limita los intentos de `/auth/login` y `/auth/register`. Pasado el límite, responde **429 "Too many requests"** y hay que esperar.

- Por defecto: **5 intentos por minuto** por IP. Se cambia con `THROTTLE_LIMIT` y `THROTTLE_TTL` (ms).
- Detrás de nginx, el límite cuenta por la IP real de cada cliente (`trust proxy`), no a todos juntos.

**Un ataque de fuerza bruta** sería mandar muchos intentos de login seguidos. Para verlo, con la app en Docker (PowerShell):

```
'{"email":"ana@appsalud.com","password":"mala"}' | Out-File -Encoding ascii "$env:TEMP\brute.json"
1..7 | ForEach-Object { curl.exe -k -s -o NUL -w "%{http_code}`n" -X POST https://localhost/api/users/auth/login -H "Content-Type: application/json" --data "@$env:TEMP\brute.json" }
```

Los primeros intentos dan `401` (contraseña incorrecta) y a partir del sexto dan `429`: el servidor dejó de aceptarlos.

> Wireshark **no** hace este ataque: solo observa el tráfico. El ataque lo manda otra herramienta o un script; Wireshark sirve para ver que, aun así, la contraseña viaja cifrada.

## Módulos

### Usuarios y médicos (users-service)
- Registro: `POST /auth/register` con `nombre`, `email` y `password` (mínimo 6 caracteres). Los registros públicos tienen el rol `paciente`.
- Inicio de sesión: `POST /auth/login`; devuelve `access_token` (JWT).
- Directorio: `GET /users/medicos` requiere `Authorization: Bearer <access_token>` y devuelve nombre y correo de las cuentas con rol `medico`.

### Agenda (users-service)
- La agenda está en `/agenda` y requiere iniciar sesión.
- Los pacientes solicitan turnos, consultan los propios, modifican solicitudes pendientes y cancelan turnos. Los médicos consultan sus turnos y los confirman o cancelan.
- Endpoints protegidos: `GET /appointments`, `GET /appointments/:id`, `POST /appointments`, `PATCH /appointments/:id`, `PATCH /appointments/:id/estado` y `DELETE /appointments/:id`.
- No se permite reservar un horario ya ocupado para el mismo médico; los turnos cancelados se conservan para auditoría.

### Estudios (estudios-service)
- API REST protegida con JWT: `POST /estudios`, `GET /estudios`, `GET /estudios/:id`, `PATCH /estudios/:id`, `DELETE /estudios/:id`.
- Cada estudio queda a nombre del usuario del token: **un usuario solo ve, edita y elimina los suyos**.
- Guarda tipo, especialidad, médico, fecha, resultado, notas y próximo control.

### Recetas (recetas-service)
- API GraphQL en `/graphql`. Consultas: `recetas`, `receta(id)`, `recetasPorVencer`, `medicamentos`, `medicamento(id)`. Mutaciones: `crearReceta`, `actualizarReceta`, `eliminarReceta`, y las de medicamentos.
- Cada receta se relaciona con un medicamento y puede llevar un archivo adjunto (PDF, JPG o PNG).
- `recetasPorVencer` devuelve las recetas que vencen dentro de los próximos 3 días.

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

## Tests
Desde la carpeta de cada parte (en PowerShell, un comando por línea). Los e2e necesitan Mongo en `localhost:27017` (por ejemplo `docker compose up -d mongo`) y usan bases `appsalud_test_*`, separadas de las reales.

| Qué | Dónde | Comando |
|---|---|---|
| Unitarios de un servicio | `users-service`, `estudios-service`, `recetas-service` | `npm test` |
| E2E de un servicio (levantan el servicio y le hacen pedidos) | ídem | `npm run test:e2e` |
| Pantallas y navegación del frontend | `frontend` | `npm test` |
| Seed | `seed` | `npm test` |
| Tráfico de red / Wireshark (con la app en Docker) | raíz del proyecto | `node --test tests/wireshark.test.mjs` |

Qué cubren:
- **Usuarios y médicos:** registro y login (contraseña nunca devuelta y guardada con bcrypt, email repetido, datos inválidos, credenciales incorrectas, límite de intentos) y `GET /users/medicos` (protección con token; solo médicos, ordenados y sin contraseña; nadie se registra como médico).
- **Estudios:** CRUD con protección por token y, sobre todo, aislamiento entre usuarios (nadie ve ni toca los estudios de otro).
- **Recetas:** CRUD por GraphQL, relación con medicamentos, archivo adjunto y alertas de recetas por vencer.
- **Frontend:** inicio y navegación, rutas protegidas, directorio de médicos, y los flujos de login y registro (mensajes de error, cerrar sesión).
- **Seed:** que cargue todo, que no duplique, contraseñas con bcrypt y relaciones correctas.
- **Red (Wireshark):** la contraseña y el token viajan cifrados; los puertos internos están cerrados.

## Frontend
`cd frontend && npm run dev` → http://localhost:5173

- `src/App.tsx`: rutas; estudios, recetas, perfil, agenda y el directorio de médicos requieren sesión.
- `src/components/Layout.tsx`: barra de navegación y pie, comunes a todas las pantallas.
- `src/pages/`: pantallas de inicio, registro, inicio de sesión, directorio de médicos y agenda.
- `src/api/clients.ts`: `usersApi`, `estudiosApi` y `recetasApi` (axios). Si hay un token en `localStorage` (`appsalud_token`) lo mandan solo como `Authorization: Bearer`. Las URLs se cambian con un `.env` (ver `frontend/.env.example`).
- Estilos en `src/index.css`, con los colores como variables en `:root` (tiene modo oscuro).
