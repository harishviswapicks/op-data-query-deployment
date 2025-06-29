from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
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
    try:
        print("🗄️ Creating database tables...")
        create_tables()
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        # Don't crash the app, but log the error
        import traceback
        traceback.print_exc()



# CORS middleware for production - Dynamic Vercel URL support
allowed_origins = [
    # Local development
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:3002"
]

# Add production origins from environment
cors_origins = os.getenv("ALLOWED_ORIGINS")
if cors_origins:
    allowed_origins.extend([origin.strip() for origin in cors_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    # Allow all Vercel deployment URLs dynamically
    allow_origin_regex=r"^https://.*\.vercel\.app$|^http://localhost:(3000|3001|3002)$",
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
app.include_router(slack_bot_router, prefix="/api", tags=["slack-bot"])

@app.get("/")
async def root():
    return {"message": "AI Data Platform - Analyst Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "analyst-backend"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
