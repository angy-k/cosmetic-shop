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

## Development and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/cosmetic-shop.git
cd cosmetic-shop
```

### 2. Environment Variables
Each app (`backend/` and `frontend/`) requires a `.env` file.

**Backend `.env`:**
```
PORT=5000
MONGO_URI=<your_mongodb_atlas_connection>
SENDPULSE_USER=<your_sendpulse_user>
SENDPULSE_PASSWORD=<your_sendpulse_password>
JWT_SECRET=<your_jwt_secret>
APP_NAME=Cosmetic Shop
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
APP_NAME=Cosmetic Shop
```

---

### 3. Run with Docker
```bash
docker-compose up --build
```
Frontend will be available at: [http://localhost:3000](http://localhost:3000)  
Backend API at: [http://localhost:5000](http://localhost:5000)

---

### 4. Run Locally (Without Docker)
Frontend:
```bash
cd frontend
npm install
npm run dev
```

Backend:
```bash
cd backend
npm install
npm start
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

## Repository Structure
```
cosmetic-shop/
├── backend/              # Express.js backend
├── frontend/             # Next.js frontend
├── docker-compose.yml
├── .github/workflows/    # CI/CD pipeline configuration
└── README.md             # Project overview (this file)
```

---

## Contributor
Developer

---
