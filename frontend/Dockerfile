# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# En Docker el frontend llama a los servicios por la misma puerta HTTPS
ENV VITE_USERS_URL=/api/users \
    VITE_ESTUDIOS_URL=/api/estudios \
    VITE_RECETAS_URL=/api/recetas
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine
RUN apk add --no-cache openssl
COPY generar-certificado.sh /docker-entrypoint.d/40-generar-certificado.sh
RUN chmod +x /docker-entrypoint.d/40-generar-certificado.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80 443
