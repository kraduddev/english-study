FROM nginx:alpine

# Crear /code para Dokploy
WORKDIR /code
RUN mkdir -p /code

# Limpiar nginx default
RUN rm -rf /usr/share/nginx/html/* \
    && rm /etc/nginx/conf.d/default.conf

# Copiar config nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar web
COPY . /usr/share/nginx/html

# Permisos
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]