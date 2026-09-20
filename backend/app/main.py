"""
FastAPI app; CORSMiddleware allowing the frontend's origin from .env; mounts the chat, auth, and health routers.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import chat, health
from app.routers import auth
from app.db import get_motor_client, close_motor_client

load_dotenv()  # take environment variables from .env.


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialise the Motor client. Shutdown: close it cleanly."""
    # Eagerly create the Motor client so the first request isn't slower
    client = get_motor_client()
    print(f"[startup] Connected to MongoDB at {os.getenv('MONGO_URI', 'mongodb://localhost:27017')}")
    yield
    await close_motor_client()
    print("[shutdown] MongoDB connection closed.")


app = FastAPI(title="AI Jailbreak Backend", version="1.0.0", lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Mount routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(chat.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 4000)), reload=True)