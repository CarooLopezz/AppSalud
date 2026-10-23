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

## Frontend
`cd frontend && npm run dev` → http://localhost:5173

- `src/App.tsx`: rutas. Cada módulo reemplaza su `<EnConstruccion />` por su página real.
- `src/components/Layout.tsx`: barra de navegación y pie, comunes a todas las pantallas.
- `src/pages/`: una página por pantalla (`Inicio.tsx` ya está hecha).
- `src/api/clients.ts`: `usersApi`, `estudiosApi` y `recetasApi` (axios). Si hay un token en `localStorage` (`appsalud_token`) lo mandan solo como `Authorization: Bearer`. Las URLs se cambian con un `.env` (ver `frontend/.env.example`).
- Estilos en `src/index.css`, con los colores como variables en `:root` (tiene modo oscuro).
