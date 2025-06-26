# 🚀 Production Deployment Guide

## Overview
Deploy your fully integrated AI Data Platform to production with:
- **Backend**: FastAPI on Railway/Render
- **Frontend**: Next.js on Vercel
- **Database**: SQLite (upgradable to PostgreSQL)

## 📋 Current Status
- ✅ Local integration working perfectly
- ✅ Backend: FastAPI with SQLite database
- ✅ Frontend: Next.js with full UI
- ✅ Authentication: JWT-based with working users
- ✅ Git: Latest changes committed

## 🎯 Deployment Strategy

### **Step 1: Deploy Backend to Railway** 

1. **Go to [Railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Create new project from GitHub**
4. **Select**: `operational-data-querying` repository
5. **Set root directory**: `/backend`
6. **Railway will auto-detect** the Dockerfile and deploy

**Environment Variables to Set in Railway:**
```bash
DATABASE_URL=sqlite:///./data/app.db
JWT_SECRET=your-production-jwt-secret-change-this
PYTHONPATH=/app
PORT=8000
```

### **Step 2: Get Backend URL**
After Railway deployment, you'll get a URL like:
`https://your-app-name-production.up.railway.app`

### **Step 3: Update Frontend Environment**
```bash
cd platform
echo 'NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app' > .env.local
```

### **Step 4: Deploy Frontend to Vercel**
```bash
vercel --prod
```

## 🔧 **Alternative: Deploy Backend to Render**

If you prefer Render over Railway:

1. **Go to [Render.com](https://render.com)**
2. **Create new Web Service**
3. **Connect GitHub repository**
4. **Settings:**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Root Directory: `backend`

## 📊 **Production Architecture**

```
User Browser
    ↓
Vercel (Frontend - Next.js)
    ↓ API Calls
Railway/Render (Backend - FastAPI)
    ↓ Database Operations  
SQLite Database (Persistent Volume)
```

## 🔒 **Production Environment Variables**

### **Backend (Railway/Render):**
```bash
DATABASE_URL=sqlite:///./data/app.db
JWT_SECRET=your-super-secret-production-key-32-chars-min
ENVIRONMENT=production
PORT=8000
PYTHONPATH=/app
```

### **Frontend (Vercel):**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NODE_ENV=production
```

## 🧪 **Test Production Deployment**

After deployment:

1. **Test Backend Health:**
   ```bash
   curl https://your-backend.railway.app/health
   ```

2. **Test Authentication:**
   ```bash
   curl -X POST https://your-backend.railway.app/api/auth/set-password \
        -H "Content-Type: application/json" \
        -d '{"email": "admin@prizepicks.com", "password": "admin123456"}'
   ```

3. **Test Frontend:**
   - Visit your Vercel URL
   - Login with the admin account
   - Test chat functionality

## 🚀 **Quick Deploy Commands**

```bash
# 1. Commit current changes
git add .
git commit -m "feat: Production deployment configuration"
git push origin deployment/vercel-integration

# 2. Deploy backend to Railway (manual setup required)
# - Go to railway.app
# - Connect GitHub repo
# - Set root directory to /backend

# 3. Update frontend environment
cd platform
echo 'NEXT_PUBLIC_API_URL=https://your-backend.railway.app' > .env.local

# 4. Deploy frontend to Vercel
vercel --prod
```

## 📈 **Next Steps After Deployment**

1. **Database Upgrade:** Switch to PostgreSQL for production scaling
2. **Monitoring:** Add logging and error tracking
3. **Security:** Configure production secrets and SSL
4. **Scaling:** Set up auto-scaling based on traffic

## 🔍 **Monitoring & Debugging**

- **Backend Logs:** Railway/Render dashboard
- **Frontend Logs:** Vercel dashboard  
- **Database:** SQLite browser or upgrade to PostgreSQL admin
- **Health Checks:** `/health` endpoint monitoring

Your AI Data Platform will be fully operational in production! 🎉 