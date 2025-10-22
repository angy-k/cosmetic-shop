# Cosmetic Shop

## Overview
**Cosmetic Shop** is a full-stack web application for browsing and purchasing cosmetic products online.  
It allows users to view products, register, and place orders, while administrators can manage users, products, and confirm availability.  
The application sends email notifications for successful orders and product availability updates.

---

## Features
- User authentication (JWT-based)
- Role-based authorization (User, Admin)
- CRUD operations for products and orders
- Responsive design with Tailwind CSS
- Automated email notifications via SendPulse
- API documentation tested with Postman
- Dockerized for consistent environment setup
- CI/CD pipeline using GitHub Actions
- Deployed frontend (Vercel) and backend (Render)

---

## Tech Stack
| Layer | Technology |
|--------|-------------|
| Frontend | Next.js + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Mailer | SendPulse SMTP + Nodemailer |
| Hosting | Vercel (frontend), Render (backend) |
| CI/CD | GitHub Actions |
| Containerization | Docker + docker-compose |

---

## Quick Start

> **For detailed setup instructions, troubleshooting, and advanced configuration, see [SETUP.md](./SETUP.md)**

### Automated Setup
```bash
git clone https://github.com/angy-k/cosmetic-shop.git
cd cosmetic-shop
./setup.sh
```

The setup script:
- Installs backend and frontend dependencies
- Creates `frontend/.env.local` from example if missing
- Builds Docker images using `docker compose -f docker-compose.dev.yml build`
- Does not start containers automatically

Next steps after setup:
```bash
# Start the development stack
docker compose -f docker-compose.dev.yml up -d

# (Optional) Seed the database using MONGO_URI from backend/.env
cd backend
npm run db:seed:env
```

Access:
- Frontend: http://localhost:3001
- Backend API: http://localhost:5007
- Health: http://localhost:5007/health

### Manual Setup
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Configure environment variables (see SETUP.md for details)
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB Atlas and SendPulse credentials

# 3. Start with Docker (development)
docker compose -f docker-compose.dev.yml up -d --build
# Note: On first run with a fresh DB volume, `mongo-init.js` will auto-seed the database.
```

**Access the application:**
- Frontend: [http://localhost:3001](http://localhost:3001)
- Backend API: [http://localhost:5007](http://localhost:5007)
- Test Page: [http://localhost:3001/test](http://localhost:3001/test)

### Database Seeding

- **Automatic (Docker, first-time only):**
  - The file `mongo-init.js` runs automatically when the MongoDB container initializes a fresh database. It creates collections, indexes, and upserts the admin user.

- **Manual reseed (reads MONGO_URI from `.env`):**
  - Uses `backend/scripts/seed.js` to load env and invoke `mongosh`.
  - Default (`ENV_FILE` optional, defaults to `.env`):
    ```bash
    cd backend
    npm run db:seed:env           # loads backend/.env by default
    # or pick a specific env file
    ENV_FILE=.env.staging npm run db:seed:env
    ```

---

## Deployment
- **Frontend:** Vercel (connected to GitHub)
- **Backend:** Render (connected to GitHub)
- **Database:** MongoDB Atlas (cloud-hosted)

Each push to the `main` branch triggers:
1. Automated build and test via GitHub Actions  
2. Deployment of backend to Render  
3. Deployment of frontend to Vercel  

---

## Project Structure
```
cosmetic-shop/
├── backend/                 # Express.js API server
│   ├── src/                 # Source code
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utility functions
│   ├── scripts/            # Utility scripts (e.g., seed.js)
│   ├── .env.example        # Environment template
│   ├── Dockerfile          # Production container
│   ├── Dockerfile.dev      # Development container
│   └── server.js           # Main server file
├── frontend/               # Next.js React application
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   └── hooks/          # Custom hooks
│   ├── public/             # Static assets
│   ├── Dockerfile          # Production container
│   └── Dockerfile.dev      # Development container
├── docs/                    # Documentation
│   └── Cosmetic_Shop_API.postman_collection.json  # Postman collection
├── docker-compose.yml      # Production services
├── docker-compose.dev.yml  # Development services
├── setup.sh               # Automated setup script
├── SETUP.md               # Detailed setup guide
└── README.md              # Project overview
```

## Documentation

- **[SETUP.md](./SETUP.md)** - Comprehensive setup guide with troubleshooting

## Development

**Prerequisites:** Node.js 18+, Docker, MongoDB Atlas account

**Key Commands:**
```bash
# Development mode
docker-compose up              # Start all services
docker-compose logs -f         # View logs
docker-compose down            # Stop services

# Individual services
cd backend && npm run dev      # Backend only
cd frontend && npm run dev     # Frontend only
```

---
