#!/bin/sh
# Lo ejecuta la imagen de nginx antes de arrancar (/docker-entrypoint.d).
# Si todavía no hay certificado, genera uno autofirmado para localhost.
set -e

DIR=/etc/nginx/certs

if [ ! -f "$DIR/server.crt" ] || [ ! -f "$DIR/server.key" ]; then
  echo "Generando certificado autofirmado para localhost"
  mkdir -p "$DIR"
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout "$DIR/server.key" -out "$DIR/server.crt" \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
fi
