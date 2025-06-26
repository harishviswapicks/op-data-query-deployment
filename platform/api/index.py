from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from mangum import Mangum

# Import routers from local api directory
from routers import chat, bigquery, research, analytics, charts, scheduling, auth

# Create FastAPI app
app = FastAPI(
    title="AI Data Platform - Production API",
    description="FastAPI backend for the AI Data Platform deployed on Vercel",
    version="1.0.0"
)

# CORS middleware for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.vercel.app",
        "https://yourdomain.com",  # Replace with your actual domain
        "http://localhost:3000",   # For local development
        "http://localhost:3002"    # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(bigquery.router, prefix="/api/bigquery", tags=["bigquery"])
app.include_router(research.router, prefix="/api/research", tags=["research"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(charts.router, prefix="/api/charts", tags=["charts"])
app.include_router(scheduling.router, prefix="/api/scheduling", tags=["scheduling"])

@app.get("/")
async def root():
    return {"message": "AI Data Platform - Production API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "production-backend"}

# Vercel serverless handler
handler = Mangum(app)
