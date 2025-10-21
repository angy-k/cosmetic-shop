# Cosmetic Shop - Setup Guide

This guide will help you set up the Cosmetic Shop project for development and production.

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
   cp backend/.env backend/.env.backup
   # Edit backend/.env with your configurations
   
   # Copy and configure frontend environment
   cp frontend/env.example frontend/.env.local
   # Edit frontend/.env.local with your configurations
   ```

3. **Database Setup**
   - Create a MongoDB Atlas cluster
   - Get your connection string
   - Update `MONGO_URI` in `backend/.env`

4. **Email Configuration**
   - Create a SendPulse account
   - Get your SMTP credentials
   - Update `SENDPULSE_USER` and `SENDPULSE_PASSWORD` in `backend/.env`

## Docker Development

### Start Development Environment

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f
```

### Development with Hot Reload

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up
```

### Useful Docker Commands

```bash
# Stop all services
docker-compose down

# Rebuild images
docker-compose build

# Remove volumes (reset database)
docker-compose down -v

# View running containers
docker ps

# Execute commands in containers
docker exec -it cosmetic-shop-backend sh
docker exec -it cosmetic-shop-frontend sh
```

## Local Development (Without Docker)

### Backend

```bash
cd backend
npm run dev
```

The backend will be available at `http://localhost:5001`

### Frontend

```bash
cd frontend
npm run dev
```

The application will be accessible at:
- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:5001`

**Note:** Ports were changed from 3000/5000 to 3001/5001 to avoid conflicts with macOS services (Control Center AirPlay uses port 5000).

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
| `APP_NAME` | Application name | `Cosmetic Shop` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:3001` |
| `CORS_ORIGIN` | CORS origin | `http://localhost:3001` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5001` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Cosmetic Shop` |
| `NEXT_PUBLIC_NODE_ENV` | Environment | `development` |

## Testing

### API Testing

The backend includes health check endpoints:

```bash
# Health check
curl http://localhost:5001/health

# API status
curl http://localhost:5001/
```

### Frontend Testing

Visit `http://localhost:3001` to test the frontend application.

## Project Structure

```
cosmetics-shop/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utility functions
│   ├── .env                # Environment variables
│   ├── Dockerfile          # Production Docker image
│   ├── Dockerfile.dev      # Development Docker image
│   ├── package.json        # Dependencies and scripts
│   └── server.js           # Main server file
├── frontend/               # Next.js React application
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   └── hooks/          # Custom hooks
│   ├── public/             # Static assets
│   ├── Dockerfile          # Production container
│   ├── Dockerfile.dev      # Development container
│   ├── next.config.mjs     # Next.js configuration
│   └── package.json        # Dependencies and scripts
├── docker-compose.yml      # Production services
├── docker-compose.dev.yml  # Development services
├── mongo-init.js           # MongoDB initialization
├── setup.sh               # Automated setup script
├── SETUP.md               # Detailed setup guide
└── README.md              # Project overview
```

## Deployment

### Production Build

```bash
# Build for production
docker-compose -f docker-compose.yml build

# Start production services
docker-compose -f docker-compose.yml up -d
```

### Cloud Deployment

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render or Railway
- **Database**: Use MongoDB Atlas

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes on ports
   lsof -ti:3000 | xargs kill -9
   lsof -ti:5000 | xargs kill -9
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
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongo

# Follow logs in real-time
docker-compose logs -f
```
