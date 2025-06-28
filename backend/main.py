from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
import re
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

from routers import chat, bigquery, research, analytics, charts, scheduling, auth
from slack_bot_handler import router as slack_bot_router
from database import create_tables

app = FastAPI(
    title="AI Data Platform - Production Backend",
    description="FastAPI backend for the AI Data Platform deployed to production",
    version="1.0.0"
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# CORS function to validate Vercel domains
def is_allowed_origin(origin: str) -> bool:
    """Check if origin is allowed based on patterns"""
    if not origin:
        return False
    
    # Local development
    if origin in ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]:
        return True
    
    # Vercel domains
    vercel_patterns = [
        r"^https://operational-data-querying.*\.vercel\.app$",
        r"^https://.*\.vercel\.app$"
    ]
    
    for pattern in vercel_patterns:
        if re.match(pattern, origin):
            return True
    
    return False

# CORS middleware for production - Dynamic Vercel URL support
# Custom CORS middleware that dynamically handles Vercel URLs
@app.middleware("http")
async def cors_handler(request, call_next):
    # Get the origin from the request
    origin = request.headers.get("origin")
    
    # Process the request
    response = await call_next(request)
    
    # Check if origin should be allowed
    if origin and is_allowed_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    # Handle preflight requests
    if request.method == "OPTIONS":
        if origin and is_allowed_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

# Fallback CORS middleware for basic functionality
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development only
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:3002"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(auth.router, prefix="/api/user", tags=["user"])  # Add user endpoints
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(bigquery.router, prefix="/api/bigquery", tags=["bigquery"])
app.include_router(research.router, prefix="/api/research", tags=["research"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(charts.router, prefix="/api/charts", tags=["charts"])
app.include_router(scheduling.router, prefix="/api/scheduling", tags=["scheduling"])
app.include_router(slack_bot_router, prefix="/api", tags=["slack-bot"])

@app.get("/")
async def root():
    return {"message": "AI Data Platform - Analyst Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "analyst-backend"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
