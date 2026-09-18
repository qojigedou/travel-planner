# Waypoint — travel planner frontend

React 19 + TypeScript + Vite, Tailwind v4 on a three-layer token system (`src/styles/tokens.css`),
TanStack Query for data, Leaflet/OpenStreetMap for the map.

## Run everything in Docker

From the repository root:

```bash
docker compose up --build
```

- App: http://localhost:3000
- API docs: http://localhost:80/docs

The compose file builds the backend from `app/backend`, runs `alembic upgrade head` once, then starts the API and this app (nginx).

## Run locally

Start the API on port 8000 (for example `docker compose up db migrate api` from the root), then:

```bash
npm install
npm run dev
```

Open http://localhost:5173. Set `API_PROXY_TARGET` if the API runs somewhere else.

## How API calls reach FastAPI

The browser always calls `/api/*`. In development the Vite proxy removes the prefix, and in Docker nginx does the same
(`nginx/default.conf.template`, upstream set by `API_UPSTREAM`). This avoids CORS, and it keeps API routes like `/trips/`
from colliding with app routes.
