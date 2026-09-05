# SveVišnja Kozmetika

## Live Demo
- **Frontend (Vercel):** [https://cosmetic-shop-votis.vercel.app/](https://cosmetic-shop-votis.vercel.app/)
- **Backend API (Render):** [https://cosmetic-shop-54ju.onrender.com](https://cosmetic-shop-54ju.onrender.com)

### Demo Login Credentials
**Admin User:**
- Email: `admin@cosmeticshop.com`
- Password: `admin123`
- Access: Full admin panel, manage products/orders, email testing

**Classic User:**
- Email: `classic@cosmeticshop.com`
- Password: `admin123`
- Access: Browse products, place orders, view notifications

## Overview
**SveVišnja Kozmetika** (repo/technical name: `cosmetic-shop`) is a full-stack web application for browsing and purchasing natural/organic cosmetic products online, with bilingual Serbian/English localization (Serbian is the default).
It allows users to view products, register, and place orders, while administrators can manage users, products, and confirm availability.
The application sends email and Slack notifications for new orders, payment outcomes, and product availability updates.

---

## Features
- User authentication (JWT-based, with silent access-token refresh)
- Role-based authorization (User, Admin)
- CRUD operations for products and orders
- Shopping cart, checkout (Serbia + neighboring countries, full shipping/billing address), and Stripe card payments (sandbox/test mode), including a payment-retry flow for failed/pending orders
- Order history for logged-in users
- Bilingual Serbian/English localization (UI text and transactional emails), switched instantly via a `LanguageContext`/`useTranslation()` hook - no page reload - mirroring the existing theme switcher; dates render via `sr-Latn-RS`/`en-US`, Stripe decline/error messages are translated, and the choice persists to `localStorage` and, once signed in, to the user's account so it follows them across devices
- Responsive design with Tailwind CSS
- Dual SMTP email system (Gmail + SendPulse) with automatic failover
- Slack notifications for new orders, payment outcomes, and application errors (separate channels for routine vs. error notifications), with an admin test page for each notification type
- SEO: per-route metadata (title/description/Open Graph/Twitter), `sitemap.xml`/`robots.txt`, and environment-gated indexing (only the real production deployment is indexable)
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
| Payments | Stripe (sandbox/test mode) |
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

### Production URLs
- **Frontend:** [https://cosmetic-shop-votis.vercel.app/](https://cosmetic-shop-votis.vercel.app/) (Vercel)
- **Backend API:** [https://cosmetic-shop-54ju.onrender.com](https://cosmetic-shop-54ju.onrender.com) (Render)
- **Database:** MongoDB Atlas (cloud-hosted)

### CI/CD Pipeline
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
  NEXT_PUBLIC_API_URL=https://cosmetic-shop-54ju.onrender.com
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
├── docs/                    # Documentation (specification, plan, Gantt chart, Postman collection, etc.)
├── docker-compose.dev.yml      # Development services (local ports: 3001/5007)
├── docker-compose.override.yml # Alternate local dev setup (local ports: 3001/5001)
├── docker-compose.prod.yml     # Production-style compose (reads backend/.env.prod)
├── setup.sh               # Automated setup script
├── SETUP.md               # Detailed setup guide
└── README.md              # Project overview
```

**Note:** there is no plain `docker-compose.yml` in this repo - always pass `-f` with one of the three files above (`docker compose -f docker-compose.dev.yml ...` is the one used throughout this README).

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
4. Select: **Mail** → **Other** → Type "SveVišnja Kozmetika" (or anything else - this label is just for your own reference in Google's UI)
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
APP_NAME=SveVišnja Kozmetika
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
  subject: 'Potvrda porudžbine - SveVišnja Kozmetika',
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

## Slack Notifications

The backend can post to Slack via Incoming Webhooks, independent of the email system:

```bash
# backend/.env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...          # routine notifications (new orders, successful payments)
SLACK_WEBHOOK_URL_ERRORS=https://hooks.slack.com/services/...   # errors and failed payments (optional - falls back to the URL above if unset)
```

If neither variable is set, Slack notifications are silently disabled (logged once, no-op thereafter) - the app runs fine without them configured.

**Notification types:** new order, payment succeeded, payment failed, application error.

**Testing:** go to `/admin/slack-test` (mirrors `/admin/email-test`) to fire a sample notification of each type and check which webhook(s) are configured, without needing a real order or payment.

## Payments

Stripe (sandbox/test mode). Two ways the backend learns a payment's outcome:
1. **Webhook** (`POST /api/payment/webhook`) - the standard Stripe-initiated path; requires a public endpoint or `stripe listen` forwarding (see [SETUP.md](./SETUP.md)) to reach a local backend.
2. **Client-reported result** (`POST /api/payment/confirm-result`) - the frontend explicitly reports the outcome of `stripe.confirmCardPayment()` right after it resolves, so payment status updates (and the resulting Slack/email notifications) work locally even without `stripe listen` running. Both paths call the same idempotent handlers and are protected against a race between them (an in-process per-order lock in `paymentController.js`).

Orders with a failed/pending payment get a retry option on their order detail page (`/orders/[id]`), which embeds a fresh Stripe Elements form.

## SEO

- `frontend/src/app/sitemap.js` / `robots.js` - Next.js App Router metadata routes generating `/sitemap.xml` and `/robots.txt`.
- `frontend/src/lib/metadata.js` - shared helper giving each route its own title/description/Open Graph/Twitter metadata (previously every page inherited the homepage's).
- `frontend/src/lib/env.js` - `isProductionEnv()` checks `NEXT_PUBLIC_NODE_ENV` (a separate flag from Next's own build-mode `NODE_ENV`, which is always `"production"` for any `next build` output). Anything other than `"production"`/`"prod"` - including it being unset - is treated as non-production and de-indexed sitewide (`noindex` meta tags, `robots.txt` disallows everything, empty sitemap). **The real production deployment must set `NEXT_PUBLIC_NODE_ENV=production` in its own hosting env config** (e.g. the Vercel project's Environment Variables for the Production environment) - this is not something a file in this repo can set for you.

## Documentation

- **[SETUP.md](./SETUP.md)** - Comprehensive setup guide with troubleshooting
- **[documentation.md](./documentation.md)** - Main technical documentation (architecture, database, API, frontend, deployment)
- **[docs/](./docs)** - Specification, implementation plan, Gantt chart, Postman collection

## Development

**Prerequisites:** Node.js 18+, Docker, MongoDB Atlas account

**Key Commands:**
```bash
# Development mode (there is no plain docker-compose.yml - always pass -f)
docker compose -f docker-compose.dev.yml up -d     # Start all services
docker compose -f docker-compose.dev.yml logs -f   # View logs
docker compose -f docker-compose.dev.yml down      # Stop services

# A change to a service's `environment:` block (not a .env file) requires
# recreating that container, not just restarting it:
docker compose -f docker-compose.dev.yml up -d --force-recreate <service>

# Individual services
cd backend && npm run dev      # Backend only
cd frontend && npm run dev     # Frontend only
```

---
