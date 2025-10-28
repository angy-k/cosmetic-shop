# Cosmetic Shop

## 🚀 Live Demo
- **Frontend (Vercel):** [https://cosmetic-shop-votis.vercel.app/](https://cosmetic-shop-votis.vercel.app/)
- **Backend API (Render):** [https://cosmetic-shop-py0r.onrender.com](https://cosmetic-shop-py0r.onrender.com)

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
- Dual SMTP email system (Gmail + SendPulse) with automatic failover
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
| Mailer | Gmail SMTP + SendPulse SMTP + Nodemailer |
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

### 🌐 Production URLs
- **Frontend:** [https://cosmetic-shop-votis.vercel.app/](https://cosmetic-shop-votis.vercel.app/) (Vercel)
- **Backend API:** [https://cosmetic-shop-py0r.onrender.com](https://cosmetic-shop-py0r.onrender.com) (Render)
- **Database:** MongoDB Atlas (cloud-hosted)

### 🔄 CI/CD Pipeline
Each push to the `main` branch triggers:
1. Automated build and test via GitHub Actions  
2. Deployment of backend to Render  
3. Deployment of frontend to Vercel

### 🛠️ Deployment Configuration

#### **Frontend (Vercel):**
- **Framework Preset:** Next.js
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (or leave empty)
- **Install Command:** `npm install` (auto-detected)
- **Development Command:** `npm run dev`
- **Environment Variables:**
  ```bash
  NEXT_PUBLIC_API_URL=https://cosmetic-shop-py0r.onrender.com
  ```

#### **Backend (Render):**
- **Runtime:** Node.js
- **Root Directory:** `backend`
- **Build Command:** `npm ci && npm start`
- **Start Command:** `node server.js`
- **Environment Variables:**
  ```bash
  FRONTEND_URL=https://cosmetic-shop-votis.vercel.app
  NODE_ENV=production
  MONGO_URI=mongodb+srv://...
  JWT_SECRET=your-production-secret
  PORT=5000
  ```  

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

## Email Configuration

The application supports dual SMTP configuration with automatic failover for reliable email delivery.

### Supported Email Providers

#### Gmail SMTP (Primary - Recommended for Development)
```bash
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
```

**Setup Steps:**
1. Go to [Google Account Settings](https://myaccount.google.com)
2. **Security** → **2-Step Verification** (enable if not already)
3. **App passwords** → **Generate new**
4. Select: **Mail** → **Other** → Type "Cosmetic Shop"
5. Copy the 16-character password to `SMTP_PASS`

**Limits:** 500 emails/day (perfect for development)

#### SendPulse SMTP (Backup/Production)
```bash
# SendPulse SMTP Configuration
SENDPULSE_USER=your-sendpulse-username
SENDPULSE_PASSWORD=your-sendpulse-smtp-password
```

**Setup Steps:**
1. Create account at [SendPulse](https://sendpulse.com)
2. **Settings** → **SMTP** → **Enable SMTP service**
3. Copy SMTP username and password (not login credentials)
4. Verify your sender domain for better deliverability

**Limits:** 15,000 emails/month (free plan)

### Email Priority System

The email service uses this priority order:
1. **Gmail SMTP** (if `SMTP_USER` configured) - Primary
2. **SendPulse SMTP** (if `SENDPULSE_USER` configured) - Backup
3. **Development Mode** (if no SMTP configured) - Logs only

### Dual SMTP Configuration (Recommended)
```bash
# Primary: Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password

# Backup: SendPulse SMTP
SENDPULSE_USER=your-sendpulse-username
SENDPULSE_PASSWORD=your-sendpulse-smtp-password

# App Configuration
APP_NAME=Cosmetic Shop
CONTACT_EMAIL=your-gmail@gmail.com
FRONTEND_URL=http://localhost:3001
```

### Email Behavior & Logging

#### Successful Email Delivery
```bash
# Gmail success
Email sent successfully via primary SMTP: <message-id>

# SendPulse backup success (if Gmail fails)
Primary SMTP failed: Invalid login: 535 Authentication failed
Trying backup SMTP (SendPulse)...
Email sent successfully via backup SMTP: <message-id>
```

#### Failed Email Delivery
```bash
# Single SMTP failure
Failed to send email: Invalid login: 535 Authentication failed

# Both SMTP failure
Primary SMTP failed: Invalid login: 535 Authentication failed
Backup SMTP also failed: Connection timeout
Both SMTP failed. Primary: Invalid login, Backup: Connection timeout
```

#### Development Mode (No SMTP)
```bash
# When no SMTP credentials configured
No email configuration found. Email service will log messages only.
Running in development mode - emails will be logged instead of sent

# Email content logged to console
Email would be sent: {
  from: undefined,
  to: 'test@example.com',
  subject: 'Order Confirmation - Cosmetic Shop',
  html: '<!DOCTYPE html>...'
}
```

### Testing Email Configuration

1. **Check Configuration:**
   ```bash
   # View email service initialization
   docker logs cosmetic-shop-backend-dev --tail 5
   ```

2. **Test Email Sending:**
   - Go to `/admin/email-test`
   - Select email type (Order Confirmation, Product Availability, etc.)
   - Enter your email address
   - Click "Send Test Email"

3. **Expected Results:**
   - **Real SMTP:** Email delivered to inbox
   - **Development Mode:** Email content logged to console
   - **Failed SMTP:** Clear error message in logs

### Troubleshooting Email Issues

| Issue | Solution |
|-------|----------|
| `535 Authentication failed` | Check SMTP credentials, use App Password for Gmail |
| `Connection timeout` | Check firewall, try port 465 for Gmail |
| `No email configuration found` | Add SMTP credentials to `.env` file |
| `Both SMTP failed` | Check both Gmail and SendPulse credentials |
| Emails in spam | Verify sender domain, check SPF/DKIM records |

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
