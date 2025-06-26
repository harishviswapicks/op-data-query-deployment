# 🧪 Local Backend-Frontend Integration Test

## ✅ Current Status

### **Backend (FastAPI)** - http://127.0.0.1:8000
- ✅ **Server Running:** Uvicorn on port 8000
- ✅ **Database:** SQLite with 56KB data
- ✅ **Health Check:** `{"status":"healthy","service":"analyst-backend"}`
- ✅ **Authentication:** JWT + bcrypt working
- ✅ **Test User:** `demo@prizepicks.com` / `demo123456` created

### **Frontend (Next.js)** - http://localhost:3000  
- ✅ **Server Running:** Next.js dev server with Turbopack
- ✅ **Environment:** `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
- ✅ **API Client:** Complete TypeScript client ready

## 🔬 **Integration Tests to Run**

### **1. Test Authentication Flow**
Visit http://localhost:3000 and:
1. Try to login with: `demo@prizepicks.com` / `demo123456`
2. Should successfully authenticate and get JWT token
3. Should redirect to main application interface

### **2. Test API Connectivity**
In browser console at http://localhost:3000:
```javascript
// Test backend health
fetch('http://127.0.0.1:8000/health')
  .then(r => r.json())
  .then(console.log)

// Test frontend API routes
fetch('/api/user/profile')
  .then(r => r.json())
  .then(console.log)
```

### **3. Test Chat Integration**
1. Login to the application
2. Send a test message in the chat
3. Verify it's sent to backend at `POST /api/chat/send`
4. Check database for message storage

### **4. Database Verification**
From backend directory:
```bash
cd backend
sqlite3 app.db ".tables"
sqlite3 app.db "SELECT * FROM users;"
sqlite3 app.db "SELECT * FROM chat_messages;"
```

## 🎯 **Expected Integration Flow**

```
User Browser (localhost:3000)
    ↓ Login Form
Frontend Next.js API Route (/api/auth/login)
    ↓ Proxy Request
Backend FastAPI (127.0.0.1:8000/api/auth/login)
    ↓ Authenticate
SQLite Database (app.db)
    ↓ Return JWT
Frontend UI (Store token, redirect)
    ↓ Authenticated Requests
Backend API Routes (All endpoints)
    ↓ Database Operations
SQLite Database (Persist data)
```

## 🚨 **Known Issues to Check**

1. **CORS:** Backend allows localhost:3000 ✅
2. **Environment:** Frontend points to 127.0.0.1:8000 ✅  
3. **Database:** SQLite file exists and has tables ✅
4. **JWT:** Secret keys match between frontend/backend ✅

## 🔧 **Quick Debug Commands**

```bash
# Check if both servers are running
ps aux | grep -E "(uvicorn|next)"

# Test backend directly
curl http://127.0.0.1:8000/health

# Test frontend loading
curl http://localhost:3000

# Check database
cd backend && sqlite3 app.db ".schema users"

# View logs
# Backend: Check terminal where uvicorn is running
# Frontend: Check browser console and terminal where npm run dev is running
```

## 📊 **Success Criteria**

- [ ] Backend API responds to health checks
- [ ] Frontend loads at localhost:3000
- [ ] Authentication works (login with demo user)
- [ ] Chat messages can be sent
- [ ] Database stores messages
- [ ] JWT tokens work for authenticated routes
- [ ] No CORS errors in browser console

Once all tests pass, the integration is ready for production deployment! 🚀 