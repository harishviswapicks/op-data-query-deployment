#!/bin/bash

# Build script for Vercel deployment preparation

echo "🚀 Preparing for Vercel deployment..."

# Change to platform directory
cd platform

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build the Next.js app
echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build preparation complete!"
echo "🌐 Ready to deploy to Vercel!"
echo ""
echo "Next steps:"
echo "1. Run 'vercel' to deploy"
echo "2. Set environment variables in Vercel dashboard"
echo "3. Update CORS origins in production"
