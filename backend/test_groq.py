import os
import urllib.request
import json

api_key = os.getenv("GROQ_API_KEY")
req = urllib.request.Request(
    "https://api.groq.com/openai/v1/models",
    headers={"Authorization": f"Bearer {api_key}"}
)
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode())
    print([m["id"] for m in data.get("data", [])])
