# Vercel Deployment Guide

## Overview
This project is configured to deploy to Vercel with the FastAPI backend running as serverless functions and the Next.js frontend as a static site.

## Pre-deployment Setup

### 1. Environment Variables
Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_API_URL`: Will be set to your Vercel app URL + `/api`
- `DATABASE_URL`: Your production database URL (consider upgrading from SQLite for production)
- `JWT_SECRET`: A secure random string for JWT tokens
- `BIGQUERY_PROJECT_ID`: Your Google Cloud project ID
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: Your service account JSON as a string

### 2. Database Migration (Production)
For production, consider migrating from SQLite to PostgreSQL:

1. Update `platform/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Set up a PostgreSQL database (Vercel Postgres, Railway, etc.)

3. Update `DATABASE_URL` in your environment variables

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy to Vercel
```bash
# From the project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - What's your project's name? ai-data-platform
# - In which directory is your code located? ./platform
```

### 3. Set Environment Variables in Vercel
In your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all the variables from your `.env.example`

### 4. Redeploy
```bash
vercel --prod
```

## Architecture

### Frontend (Next.js)
- Deployed as static site on Vercel
- Located in `/platform` directory
- Handles authentication, UI, and client-side logic

### Backend (FastAPI)
- Deployed as Vercel serverless functions
- Located in `/platform/api/` directory
- Handles API requests, BigQuery integration, and data processing

### Database
- SQLite for development (included in repo)
- PostgreSQL recommended for production
- Prisma ORM for database operations

## Post-Deployment Configuration

### 1. Update CORS Origins
Update the CORS origins in `/platform/api/index.py` with your actual domain:
```python
allow_origins=[
    "https://your-app-name.vercel.app",
    "https://yourdomain.com",
]
```

### 2. Set up BigQuery Service Account
1. Create a service account in Google Cloud Console
2. Grant BigQuery permissions
3. Download the JSON key file
4. Add the JSON content as `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable

### 3. Test the Deployment
Visit your Vercel app URL and test:
- Authentication flow
- API endpoints at `https://your-app.vercel.app/api/health`
- BigQuery connections
- Chart generation

## Monitoring and Debugging

### Vercel Function Logs
```bash
vercel logs
```

### Local Development
```bash
cd platform
npm run dev
```

### API Testing
```bash
curl https://your-app.vercel.app/api/health
```

## Troubleshooting

### Common Issues
1. **Import errors**: Ensure all backend dependencies are in `requirements.txt`
2. **CORS errors**: Update allowed origins in production
3. **Database errors**: Ensure DATABASE_URL is correctly set
4. **Environment variables**: Double-check all required vars are set in Vercel

### Performance Optimization
1. Enable Edge Runtime for faster cold starts
2. Use Vercel's built-in caching
3. Optimize BigQuery queries
4. Consider using Vercel's KV storage for session management

## Security Considerations
1. Use strong JWT secrets
2. Implement proper input validation
3. Set up proper CORS policies
4. Use HTTPS only in production
5. Secure your BigQuery service account keys
