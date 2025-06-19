# Frontend-Backend Integration Guide

This document explains how the frontend has been configured to connect to the FastAPI backend, with fallback to local functionality when the backend is not available.

## Overview

The frontend now includes:
- **API Client Library** (`platform/src/lib/api.ts`) - Comprehensive client for all backend endpoints
- **Backend Health Monitoring** - Automatic detection of backend availability
- **Graceful Fallback** - Local functionality when backend is unavailable
- **Auth Integration** - Hybrid auth system (local + backend ready)
- **Real-time Status** - Backend connectivity indicator in the UI

## Key Components

### 1. API Client (`platform/src/lib/api.ts`)

A comprehensive TypeScript client that provides methods for all backend endpoints:

```typescript
// Auth endpoints
await apiClient.validateToken()
await apiClient.getCurrentUser()

// Chat endpoints  
await apiClient.sendMessage({
  message: "What are our KPIs?",
  agent_mode: "quick",
  user_id: "user123"
})

// BigQuery endpoints
await apiClient.getTables()
await apiClient.executeQuery({ sql: "SELECT * FROM table", user_id: "user123" })

// Research, Analytics, Charts, Scheduling endpoints...
```

### 2. Backend Status Component (`platform/src/components/common/BackendStatus.tsx`)

Shows real-time backend connectivity status in the UI:
- 🟢 **Backend Connected** - Full functionality available
- 🟠 **Local Mode** - Backend unavailable, using local fallback

### 3. Enhanced Auth Provider (`platform/src/components/auth/AuthProvider.tsx`)

Hybrid authentication system:
- Checks backend availability on startup
- Falls back to local Prisma/SQLite auth when backend is down
- Automatically switches to backend auth when available

### 4. Updated Chatbot (`platform/src/components/chatbot.tsx`)

Smart chat functionality:
- Uses backend API when available
- Falls back to mock responses when backend is down
- Supports both quick and deep research modes
- Tracks research jobs and provides rich responses

## Backend Endpoints Integrated

### Authentication (`/api/auth/`)
- `POST /api/auth/validate` - Validate JWT token
- `POST /api/auth/refresh` - Refresh JWT token  
- `GET /api/auth/me` - Get current user info

### Chat (`/api/chat/`)
- `POST /api/chat/send` - Send message to AI agent
- `GET /api/chat/history/{user_id}` - Get chat history
- `DELETE /api/chat/history/{user_id}` - Clear chat history
- `POST /api/chat/upgrade-to-deep` - Upgrade to deep research

### BigQuery (`/api/bigquery/`)
- `GET /api/bigquery/tables` - List available tables
- `POST /api/bigquery/query` - Execute SQL query

### Research (`/api/research/`)
- `POST /api/research/jobs` - Create research job
- `GET /api/research/jobs/{job_id}` - Get job status
- `GET /api/research/jobs/user/{user_id}` - Get user's jobs

### Analytics (`/api/analytics/`)
- `GET /api/analytics/presets` - Get quick analysis presets
- `POST /api/analytics/run` - Run analytics preset

### Charts (`/api/charts/`)
- `POST /api/charts/create` - Create chart from data

### Scheduling (`/api/scheduling/`)
- `POST /api/scheduling/reports` - Create scheduled report
- `GET /api/scheduling/reports/user/{user_id}` - Get user's reports
- `PUT /api/scheduling/reports/{report_id}` - Update report
- `DELETE /api/scheduling/reports/{report_id}` - Delete report

## Configuration

### Environment Variables

Create `platform/.env.local`:

```bash
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Database Configuration (for local auth fallback)
DATABASE_URL="file:./prisma/dev.db"

# Environment
NODE_ENV=development
```

### Backend CORS Configuration

The backend is already configured to allow requests from the frontend:

```python
# In backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Usage Examples

### Starting Both Services

1. **Start the Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

2. **Start the Frontend:**
```bash
cd platform
npm run dev
```

### Testing the Integration

1. **With Backend Running:**
   - Frontend will show "Backend Connected" status
   - Chat messages will be sent to FastAPI backend
   - All API endpoints will be available

2. **Without Backend Running:**
   - Frontend will show "Local Mode" status  
   - Chat will use mock responses
   - Auth will use local Prisma database
   - All UI functionality remains available

### Chat Integration Example

When you send a message in the chat:

```typescript
// Frontend automatically detects backend availability
const backendAvailable = await checkBackendHealth();

if (backendAvailable) {
  // Use real backend API
  const response = await apiClient.sendMessage({
    message: userMessage.content,
    agent_mode: isDeepResearch ? 'deep' : 'quick',
    user_id: username,
    context: {
      dataSources: ['bigquery', 'analytics'],
      sessionId: sessionId,
    }
  });
} else {
  // Use mock response for demo
  const mockResponse = generateMockResponse(userMessage.content);
}
```

## Next Steps

### For Backend Development

1. **Implement Auth Endpoints:**
   - JWT token validation in `backend/routers/auth.py`
   - User management and session handling

2. **Implement Chat Endpoints:**
   - Message processing in `backend/routers/chat.py`
   - Integration with AI agents (quick/deep modes)

3. **Add Database Integration:**
   - User management
   - Chat history storage
   - Research job tracking

### For Frontend Enhancement

1. **Add Real-time Features:**
   - WebSocket connection for live updates
   - Research job progress tracking
   - Real-time notifications

2. **Enhanced Error Handling:**
   - Retry mechanisms for failed requests
   - Better error messages and recovery

3. **Caching and Performance:**
   - Cache API responses
   - Optimistic updates
   - Background data fetching

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure backend CORS is configured for your frontend URL
   - Check that `NEXT_PUBLIC_API_URL` matches your backend URL

2. **Backend Not Detected:**
   - Verify backend is running on the correct port (8000)
   - Check network connectivity
   - Look for CORS or firewall issues

3. **Auth Issues:**
   - Ensure local database is set up (`npm run db:push`)
   - Check that session cookies are being set correctly

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```bash
NEXT_PUBLIC_DEBUG=true
```

This will show detailed API request/response logs in the browser console.

## Architecture Benefits

1. **Resilient Design:** Frontend works with or without backend
2. **Progressive Enhancement:** Features activate as backend comes online
3. **Type Safety:** Full TypeScript integration with proper error handling
4. **User Experience:** Seamless fallback with clear status indicators
5. **Developer Experience:** Easy to test and develop both services independently

The integration is designed to be robust, user-friendly, and developer-friendly, allowing for smooth development and deployment of both frontend and backend services.
