# SveVišnja Kozmetika - Setup Guide

This guide will help you set up the SveVišnja Kozmetika project (repo/technical name: `cosmetic-shop`) for development and production.

## Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
- **Git**
- **MongoDB Atlas** account (for production)
- **SendPulse** account (for email notifications)

### Automated Setup

Run the setup script to automatically configure the project:

```bash
./setup.sh
```

### Manual Setup

If you prefer to set up manually:

1. **Install Dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy and configure backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configurations

   # Copy and configure frontend environment
   cp frontend/.env.example frontend/.env.local
   # Edit frontend/.env.local with your configurations
   ```
   Note: `setup.sh` currently has the same `frontend/env.example` typo (missing the leading dot) at the line that copies this file - fix it there too, or the automated setup's copy step will fail.

3. **Database Setup**
   - Create a MongoDB Atlas cluster
   - Get your connection string
   - Update `MONGO_URI` in `backend/.env`

4. **Email Configuration**
   - Create a SendPulse account
   - Get your SMTP credentials
   - Update `SENDPULSE_USER` and `SENDPULSE_PASSWORD` in `backend/.env`

## Docker Development

There is no plain `docker-compose.yml` in this repo - always pass `-f` with one of:
- `docker-compose.dev.yml` - the main dev setup (ports 3001/5007, reads `backend/.env`)
- `docker-compose.override.yml` - an alternate local dev setup (ports 3001/5001) - not Compose's usual auto-merged override despite the name; invoke it explicitly with `-f` like the others if you use it
- `docker-compose.prod.yml` - production-style compose (reads `backend/.env.prod`)

### Start Development Environment

```bash
# Start all services
docker compose -f docker-compose.dev.yml up

# Start in background
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f
```

### Useful Docker Commands

```bash
# Stop all services
docker compose -f docker-compose.dev.yml down

# Rebuild images
docker compose -f docker-compose.dev.yml build

# Remove volumes (reset database)
docker compose -f docker-compose.dev.yml down -v

# View running containers
docker ps

# Execute commands in containers
docker exec -it cosmetic-shop-backend-dev sh
docker exec -it cosmetic-shop-frontend sh

# A change to a service's `environment:` block in one of the compose files
# (as opposed to a change inside backend/.env, which nodemon picks up on its
# own) is only picked up by a full recreate, not a plain restart:
docker compose -f docker-compose.dev.yml up -d --force-recreate <service>
```

## Local Development (Without Docker)

### Backend

```bash
cd backend
npm run dev
```

The backend listens on whatever `PORT` is set to in `backend/.env` (currently `5000` there). This is different from the Docker dev setup, where the backend also listens on `5000` *inside* its container, but Docker maps that to `5007` on the host (`docker-compose.dev.yml`'s `ports: "5007:5000"`) - so `http://localhost:5007` only works when running via Docker, not when running `npm run dev` directly.

### Frontend

```bash
cd frontend
npm run dev
```

The application will be accessible at:
- Frontend: `http://localhost:3001`
- Backend API: whatever `PORT` `backend/.env` has set (see above) - update `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to match if you're not using Docker.

**Note:** avoid port `5000` on macOS if possible - Control Center's AirPlay Receiver listens on it by default, which is why the Docker setup maps the backend to host port `5007` instead.

**Server-side vs. browser fetches when running via Docker:** the frontend's server-side code (Next.js's `generateMetadata`, `sitemap.js`) runs *inside* the frontend container, where `localhost` means that container, not the backend one - it needs the backend's Docker service name instead (`http://backend:5000`, set via `API_INTERNAL_URL` - see the frontend env var table below). This only matters for the Docker dev setup; running both apps directly with `npm run dev` has no such split since everything shares the same `localhost`.

You can either:
- Use MongoDB Atlas (recommended)
- Run MongoDB locally with Docker: `docker run -d -p 27017:27017 mongo:7-jammy`

## Configuration

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `SENDPULSE_USER` | SendPulse email | `user@example.com` |
| `SENDPULSE_PASSWORD` | SendPulse password | `password` |
| `APP_NAME` | Application name (used in email subjects/footers) | `SveVišnja Kozmetika` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:3001` |
| `CORS_ORIGIN` | CORS origin | `http://localhost:3001` |
| `STRIPE_SECRET_KEY` | Stripe secret key (sandbox/test mode) | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook for routine notifications (new orders, successful payments). Optional - Slack notifications are disabled entirely if unset. | `https://hooks.slack.com/services/...` |
| `SLACK_WEBHOOK_URL_ERRORS` | Slack Incoming Webhook for errors/failed payments. Optional - falls back to `SLACK_WEBHOOK_URL` if unset. | `https://hooks.slack.com/services/...` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL, used by **browser-side** fetches | `http://localhost:5007` (Docker dev) |
| `API_INTERNAL_URL` | Backend URL used by **server-side** fetches (`generateMetadata`, `sitemap.js`) - only needed in Docker, where the Next.js server process can't reach the backend via `localhost` (see the note above). Falls back to `NEXT_PUBLIC_API_URL` if unset. | `http://backend:5000` (Docker dev) |
| `NEXT_PUBLIC_APP_NAME` | Application name shown in the browser tab title | `SveVišnja Kozmetika` |
| `NEXT_PUBLIC_NODE_ENV` | **Not** the same as Next.js's own build-mode `NODE_ENV` (which is always `"production"` for any `next build`, staging included). This is the app's own "which real environment is this" flag: only `"production"`/`"prod"` makes the site indexable by search engines (`sitemap.js`/`robots.js`/`lib/metadata.js` all gate on it via `lib/env.js`'s `isProductionEnv()`). Anything else - including unset - is de-indexed. The real production deployment must set this in its own hosting env config (e.g. Vercel's Environment Variables), not just in a repo file. | `development` locally, `production` on the real prod deployment |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (sandbox/test mode) | `pk_test_...` |

### Testing Stripe Payments Locally

Stripe requires the raw webhook payload to verify signatures, so `/api/payment/webhook` needs to actually receive events from Stripe. The simplest way to test locally is the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:5007/api/payment/webhook
```

This prints a `whsec_...` value — put it in `backend/.env` as `STRIPE_WEBHOOK_SECRET`. Use Stripe's [test card numbers](https://stripe.com/docs/testing) (e.g. `4242 4242 4242 4242`, any future expiry, any CVC) to complete a test payment from the checkout page.

## Testing

### API Testing

The backend includes health check endpoints:

```bash
# Health check (5007 for the Docker dev setup; use whatever backend/.env's
# PORT is set to if running the backend directly with npm run dev instead)
curl http://localhost:5007/health

# API status
curl http://localhost:5007/
```

### Frontend Testing

Visit `http://localhost:3001` to test the frontend application.

## Project Structure

```
cosmetics-shop/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route controllers (incl. paymentController.js, slackTestController.js, emailTestController.js)
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes (incl. slackTest.js, emailTest.js, payment.js)
│   │   ├── services/       # slackService.js, emailService.js
│   │   ├── lib/            # emailTranslations/
│   │   └── utils/          # Utility functions
│   ├── .env                # Environment variables (dev)
│   ├── .env.prod           # Environment variables (used by docker-compose.prod.yml)
│   ├── Dockerfile          # Production Docker image
│   ├── Dockerfile.dev      # Development Docker image
│   ├── package.json        # Dependencies and scripts
│   └── server.js           # Main server file
├── frontend/               # Next.js React application
│   ├── src/
│   │   ├── app/            # App router pages, each private/dynamic route paired
│   │   │                   # with its own layout.js for per-route metadata (see
│   │   │                   # lib/metadata.js); sitemap.js and robots.js live here too
│   │   ├── components/     # React components
│   │   ├── lib/            # translations/, orderStatus.js, metadata.js, env.js, apiUrl.js, currency.js
│   │   └── hooks/          # Custom hooks
│   ├── public/             # Static assets
│   ├── Dockerfile          # Production container
│   ├── Dockerfile.dev      # Development container
│   ├── next.config.mjs     # Next.js configuration
│   └── package.json        # Dependencies and scripts
├── docker-compose.dev.yml      # Development services (ports 3001/5007)
├── docker-compose.override.yml # Alternate local dev setup (ports 3001/5001)
├── docker-compose.prod.yml     # Production-style compose (reads backend/.env.prod)
├── mongo-init.js           # MongoDB initialization
├── setup.sh               # Automated setup script
├── SETUP.md               # Detailed setup guide
└── README.md              # Project overview
```

## Deployment

### Production Build

```bash
# Build for production (reads backend/.env.prod)
docker compose -f docker-compose.prod.yml build

# Start production services
docker compose -f docker-compose.prod.yml up -d
```

In practice this project deploys to Vercel (frontend) + Render (backend) rather than running `docker-compose.prod.yml` on a server - see the "Cloud Deployment" note below and README.md's Deployment section for the actual env vars each platform needs.

### Cloud Deployment

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render or Railway
- **Database**: Use MongoDB Atlas

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes on ports (3001/5007 for the Docker dev setup - adjust to
   # whatever ports you're actually running on, see the port note above)
   lsof -ti:3001 | xargs kill -9
   lsof -ti:5007 | xargs kill -9
   ```

2. **Docker permission issues**
   ```bash
   # Add user to docker group (Linux)
   sudo usermod -aG docker $USER
   ```

3. **MongoDB connection issues**
   - Check your MongoDB Atlas IP whitelist
   - Verify connection string format
   - Ensure network connectivity

4. **Environment variables not loading**
   - Check file names (`.env` vs `.env.local`)
   - Verify file permissions
   - Restart the application

### Logs

```bash
# View application logs
docker compose -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.dev.yml logs frontend
docker compose -f docker-compose.dev.yml logs mongo

# Follow logs in real-time
docker compose -f docker-compose.dev.yml logs -f
```
