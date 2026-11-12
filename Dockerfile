
FROM node:18.18-alpine3.18 as build

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

RUN npm run build -- --configuration=local


# Pinned to the version that runs in staging; "latest" changed under us on rebuilds.
FROM nginx:1.31.8

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/dist/centinela-application-frontend /usr/share/nginx/html

# nginx.conf answers /health itself, so this tells whether the web server is up.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS -o /dev/null http://127.0.0.1/health || exit 1
