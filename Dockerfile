# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css engine.js game.js /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
COPY content /usr/share/nginx/html/content
COPY domain /usr/share/nginx/html/domain
COPY infrastructure /usr/share/nginx/html/infrastructure
COPY application /usr/share/nginx/html/application
COPY rendering /usr/share/nginx/html/rendering
COPY ui /usr/share/nginx/html/ui

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
