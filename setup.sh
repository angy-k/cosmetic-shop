#!/bin/bash

# Cosmetic Shop - Project Setup Script
echo "🛍️  Setting up Cosmetic Shop project..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment files from examples
print_status "Setting up environment files..."

# Backend environment
if [ ! -f "backend/.env" ]; then
    print_warning "backend/.env already exists. Please configure it manually."
else
    print_success "Backend .env file is already configured"
fi

# Frontend environment
if [ ! -f "frontend/.env.local" ]; then
    print_status "Creating frontend/.env.local from example..."
    cp frontend/env.example frontend/.env.local
    print_success "Created frontend/.env.local"
else
    print_warning "frontend/.env.local already exists"
fi

# Install dependencies
print_status "Installing backend dependencies..."
cd backend && npm install
if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

cd ..

print_status "Installing frontend dependencies..."
cd frontend && npm install
if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

cd ..

# Build Docker images
print_status "Building Docker images..."
docker compose -f docker-compose.dev.yml build
if [ $? -eq 0 ]; then
    print_success "Docker images built successfully"
else
    print_error "Failed to build Docker images"
    exit 1
fi

print_success "🎉 Project setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your MongoDB Atlas connection in backend/.env"
echo "2. Configure SendPulse credentials in backend/.env"
echo "3. Update JWT_SECRET in backend/.env with a secure key"
echo "4. Run 'docker compose -f docker-compose.dev.yml up' to start the development environment"
echo "5. Visit http://localhost:3001 for the frontend"
echo "6. Visit http://localhost:5001 for the backend API"
echo ""
echo "🐳 Docker commands:"
echo "  Start services: docker compose -f docker-compose.dev.yml up"
echo "  Start in background: docker compose -f docker-compose.dev.yml up -d"
echo "  Stop services: docker compose -f docker-compose.dev.yml down"
echo "  View logs: docker compose -f docker-compose.dev.yml logs -f"
echo ""
echo "🔧 Development commands (for running without Docker):"
echo "  Backend dev: cd backend && npm run dev"
echo "  Frontend dev: cd frontend && npm run dev"
echo "  Note: Requires local MongoDB connection in backend/.env"
