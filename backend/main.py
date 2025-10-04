import os
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL", "<your-supabase-url>")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "<your-service-role-key>")

app = FastAPI()

class Reading(BaseModel):
    session_id: str
    temp: float
    ax: float
    ay: float
    az: float
    deviceTs: int

class SessionStart(BaseModel):
    device_id: str

class SessionStop(BaseModel):
    session_id: str

@app.post("/readings")
def proxy_reading(reading: Reading):
    url = f"{SUPABASE_URL}/rest/v1/readings"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    resp = requests.post(url, json=reading.dict(), headers=headers)
    if resp.status_code != 201:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return {"status": "ok"}

@app.post("/sessions/start")
def start_session(data: SessionStart):
    url = f"{SUPABASE_URL}/rest/v1/sessions"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    payload = {"device_id": data.device_id}
    resp = requests.post(url, json=payload, headers=headers)
    if resp.status_code != 201:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()

@app.post("/sessions/stop")
def stop_session(data: SessionStop):
    url = f"{SUPABASE_URL}/rest/v1/sessions?id=eq.{data.session_id}"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    payload = {"stopped_at": "now()"}
    resp = requests.patch(url, json=payload, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()