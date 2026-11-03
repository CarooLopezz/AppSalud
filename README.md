# AppSalud – Agenda personal de salud

AppSalud es una aplicación web para que cada persona tenga **toda su información de salud en un solo lugar**: estudios médicos, recetas y medicamentos, turnos y el directorio de médicos. Cada usuario entra con su propia cuenta y **solo ve y modifica sus propios datos**.

**Integrantes**

| Integrante | Responsable de |
|---|---|
| Adriana Antunes | Usuarios, login, médicos y agenda (`users-service`) |
| Iara Fernández | Estudios médicos (`estudios-service`) |
| Lara Magallanes | Recetas y medicamentos (`recetas-service`) |
| Carolina López | Infraestructura (Docker, HTTPS), seguridad, tests e integración |

---

## Índice
1. [El problema](#1-el-problema)
2. [Qué hace la aplicación](#2-qué-hace-la-aplicación)
3. [Tecnologías](#3-tecnologías)
4. [Arquitectura](#4-arquitectura)
5. [Seguridad](#5-seguridad)
6. [Patrones de diseño](#6-patrones-de-diseño)
7. [Cómo ejecutarla](#7-cómo-ejecutarla)
8. [Datos de ejemplo y usuarios demo](#8-datos-de-ejemplo-y-usuarios-demo)
9. [Documentación de la API (Swagger y GraphQL)](#9-documentación-de-la-api-swagger-y-graphql)
10. [Tests](#10-tests)
11. [Detalle de cada módulo](#11-detalle-de-cada-módulo)
12. [Estructura del repositorio](#12-estructura-del-repositorio)
13. [Forma de trabajo del equipo](#13-forma-de-trabajo-del-equipo)

---

## 1. El problema

La información de salud de una persona está **fragmentada**. Los estudios quedan en distintos laboratorios, las recetas vienen de distintos médicos y los turnos se reparten entre varias instituciones. La persona termina con carpetas en papel, fotos sueltas en el teléfono y datos que recuerda de memoria. Eso trae consecuencias concretas: estudios que se repiten, errores en la medicación, controles que se pasan de fecha y datos sensibles que circulan por chats o correos sin protección.

**Objetivo:** darle a cada persona un lugar propio y seguro donde reunir y consultar su información de salud, con la garantía de que nadie más puede ver sus datos.

El análisis completo está en [docs/PROBLEMATICA.md](docs/PROBLEMATICA.md).

## 2. Qué hace la aplicación

| Módulo | Funcionalidades |
|---|---|
| **Cuentas** | Registro, inicio de sesión y cierre de sesión. Las contraseñas se guardan encriptadas y la sesión se mantiene con un token JWT que dura una hora y media; al vencer, la app avisa y pide volver a ingresar. Incluye la pantalla *Mi perfil*. |
| **Médicos** | Directorio de los profesionales registrados en la app. |
| **Agenda** | Cada persona anota sus turnos (profesional, especialidad, lugar, fecha y motivo), los ve ordenados y marca los que ya pasaron como asistidos. También muestra los próximos controles de sus estudios. |
| **Estudios** | Alta, consulta, edición y baja de estudios médicos (tipo, especialidad, médico, fecha, resultado, notas y próximo control), con búsqueda y filtros. |
| **Recetas** | Recetas asociadas a medicamentos, con archivo adjunto (PDF o imagen) y **alerta de recetas próximas a vencer**. |
| **Interfaz** | Modo claro y oscuro, botón para mostrar u ocultar la contraseña, rutas protegidas y mensajes de error claros. |

## 3. Tecnologías

| Tecnología | Para qué se usa |
|---|---|
| **TypeScript** | Lenguaje de todo el proyecto, tanto del backend como del frontend. El tipado evita errores antes de ejecutar. |
| **NestJS 12** (Node.js) | Framework de los tres microservicios del backend. Organiza el código en módulos, controladores y servicios, con inyección de dependencias. |
| **MongoDB 7 + Mongoose** | Base de datos NoSQL. Cada microservicio tiene su propia base (`appsalud_users`, `appsalud_estudios`, `appsalud_recetas`). |
| **REST** | Estilo de API de `users-service` y `estudios-service`. |
| **GraphQL (Apollo Server)** | API de `recetas-service`, y también de `estudios-service` como alternativa a REST. El cliente pide exactamente los campos que necesita. |
| **JWT + Passport** | Autenticación: el login devuelve un token firmado que se envía en cada pedido (`Authorization: Bearer ...`). |
| **bcrypt** | Encriptado (hash) de las contraseñas antes de guardarlas. |
| **class-validator** | Validación de los datos que llegan a la API, por ejemplo un email válido o una contraseña de al menos 6 caracteres. |
| **@nestjs/throttler** | Límite de intentos en el login (protección contra fuerza bruta). |
| **Swagger / OpenAPI** | Documentación interactiva de la API, desde donde también se puede probar. |
| **React 19 + Vite** | Frontend (SPA). Vite compila y sirve la aplicación en desarrollo. |
| **React Router** | Navegación entre pantallas y rutas protegidas (sin sesión, redirige al login). |
| **Axios** | Cliente HTTP del frontend. Agrega el token automáticamente a cada pedido. |
| **Docker + Docker Compose** | Levanta todo el sistema (base de datos, tres servicios y frontend) con un solo comando. |
| **nginx** | Servidor web del frontend y **puerta de entrada única** con HTTPS. Redirige cada `/api/...` al microservicio que corresponde. |
| **mkcert** | Certificado HTTPS de confianza para desarrollo local (el candado del navegador). |
| **Vitest, Supertest y Testing Library** | Tests unitarios, end-to-end (e2e) y de pantallas. |
| **Wireshark / tshark** | Verificación de que la información viaja cifrada por la red. |
| **Git + GitHub + Jira** | Control de versiones con ramas y pull requests, y gestión de tareas (los códigos `AP-xx` de los commits). |

## 4. Arquitectura

AppSalud está construida con **microservicios**: cada parte del negocio es un servicio independiente, con su propio código y su propia base de datos. Todos quedan detrás de una única puerta de entrada HTTPS.

```
                         Navegador del usuario
                                  │
                          HTTPS (puerto 443)
                                  │
                ┌─────────────────▼─────────────────┐
                │   nginx (contenedor "frontend")   │
                │  - Sirve la app React             │
                │  - HTTP (80) → redirige a HTTPS   │
                │  - Reenvía /api/* a cada servicio │
                └───┬──────────────┬─────────────┬──┘
     /api/users     │ /api/estudios│ /api/recetas│      (red interna de Docker,
                    ▼              ▼             ▼       no accesible desde afuera)
          ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
          │users-service │ │estudios-serv.│ │recetas-serv. │
          │ NestJS REST  │ │ REST+GraphQL │ │NestJS GraphQL│
          │ :3001        │ │ :3002        │ │ :3003        │
          └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                 ▼                ▼                ▼
          ┌─────────────────────────────────────────────────┐
          │ MongoDB: appsalud_users · appsalud_estudios ·    │
          │          appsalud_recetas                        │
          └─────────────────────────────────────────────────┘
```

| Servicio | Responsabilidad | API |
|---|---|---|
| `users-service` | Usuarios, login (emite el JWT), directorio de médicos y agenda de turnos | REST |
| `estudios-service` | Estudios médicos y próximos controles | REST y GraphQL |
| `recetas-service` | Recetas, medicamentos y alertas de vencimiento | GraphQL |
| `frontend` | Interfaz web (React) y puerta de entrada (nginx) | — |
| `mongo` | Base de datos | — |

**Cómo se conectan:** el usuario inicia sesión en `users-service`, que le devuelve un token JWT. El frontend guarda ese token y lo manda en cada pedido a los otros servicios. Como todos comparten la misma clave secreta (`JWT_SECRET`), `estudios-service` puede verificar el token por su cuenta, sin consultar a `users-service`, y saber qué usuario hace el pedido.

**Por qué microservicios:** cada integrante pudo desarrollar y probar su módulo de forma independiente. Además, si un servicio falla, los demás siguen funcionando, y cada uno puede escalar o cambiar de tecnología sin afectar al resto. Por ejemplo, recetas usa GraphQL y usuarios usa REST.

## 5. Seguridad

En una aplicación de salud, proteger los datos es parte del problema que se resuelve. Estas son las medidas implementadas:

| Medida | Cómo se implementó | Cómo se verifica |
|---|---|---|
| **Contraseñas encriptadas** | Se guardan con hash **bcrypt** y nunca se devuelven en ninguna respuesta. | Tests e2e de usuarios y del seed |
| **Comunicación cifrada (HTTPS)** | nginx atiende con TLS 1.2/1.3. HTTP redirige a HTTPS y el encabezado HSTS obliga al navegador a usar siempre HTTPS. | Test con Wireshark (ver abajo) |
| **Servicios no expuestos** | Los puertos 3001 a 3003 no se publican: desde afuera solo se llega pasando por nginx. | Test con Wireshark |
| **Autenticación con JWT** | Las rutas privadas exigen un token válido. El token vence a la hora y media. | Tests e2e |
| **Aislamiento entre usuarios** | Cada dato queda asociado al usuario del token: nadie puede ver, editar ni borrar los datos de otra persona. | Tests e2e de estudios |
| **Protección contra fuerza bruta** | Máximo **5 intentos de login por minuto** por IP. Al superarlo, la API responde **429 Too Many Requests**. | Test `rate-limit.e2e-spec.ts` |
| **Roles** | El registro público siempre crea cuentas de `paciente`: nadie puede registrarse como `medico`. | Tests e2e |
| **Validación de datos** | Todo lo que entra a la API se valida, y los campos no esperados se descartan. | Tests e2e |
| **Logs sin datos sensibles** | Todos los errores quedan registrados, pero nunca se guardan el cuerpo del pedido, los headers ni los tokens. Ante un error interno, el usuario solo recibe un mensaje genérico. | Tests unitarios del filtro de errores |

### Verificación con Wireshark
Wireshark es un programa que muestra todo lo que viaja por la red; es lo que vería un atacante que espía la conexión. Para comprobarlo:

1. Abrir Wireshark y elegir la interfaz **Adapter for loopback traffic capture**.
2. Filtrar con `tcp.port == 443`.
3. Iniciar sesión en https://localhost.

Los paquetes aparecen como **TLSv1.3 – Application Data**, con el contenido ilegible: no se ven ni la contraseña ni el token. Lo mismo se comprueba de forma automática con `node --test tests/wireshark.test.mjs`.

### Prueba del límite de intentos
Con la app levantada, este script de PowerShell intenta iniciar sesión 7 veces seguidas con una contraseña incorrecta:

```powershell
'{"email":"ana@appsalud.com","password":"mala"}' | Out-File -Encoding ascii "$env:TEMP\brute.json"
1..7 | ForEach-Object { curl.exe -k -s -o NUL -w "%{http_code}`n" -X POST https://localhost/api/users/auth/login -H "Content-Type: application/json" --data "@$env:TEMP\brute.json" }
```

Resultado: `401 401 401 401 401 429 429`. Los cinco primeros intentos se rechazan por contraseña incorrecta y, a partir del sexto, el servidor deja de aceptar intentos. También se puede ver desde Swagger o desde la pantalla de login.

## 6. Patrones de diseño

| Patrón | Dónde se aplica |
|---|---|
| **Microservicios + API Gateway** | Tres servicios independientes detrás de nginx, que funciona como puerta de entrada única ([frontend/nginx.conf](frontend/nginx.conf)). |
| **Arquitectura en capas** (Controller → Service → Model) | En cada servicio, el *controller* (o *resolver* en GraphQL) recibe el pedido, el *service* tiene la lógica y el *model* de Mongoose accede a la base. |
| **Inyección de dependencias** | NestJS crea los servicios y se los pasa a quien los necesita por el constructor. Ejemplo: [estudios.service.ts](estudios-service/src/estudios/estudios.service.ts). |
| **Repository** | El `Model` de Mongoose, inyectado con `@InjectModel`, encapsula el acceso a la base de datos. |
| **Strategy** | La autenticación usa una estrategia de Passport intercambiable: [jwt.strategy.ts](estudios-service/src/auth/jwt.strategy.ts). |
| **Guard** (cadena de filtros) | Antes de llegar al controlador, el pedido pasa por *guards* que comprueban el token y el límite de intentos ([auth.controller.ts](users-service/src/auth/auth.controller.ts)). |
| **Decorator** | `@Controller`, `@Get`, `@UseGuards`, `@ApiTags` y el decorador propio `@CurrentUser` ([current-user.decorator.ts](estudios-service/src/auth/current-user.decorator.ts)). |
| **DTO** (Data Transfer Object) | Clases que definen y validan los datos de entrada, en las carpetas `dto/` de cada servicio. |
| **Factory** | `useFactory` arma la configuración a partir de variables de entorno ([app.module.ts](users-service/src/app.module.ts)). En el frontend, `crearCliente()` construye los clientes HTTP ([clients.ts](frontend/src/api/clients.ts)). |
| **Manejador global de errores** | Un único *exception filter* atrapa y registra todos los errores ([todos-los-errores.filter.ts](users-service/src/common/todos-los-errores.filter.ts)). |
| **Interceptor** | En el frontend, cada pedido lleva el token automáticamente; si el servidor responde 401, se cierra la sesión ([clients.ts](frontend/src/api/clients.ts)). |
| **Observer** | Cuando la sesión vence se dispara un evento, y la app lo escucha para redirigir al login ([AuthContext.tsx](frontend/src/auth/AuthContext.tsx)). |
| **Provider / Context** | La sesión del usuario está disponible en toda la app de React mediante un *Context*. |

## 7. Cómo ejecutarla

**Requisitos:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y abierto.

```bash
git clone https://github.com/CarooLopezz/AppSalud.git
cd AppSalud
docker compose up -d --build     # construye y levanta todo
docker compose run --rm seed     # carga los datos de ejemplo
```

Abrir **https://localhost**.

> El certificado HTTPS es autofirmado, así que el navegador muestra "La conexión no es privada". Hay que tocar **Configuración avanzada → Continuar a localhost**. La conexión está igualmente cifrada. Para que aparezca el candado, ver [Certificado de confianza](#certificado-de-confianza-opcional).

Otros comandos útiles:

```bash
docker compose ps                     # ver el estado de los contenedores
docker compose logs -f users-service  # ver los logs de un servicio
docker compose down                   # apagar (agregar -v para borrar los datos)
```

### Variables de entorno
Docker Compose ya configura todo. Solo `JWT_SECRET` (la clave para firmar los tokens) se puede definir en un archivo `.env` en la raíz; si no existe, se usa `clave_de_desarrollo`, que sirve únicamente para desarrollo.

| Variable | Servicio | Valor por defecto |
|---|---|---|
| `MONGO_URI` | los tres servicios | `mongodb://mongo:27017/appsalud_<servicio>` |
| `JWT_SECRET` | users y estudios | `clave_de_desarrollo` |
| `THROTTLE_LIMIT` / `THROTTLE_TTL` | users | 5 intentos / 60000 ms |

### Certificado de confianza (opcional)
Para ver el candado en el navegador, ejecutar una sola vez en PowerShell, desde la raíz del proyecto:

```powershell
winget install FiloSottile.mkcert
mkcert -install
mkdir certs
mkcert -cert-file certs/server.crt -key-file certs/server.key localhost 127.0.0.1 ::1
docker compose restart frontend
```

Después hay que cerrar y volver a abrir el navegador. La carpeta `certs/` no se sube a GitHub.

### Desarrollo sin Docker
Para trabajar sobre un módulo:

```bash
docker compose up -d mongo     # solo la base de datos
cd users-service               # o estudios-service / recetas-service
npm install
npm run start:dev              # http://localhost:3001 (3002 / 3003)

cd frontend
npm install
npm run dev                    # http://localhost:5173
```

> En este modo los servicios usan HTTP sin cifrar. La demo y la entrega se hacen con Docker (HTTPS).

## 8. Datos de ejemplo y usuarios demo

`docker compose run --rm seed` carga usuarios, medicamentos, estudios, recetas y turnos de ejemplo. Se puede ejecutar varias veces sin duplicar datos.

Todos los usuarios tienen la contraseña **`demo1234`**:

| Email | Rol | Datos cargados |
|---|---|---|
| `ana@appsalud.com` | paciente | 3 estudios, 2 recetas, 2 turnos |
| `juan@appsalud.com` | paciente | 2 estudios, 2 recetas, 1 turno |
| `laura.mendez@appsalud.com` | médico | Aparece en el directorio de médicos |

**Recorrido sugerido para la demo:**
1. Entrar como Ana y ver sus estudios, recetas (con la alerta de vencimiento) y su agenda.
2. Cerrar sesión, entrar como Juan y comprobar que **no ve los datos de Ana**.
3. Abrir el directorio de médicos.
4. Probar la API desde Swagger, incluido el límite de intentos.

## 9. Documentación de la API (Swagger y GraphQL)

Con la app levantada en Docker:

| Servicio | Swagger (REST) | GraphQL |
|---|---|---|
| Usuarios, médicos y agenda | https://localhost/api/users/docs | — |
| Estudios | https://localhost/api/estudios/docs | `POST https://localhost/api/estudios/graphql` |
| Recetas | https://localhost/api/recetas/docs | `POST https://localhost/api/recetas/graphql` |

**Cómo probar desde Swagger** (en el de usuarios, `/api/users/docs`):
1. Abrir `POST /auth/login`, tocar **Try it out**, escribir `{"email":"ana@appsalud.com","password":"demo1234"}` y tocar **Execute**.
2. Copiar el `access_token` que devuelve la respuesta.
3. Tocar **Authorize** 🔒, pegar el token y confirmar.
4. Probar una ruta protegida, por ejemplo `GET /users/medicos`.

## 10. Tests

Cada parte tiene sus propios tests. Los e2e necesitan MongoDB levantado (`docker compose up -d mongo`) y usan bases separadas (`appsalud_test_*`), así que no tocan los datos reales.

| Qué se prueba | Dónde | Comando |
|---|---|---|
| Unitarios de cada servicio | `users-service`, `estudios-service`, `recetas-service` | `npm test` |
| End-to-end: levantan el servicio y le hacen pedidos reales | ídem | `npm run test:e2e` |
| Cobertura de código | ídem | `npm run test:cov` |
| Pantallas y navegación | `frontend` | `npm test` |
| Carga de datos de ejemplo | `seed` | `npm test` |
| Cifrado del tráfico de red (con la app en Docker y Wireshark instalado) | raíz | `node --test tests/wireshark.test.mjs` |

**Qué cubren:**
- **Usuarios y médicos:** registro y login (contraseña nunca devuelta y guardada con bcrypt, email repetido, datos inválidos, credenciales incorrectas), límite de intentos (429) y directorio de médicos (protegido con token, solo médicos, sin contraseñas y sin que nadie pueda registrarse como médico).
- **Agenda:** alta, edición y baja de turnos de cada usuario.
- **Estudios:** CRUD protegido con token y, sobre todo, **aislamiento entre usuarios**.
- **Recetas:** CRUD por GraphQL, relación con medicamentos, archivo adjunto y alertas de vencimiento.
- **Frontend:** navegación, rutas protegidas, login y registro con sus mensajes de error, perfil, agenda, médicos, recetas, modo claro u oscuro y botón para ver la contraseña.
- **Seed:** que cargue todo, que no duplique datos, que use bcrypt y que las relaciones sean correctas.
- **Red:** la contraseña, el email y el token no aparecen en la captura, HTTP solo redirige a HTTPS y los puertos internos están cerrados.

## 11. Detalle de cada módulo

### Usuarios, login y médicos (`users-service`, REST)
| Método | Ruta | Descripción | Protegida |
|---|---|---|---|
| POST | `/auth/register` | Crea una cuenta de paciente (`nombre`, `email`, `password` de 6 caracteres o más) | No (con límite de intentos) |
| POST | `/auth/login` | Devuelve el `access_token` (JWT) | No (con límite de intentos) |
| GET | `/users/medicos` | Lista de médicos (nombre y email) | Sí |

### Agenda (`users-service`, REST)
Agenda personal: la persona anota los turnos que ya sacó (por teléfono, en la clínica, etc.). El profesional no necesita tener cuenta en la app. Cada usuario ve y modifica solo sus propios turnos.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/appointments` | Turnos del usuario |
| GET | `/appointments/:id` | Un turno |
| POST | `/appointments` | Crear un turno (`profesional`, `especialidad`, `lugar`, `fecha`, `motivo`) |
| PATCH | `/appointments/:id` | Editar un turno o marcarlo como asistido |
| DELETE | `/appointments/:id` | Eliminar un turno |

### Estudios (`estudios-service`, REST y GraphQL)
Todas las rutas requieren token, y cada estudio queda a nombre del usuario que lo crea.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/estudios` | Crear un estudio |
| GET | `/estudios` | Listar los estudios propios, con filtros y búsqueda |
| GET | `/estudios/:id` | Ver un estudio |
| PATCH | `/estudios/:id` | Editar un estudio |
| DELETE | `/estudios/:id` | Eliminar un estudio |

Las mismas operaciones también están disponibles por GraphQL en `/graphql`.

### Recetas (`recetas-service`, GraphQL)
Todo se hace con `POST /graphql`.
- **Consultas:** `recetas`, `receta(id)`, `recetasPorVencer` (las que vencen en los próximos 3 días), `medicamentos`, `medicamento(id)`.
- **Mutaciones:** `crearReceta`, `actualizarReceta`, `eliminarReceta`, además de las de medicamentos.
- Cada receta se relaciona con un medicamento y puede llevar un archivo adjunto (PDF, JPG o PNG).

### Registro de errores (los tres servicios)
- Errores **4xx** (problemas del pedido: datos inválidos, sin token, recurso inexistente): se registran como `WARN`.
- Errores **5xx** (problemas del servidor): se registran como `ERROR` con el detalle completo. El usuario solo recibe "Error interno del servidor".
- Para verlos: `docker compose logs -f users-service estudios-service recetas-service`.

## 12. Estructura del repositorio

```
AppSalud/
├── users-service/       Microservicio de usuarios, login, médicos y agenda (NestJS, REST)
│   ├── src/auth/          registro, login, JWT y límite de intentos
│   ├── src/users/         usuarios y directorio de médicos
│   ├── src/appointments/  agenda de turnos
│   ├── src/common/        filtro global de errores
│   └── test/              tests e2e
├── estudios-service/    Microservicio de estudios (NestJS, REST + GraphQL)
├── recetas-service/     Microservicio de recetas y medicamentos (NestJS, GraphQL)
├── frontend/            App React + Vite, y nginx (HTTPS y puerta de entrada)
│   ├── src/pages/         pantallas
│   ├── src/components/    componentes reutilizables
│   ├── src/auth/          manejo de la sesión
│   ├── src/api/           clientes HTTP hacia los servicios
│   └── nginx.conf         configuración HTTPS y reenvío a los servicios
├── seed/                Script de datos de ejemplo
├── tests/               Test de tráfico de red (Wireshark)
├── docs/                Documento de la problemática
└── docker-compose.yml   Orquestación de todos los contenedores
```

## 13. Forma de trabajo del equipo

- **Jira** para organizar las tareas. Cada tarea tiene un código `AP-xx`, que aparece en las ramas y en los commits.
- **Git con ramas:** cada funcionalidad se desarrolla en su propia rama (`feature/...` o `fix/...`) y se integra a `dev` mediante un **pull request** en GitHub. Cuando `dev` está estable, se pasa a `main`, que es la versión de entrega.
- Cada módulo incluye sus tests, y la documentación de la API se mantiene en Swagger.
