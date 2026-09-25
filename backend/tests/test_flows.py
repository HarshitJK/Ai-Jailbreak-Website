import asyncio
import httpx
from pymongo import MongoClient
import os

async def test():
    admin_user = os.getenv("ADMIN_USERNAME", "admin")
    admin_pass = os.getenv("ADMIN_PASSWORD", "admin")
    
    base_url = "http://localhost:4000"
    
    async with httpx.AsyncClient(base_url=base_url) as client:
        # Register a team
        team_name = "test_team_r2"
        res = await client.post("/api/register", json={
            "team_name": team_name,
            "email": "test@test.com",
            "password": "pass"
        })
        if res.status_code == 409:
            res = await client.post("/api/login", json={
                "team_name": team_name,
                "password": "pass"
            })
            
        # Admin login to get session cookie
        await client.post("/api/admin/login", json={
            "username": admin_user,
            "password": admin_pass
        })

        # Check /api/me
        res = await client.get("/api/me")
        print("/api/me:", res.json())
        
        # Start Round 2
        res = await client.post("/api/admin/round2/start")
        print("Start Round 2:", res.json())
        
        # Try chat
        res = await client.post("/api/round2/chat", json={"message": "hello"})
        print("Chat (not qualified):", res.status_code, res.json())
        
        res = await client.post(f"/api/admin/teams/{team_name}/qualify")
        print("Qualify team:", res.json())
        
        # Check /api/me again
        res = await client.get("/api/me")
        print("/api/me (qualified):", res.json())
        
        # Try chat again
        res = await client.post("/api/round2/chat", json={"message": "hello"})
        print("Chat (qualified, open):", res.status_code, res.json())
        
        # Stop Round 2
        res = await client.post("/api/admin/round2/stop")
        print("Stop Round 2:", res.json())
        
        # Try chat again
        res = await client.post("/api/round2/chat", json={"message": "hello"})
        print("Chat (qualified, closed):", res.status_code, res.json())

if __name__ == "__main__":
    asyncio.run(test())
