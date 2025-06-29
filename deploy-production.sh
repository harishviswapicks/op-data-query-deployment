#!/bin/bash

# Production Deployment Script for AI Data Platform
echo "🚀 Starting Production Deployment..."

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

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "deployment/internal-MVP" ]; then
    print_error "Please switch to deployment/internal-MVP branch before deploying"
    exit 1
fi

print_status "Current branch: $CURRENT_BRANCH ✓"

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Commit them before deploying?"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build and push to git
print_status "Committing and pushing changes..."
git add .
git commit -m "Production deployment fixes - $(date '+%Y-%m-%d %H:%M:%S')" || true
git push origin deployment/internal-MVP

print_success "Code pushed to remote repository"

# Deploy to Railway (Backend)
print_status "Deploying backend to Railway..."
print_warning "Make sure these environment variables are set in Railway:"
echo "  - DATABASE_URL (PostgreSQL URL)"
echo "  - JWT_SECRET (Strong secret key)"
echo "  - REDIS_URL (Redis connection string)"
echo "  - GOOGLE_API_KEY (Google AI API key)"
echo "  - ALLOWED_ORIGINS (Frontend URLs, comma-separated)"
echo "  - SLACK_BOT_TOKEN (If using Slack integration)"
echo "  - NOTION_API_KEY (If using Notion integration)"

# Deploy to Vercel (Frontend)
print_status "Deploying frontend to Vercel..."
cd platform

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed. Install it with: npm i -g vercel"
    exit 1
fi

# Set production environment variables for Vercel
print_status "Setting Vercel environment variables..."
vercel env add NEXT_PUBLIC_API_URL production <<< "https://operational-data-querying-production.up.railway.app"
vercel env add NODE_ENV production <<< "production"

# Deploy to Vercel
print_status "Deploying to Vercel..."
vercel --prod

print_success "Deployment completed!"

# Post-deployment checks
print_status "Running post-deployment checks..."

# Check backend health
BACKEND_URL="https://operational-data-querying-production.up.railway.app"
print_status "Checking backend health..."
if curl -f -s "$BACKEND_URL/health" > /dev/null; then
    print_success "Backend is healthy ✓"
else
    print_error "Backend health check failed ✗"
fi

# Check frontend
FRONTEND_URL="https://platform-iota-plum.vercel.app"
print_status "Checking frontend..."
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    print_success "Frontend is accessible ✓"
else
    print_error "Frontend health check failed ✗"
fi

print_success "🎉 Deployment process completed!"
print_status "Backend URL: $BACKEND_URL"
print_status "Frontend URL: $FRONTEND_URL"

echo ""
print_warning "If you encounter issues:"
echo "1. Check Railway logs: railway logs"
echo "2. Check Vercel deployment logs in the dashboard"
echo "3. Verify all environment variables are set correctly"
echo "4. Test the authentication flow manually" 