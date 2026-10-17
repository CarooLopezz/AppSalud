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

Dentro de Docker cada servicio recibe `PORT` y `MONGO_URI` (`mongodb://mongo:27017/appsalud_<servicio>`) como variables de entorno.
