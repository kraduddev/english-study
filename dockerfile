FROM nginx:alpine

WORKDIR /code
COPY . /code

RUN rm -rf /usr/share/nginx/html/*
RUN cp -r /code/* /usr/share/nginx/html/

# Deshabilitar caché del navegador para todos los archivos estáticos
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    add_header Cache-Control "no-cache, no-store, must-revalidate";\n\
    add_header Pragma "no-cache";\n\
    add_header Expires "0";\n\
    location ~* \\.(json|js|css|png|jpg|jpeg|gif|svg|ico|webp)$ {\n\
        try_files $uri =404;\n\
    }\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf
