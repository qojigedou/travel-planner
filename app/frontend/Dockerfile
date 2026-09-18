# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
ARG VITE_API_DOCS_URL
ENV VITE_API_DOCS_URL=${VITE_API_DOCS_URL}
RUN npm run build

# ---- serve ----
FROM nginx:1.27-alpine

# Official nginx image runs envsubst on /etc/nginx/templates/*.template at startup.
ENV API_UPSTREAM=http://api:80
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
