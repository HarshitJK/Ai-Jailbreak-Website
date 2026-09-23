"""
db.py — Motor async MongoDB client.

Reads MONGO_URI and MONGO_DB_NAME from environment variables.
Exposes get_db() as a FastAPI dependency that yields the database handle.
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "ai_jailbreak")

# Module-level client — created once, reused across requests
_client: AsyncIOMotorClient | None = None


def get_motor_client() -> AsyncIOMotorClient:
    """Return (or lazily create) the shared Motor client."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGO_URI)
    return _client


async def ping_db() -> None:
    """Ping the database to verify connection. Fails fast if connection fails."""
    client = get_motor_client()
    try:
        await client.admin.command('ping')
    except Exception as exc:
        raise RuntimeError(
            f"Failed to connect to MongoDB Atlas at {MONGO_URI}. "
            f"Please check your password and IP whitelist. Error: {exc}"
        ) from exc


async def get_db() -> AsyncIOMotorDatabase:
    """
    FastAPI dependency that yields the Motor database handle.

    Usage in a route:
        async def my_route(db: AsyncIOMotorDatabase = Depends(get_db)):
            ...
    """
    client = get_motor_client()
    return client[MONGO_DB_NAME]


async def close_motor_client() -> None:
    """Close the Motor client — call from app shutdown handler."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
