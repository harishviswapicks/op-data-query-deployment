# 🚀 Deployment Instructions

## Quick Deploy to Vercel

Your application is now ready to deploy! Follow these steps:

### 1. Create Environment Files

First, create your local environment file:

```bash
# In the root directory, create .env.example with:
cp .env.example .env.local

# Edit .env.local with your actual values:
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Deploy to Vercel

```bash
# Make sure you're in the project root
cd /Users/harish.viswanathan/Downloads/operational-data-querying

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - What's your project's name? ai-data-platform
# - In which directory is your code located? ./platform
```

### 3. Set Environment Variables in Vercel

After deployment, go to your Vercel dashboard and add these environment variables:

**Required for Basic Functionality:**
```
NEXT_PUBLIC_API_URL=https://your-app-name.vercel.app/api
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-production-jwt-secret-make-it-long-and-random
NEXTAUTH_SECRET=your-production-nextauth-secret-also-long-and-random
NEXTAUTH_URL=https://your-app-name.vercel.app
NODE_ENV=production
PYTHONPATH=/var/task
```

**Optional (for full features):**
```
BIGQUERY_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
NOTION_API_KEY=secret_your-notion-api-key
```

### 4. Test Your Deployment

After setting environment variables, your app will be available at:
`https://your-app-name.vercel.app`

**Test these features:**
- ✅ Authentication (register/login)
- ✅ Chat interface (both quick and deep modes)
- ✅ Track switching (Analyst/General)
- ✅ Basic functionality

### 5. Update CORS for Production

The backend is already configured to accept requests from Vercel domains (`*.vercel.app`).

## Architecture Overview

**✅ What's Deployed:**
- **Frontend**: Next.js app with full UI
- **Backend**: FastAPI as Vercel serverless functions
- **Database**: SQLite (built-in for demo)
- **Authentication**: Local JWT-based auth
- **Integrations**: Ready for BigQuery, Slack, Notion

**🔧 How It Works:**
1. Frontend (`/platform/`) deployed as static site
2. Backend (`/platform/api/`) deployed as serverless functions
3. All API calls go to `/api/*` routes
4. Database included in deployment
5. Authentication works offline

## Troubleshooting

**If deployment fails:**
```bash
# Check build locally first
cd platform
npm run build

# If successful, try deploying again
vercel --prod
```

**If API doesn't work:**
1. Check environment variables are set in Vercel dashboard
2. Check function logs: `vercel logs`
3. Test API endpoint: `curl https://your-app.vercel.app/api/health`

**If authentication fails:**
1. Ensure `JWT_SECRET` and `NEXTAUTH_SECRET` are set
2. Check that `NEXTAUTH_URL` matches your domain
3. Clear browser cookies and try again

## Next Steps After Deployment

1. **Upgrade Database** (optional): Switch from SQLite to PostgreSQL for better performance
2. **Add Integrations**: Configure BigQuery, Slack, and Notion APIs
3. **Custom Domain**: Add your own domain in Vercel settings
4. **Monitoring**: Set up Vercel analytics and error tracking

Your AI Data Platform is now live! 🎉 