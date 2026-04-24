FROM nginx:alpine

WORKDIR /code
COPY . /code

RUN rm -rf /usr/share/nginx/html/*
RUN cp -r /code/* /usr/share/nginx/html/
