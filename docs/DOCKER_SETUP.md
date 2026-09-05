# Docker Setup and Local Development Guide

## 1. Prerequisites
Ensure the following tools are installed:
- Docker and Docker Compose
- Node.js (for local development without Docker)
- Git

---

## 2. Environment Variables
Create a `.env` file in `backend/` and a `.env.local` file in `frontend/` (copy from `backend/.env.example` and `frontend/.env.example` respectively).

### Example `.env` for backend
```
PORT=5000
MONGO_URI=<your_mongodb_atlas_connection>
SENDPULSE_USER=<your_sendpulse_user>
SENDPULSE_PASSWORD=<your_sendpulse_password>
JWT_SECRET=<your_jwt_secret>
APP_NAME=SveVišnja Kozmetika
SLACK_WEBHOOK_URL=<optional_slack_incoming_webhook>
SLACK_WEBHOOK_URL_ERRORS=<optional_slack_incoming_webhook_for_errors>
```

### Example `.env.local` for frontend
```
NEXT_PUBLIC_API_URL=http://localhost:5007
API_INTERNAL_URL=http://backend:5000
NEXT_PUBLIC_APP_NAME=SveVišnja Kozmetika
NEXT_PUBLIC_NODE_ENV=development
```

See the root `SETUP.md`'s environment variable tables for the full list and what each one does - in particular, `NEXT_PUBLIC_NODE_ENV` is what gates search-engine indexing (only `production`/`prod` is indexable), and `API_INTERNAL_URL` is what lets the frontend's server-side code (`generateMetadata`, `sitemap.js`) reach the backend container - both are easy to miss since neither existed in earlier versions of this project.

---

## 3. Docker Configuration
There is no single top-level `docker-compose.yml` in this repo - always pass `-f` explicitly with one of:

- **`docker-compose.dev.yml`** - the main dev setup (frontend `3001`, backend host port `5007` → container `5000`), reads `backend/.env`
- **`docker-compose.override.yml`** - an alternate local dev setup (frontend `3001`, backend host port `5001`) - despite the name, Compose does **not** auto-merge this one like its usual override file; it must be passed explicitly with `-f` just like the others
- **`docker-compose.prod.yml`** - production-style compose, reads `backend/.env.prod`

All three define the same three services (`mongo`, `backend`, `frontend`); they mainly differ in host port mappings and which backend env file they read.

---

## 4. Local Development
```bash
# Build and start containers (dev setup)
docker compose -f docker-compose.dev.yml up --build

# Start in background
docker compose -f docker-compose.dev.yml up -d

# Stop containers
docker compose -f docker-compose.dev.yml down
```

The application will be accessible at:
- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:5007` (or `5001` if using `docker-compose.override.yml`)

**Note:** a change to a service's `environment:` block in a compose file is only picked up by a full recreate, not a plain restart - `docker compose -f docker-compose.dev.yml up -d --force-recreate <service>`. Plain file edits to `backend/.env` are picked up live by nodemon without needing this.

---

## 5. CI/CD Integration
GitHub Actions pipeline:
1. Runs on push to `main`
2. Deploys backend to Render
3. Deploys frontend to Vercel

(There is no separate "build Docker images" or "run automated tests" step in the actual pipeline - deployment to Vercel/Render happens directly from source, not from the Docker images built by the compose files above, which are for local development and production-style testing.)

---

## 6. Contributor
Developer

---
