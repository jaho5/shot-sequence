import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_database
from .routes import router

# Initialize database on startup
init_database()

app = FastAPI(
    title="Shot Sequence API",
    description="API for managing shot sequences in sports training",
    version="1.0.0"
)

# CORS middleware for cross-origin requests
# In development, allow localhost:3000. In production, only allow GitHub Pages
is_development = os.getenv("ENVIRONMENT", "production") == "development"

allowed_origins = [
    "https://jaho5.github.io",  # GitHub Pages domain
    "https://jaho5.github.io/shot-sequence",  # GitHub Pages app URL
]

if is_development:
    allowed_origins.append("http://localhost:3000")  # React dev server

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

@app.get("/")
async def root():
    return {"message": "Shot Sequence API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}