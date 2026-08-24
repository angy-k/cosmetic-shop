# Docker Setup and Local Development Guide

## 1. Prerequisites
Ensure the following tools are installed:
- Docker and Docker Compose
- Node.js (for local development without Docker)
- Git

---

## 2. Environment Variables
Create a `.env` file in both the `backend/` and `frontend/` directories.

### Example `.env` for backend
```
PORT=5000
MONGO_URI=<your_mongodb_atlas_connection>
SENDPULSE_USER=<your_sendpulse_user>
SENDPULSE_PASSWORD=<your_sendpulse_password>
JWT_SECRET=<your_jwt_secret>
APP_NAME=Cosmetic Shop
```

### Example `.env.local` for frontend
```
NEXT_PUBLIC_API_URL=http://localhost:5000
APP_NAME=Cosmetic Shop
```

---

## 3. Docker Configuration
A top-level `docker-compose.yml` defines services for backend, frontend, and MongoDB.

### Example `docker-compose.yml`
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file: ./backend/.env
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    env_file: ./frontend/.env.local
    depends_on:
      - backend

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

---

## 4. Local Development
```bash
# Build and start containers
docker-compose up --build

# Stop containers
docker-compose down
```

The application will be accessible at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## 5. CI/CD Integration
GitHub Actions pipeline will:
1. Build Docker images
2. Run automated tests
3. Deploy backend to Render
4. Deploy frontend to Vercel

---

## 6. Contributor
Developer

---
