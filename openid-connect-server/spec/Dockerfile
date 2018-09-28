FROM node:10-alpine

RUN apk add --no-cache \
  git

RUN npm install -g wait-on

RUN mkdir -p /opt/src
COPY ./ /opt/src

WORKDIR /opt/src
RUN npm install

CMD wait-on --timeout 60000 http-get://10.5.0.2:8080/healthcheck && npm test