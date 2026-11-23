FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Service addresses as seen by the visitor's browser. They are baked into the bundle as defaults and can be
# overridden at container start-up (see the runtime variables below).
ARG REACT_APP_GATEWAY_URL=
ARG REACT_APP_AUTH_URL=http://localhost:9000
ARG REACT_APP_ANALYTICS_URL=http://localhost:8083
ARG REACT_APP_SHOP_URL=http://localhost:8082
ENV REACT_APP_GATEWAY_URL=$REACT_APP_GATEWAY_URL \
    REACT_APP_AUTH_URL=$REACT_APP_AUTH_URL \
    REACT_APP_ANALYTICS_URL=$REACT_APP_ANALYTICS_URL \
    REACT_APP_SHOP_URL=$REACT_APP_SHOP_URL

# No inline runtime script, so the Content-Security-Policy can forbid inline scripts.
ENV INLINE_RUNTIME_CHUNK=false

COPY . .
RUN npm run build


FROM nginx:1.27-alpine

# nginx renders the template and runs the scripts below when the container starts, using the container
# environment: restart the container to point the portal at other service addresses.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/15-api-origin.envsh /docker-entrypoint.d/15-api-origin.envsh
COPY docker/30-runtime-config.sh /docker-entrypoint.d/30-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/15-api-origin.envsh /docker-entrypoint.d/30-runtime-config.sh

# Runtime defaults: the same addresses the bundle was built with.
ARG REACT_APP_GATEWAY_URL=
ARG REACT_APP_AUTH_URL=http://localhost:9000
ARG REACT_APP_ANALYTICS_URL=http://localhost:8083
ARG REACT_APP_SHOP_URL=http://localhost:8082
ENV GATEWAY_URL=$REACT_APP_GATEWAY_URL \
    AUTH_URL=$REACT_APP_AUTH_URL \
    ANALYTICS_URL=$REACT_APP_ANALYTICS_URL \
    SHOP_URL=$REACT_APP_SHOP_URL

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
