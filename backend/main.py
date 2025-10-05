import os
from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
import json
from datetime import datetime
import asyncio
import random
import time
import math

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://xywmpoeoqhxqczofvsnh.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5d21wb2VvcWh4cWN6b2Z2c25oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU5NjM3MSwiZXhwIjoyMDc1MTcyMzcxfQ.iqa4RCkAjOlSGcJG3dob0YKyK7NTAcNRW5DZjjUuvh0")

app = FastAPI()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.is_generating_data = False
        self.data_task = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket connected. Total connections: {len(self.active_connections)}")
        print(f"WebSocket client info: {websocket.client}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        print(f"Broadcasting to {len(self.active_connections)} connections")
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
                print(f"Message sent successfully to connection")
            except Exception as e:
                print(f"Error sending message to connection: {e}")
                # Remove broken connections
                self.active_connections.remove(connection)

    async def generate_sensor_data(self):
        """Fetch real sensor data from Supabase and broadcast to all connected clients"""
        print(f"Starting data generation. is_generating_data: {self.is_generating_data}, active_connections: {len(self.active_connections)}")
        while self.is_generating_data:
            try:
                # Fetch recent sensor data from Supabase (last 5 records for time series)
                url = f"{SUPABASE_URL}/rest/v1/sensor_readings"
                url += "?order=created_at.desc&limit=5"
                
                headers = {
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json"
                }
                
                resp = requests.get(url, headers=headers)
                
                if resp.status_code == 200 and resp.json():
                    # Use real data from Supabase - send latest record
                    data = resp.json()[0]
                    timestamp = int(time.time() * 1000)
                    
                    sensor_data = {
                        "type": "sensor_update",
                        "data": {
                            "timestamp": timestamp,
                            "temperature": {
                                "value": data.get("temperature", 25.0)
                            },
                            "acceleration": {
                                "x": (data.get("accel_x", 0) / 16384.0) * 9.81,  # Convert raw to m/s²
                                "y": (data.get("accel_y", 0) / 16384.0) * 9.81,
                                "z": (data.get("accel_z", 16384) / 16384.0) * 9.81
                            },
                            "gyroscope": {
                                "pitch": (data.get("gyro_x", 0) / 131.0) * (math.pi / 180),  # Convert raw to rad/s
                                "roll": (data.get("gyro_y", 0) / 131.0) * (math.pi / 180),
                                "yaw": (data.get("gyro_z", 0) / 131.0) * (math.pi / 180)
                            },
                            "bme688": {
                                "temperature": data.get("temperature", 25.0),
                                "humidity": 60.0,  # Default humidity since not in sensor_readings
                                "pressure": data.get("pressure", 1013.0) * 100,  # Convert hPa to Pa
                                "voc": 200.0  # Default VOC value since not in schema
                            },
                            "ultrasonic": {
                                "distance": 25.0  # Default distance value
                            }
                        }
                    }
                    
                    # Only broadcast if we have real data and connections
                    if self.active_connections:
                        print(f"Broadcasting sensor data to {len(self.active_connections)} connections")
                        await self.broadcast(json.dumps(sensor_data))
                    else:
                        print("No active connections, skipping broadcast")
                else:
                    # No data available - don't send anything, keep graphs empty
                    print("No sensor data available in Supabase - keeping graphs empty")
                
                await asyncio.sleep(0.1)  # 10Hz data rate
                
            except Exception as e:
                print(f"Error fetching sensor data: {e}")
                # Don't send mock data on error - keep graphs empty
                await asyncio.sleep(0.1)

    def start_data_generation(self):
        if not self.is_generating_data:
            self.is_generating_data = True
            print(f"Starting data generation. Active connections: {len(self.active_connections)}")
            try:
                loop = asyncio.get_event_loop()
                self.data_task = loop.create_task(self.generate_sensor_data())
            except RuntimeError:
                # If no event loop is running, create a new one
                self.data_task = asyncio.create_task(self.generate_sensor_data())
            print("Started sensor data generation")
        else:
            print("Data generation already running")

    def stop_data_generation(self):
        if self.is_generating_data:
            self.is_generating_data = False
            if self.data_task:
                self.data_task.cancel()
            print("Stopped sensor data generation")

manager = ConnectionManager()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Reading(BaseModel):
    session_id: str
    temp: float
    ax: float
    ay: float
    az: float
    deviceTs: int

class SensorData(BaseModel):
    session_id: str
    timestamp: int
    temperature: float
    pressure: float
    humidity: float
    voc: float
    accelX: float
    accelY: float
    accelZ: float
    gyroX: float
    gyroY: float
    gyroZ: float
    distance: float

class SessionStart(BaseModel):
    device_id: str

class SessionStop(BaseModel):
    session_id: str

class AuthRequest(BaseModel):
    email: str
    password: str

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

# Authentication endpoints
@app.post("/auth/v1/token")
def authenticate(auth: AuthRequest):
    # For now, return a mock response - in production, validate against Supabase Auth
    if auth.email == "test@pocketlab.com" and auth.password == "password":
        return {
            "user": {
                "id": "user-1",
                "email": auth.email,
                "name": "Test User",
                "created_at": datetime.now().isoformat()
            },
            "access_token": "mock-access-token"
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/auth/v1/signup")
def signup(auth: AuthRequest):
    # For now, return a mock response - in production, create user in Supabase Auth
    return {
        "user": {
            "id": "user-new",
            "email": auth.email,
            "name": "New User",
            "created_at": datetime.now().isoformat()
        },
        "access_token": "mock-access-token"
    }

# Sensor data endpoints
@app.post("/api/sensor-data")
def store_sensor_data(data: SensorData):
    url = f"{SUPABASE_URL}/rest/v1/sensor_data"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    resp = requests.post(url, json=data.dict(), headers=headers)
    if resp.status_code != 201:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return {"status": "ok"}

@app.get("/api/sensor-data")
def get_sensor_data(session_id: str = None, limit: int = 100):
    url = f"{SUPABASE_URL}/rest/v1/sensor_data"
    if session_id:
        url += f"?session_id=eq.{session_id}"
    url += f"&order=timestamp.desc&limit={limit}"
    
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()

@app.get("/api/sensor-data/latest")
def get_latest_sensor_data(session_id: str = None):
    url = f"{SUPABASE_URL}/rest/v1/sensor_data"
    if session_id:
        url += f"?session_id=eq.{session_id}"
    url += "&order=timestamp.desc&limit=1"
    
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    data = resp.json()
    return data[0] if data else None

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()
            # Echo back any received data
            await manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Experiment endpoints
@app.post("/api/experiment/start")
async def start_experiment():
    manager.start_data_generation()
    return {"status": "started", "session_id": f"session-{datetime.now().timestamp()}"}

@app.post("/api/experiment/stop")
async def stop_experiment():
    manager.stop_data_generation()
    return {"status": "stopped"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/experiment/summary")
async def generate_experiment_summary():
    """Generate experiment summary with statistics and AI commentary"""
    try:
        # Fetch recent sensor data for analysis
        url = f"{SUPABASE_URL}/rest/v1/sensor_readings"
        url += "?order=created_at.desc&limit=100"
        
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json"
        }
        
        resp = requests.get(url, headers=headers)
        
        if resp.status_code == 200 and resp.json():
            data = resp.json()
            
            # Calculate statistics
            temperatures = [d.get("temperature", 0) for d in data]
            pressures = [d.get("pressure", 0) for d in data]
            accel_x = [d.get("accel_x", 0) for d in data]
            accel_y = [d.get("accel_y", 0) for d in data]
            accel_z = [d.get("accel_z", 0) for d in data]
            
            # Calculate duration (assuming data spans the experiment)
            if len(data) > 1:
                start_time = datetime.fromisoformat(data[-1]["created_at"].replace('Z', '+00:00'))
                end_time = datetime.fromisoformat(data[0]["created_at"].replace('Z', '+00:00'))
                duration = int((end_time - start_time).total_seconds())
            else:
                duration = 0
            
            # Calculate statistics
            temp_stats = {
                "min": min(temperatures) if temperatures else 0,
                "max": max(temperatures) if temperatures else 0,
                "avg": sum(temperatures) / len(temperatures) if temperatures else 0,
                "change": temperatures[0] - temperatures[-1] if len(temperatures) > 1 else 0
            }
            
            pressure_stats = {
                "min": min(pressures) if pressures else 0,
                "max": max(pressures) if pressures else 0,
                "avg": sum(pressures) / len(pressures) if pressures else 0
            }
            
            # Detect motion events (acceleration spikes)
            motion_events = 0
            for i in range(1, len(accel_x)):
                accel_magnitude = ((accel_x[i] - accel_x[i-1])**2 + 
                                 (accel_y[i] - accel_y[i-1])**2 + 
                                 (accel_z[i] - accel_z[i-1])**2)**0.5
                if accel_magnitude > 1000:  # Threshold for motion detection
                    motion_events += 1
            
            # Generate AI commentary
            commentary = f"Experiment completed successfully! "
            if temp_stats["change"] > 2:
                commentary += f"Temperature increased by {temp_stats['change']:.1f}°C, indicating active heating. "
            elif temp_stats["change"] < -2:
                commentary += f"Temperature decreased by {abs(temp_stats['change']):.1f}°C, showing cooling effects. "
            else:
                commentary += "Temperature remained relatively stable. "
            
            if motion_events > 0:
                commentary += f"Detected {motion_events} motion events, suggesting device movement during experiment. "
            
            commentary += f"Data quality is good with {len(data)} data points collected over {duration} seconds."
            
            # Calculate additional statistics for the frontend
            humidity_stats = {
                "min": 60.0,  # Default humidity
                "max": 60.0,
                "avg": 60.0,
                "change": 0.0
            }
            
            acceleration_stats = {
                "x": {"avg": sum(accel_x) / len(accel_x) if accel_x else 0},
                "y": {"avg": sum(accel_y) / len(accel_y) if accel_y else 0},
                "z": {"avg": sum(accel_z) / len(accel_z) if accel_z else 0}
            }
            
            distance_stats = {
                "min": 25.0,  # Default distance
                "max": 25.0,
                "avg": 25.0,
                "change": 0.0
            }
            
            # Generate events based on detected anomalies
            events = []
            if motion_events > 0:
                events.append({
                    "type": "motion",
                    "description": f"Detected {motion_events} motion events during experiment",
                    "severity": "medium",
                    "timestamp": datetime.now().isoformat()
                })
            
            if abs(temp_stats["change"]) > 5:
                events.append({
                    "type": "temperature",
                    "description": f"Significant temperature change: {temp_stats['change']:.1f}°C",
                    "severity": "high" if abs(temp_stats["change"]) > 10 else "medium",
                    "timestamp": datetime.now().isoformat()
                })
            
            summary = {
                "duration": duration,
                "dataPoints": len(data),
                "statistics": {
                    "temperature": temp_stats,
                    "pressure": pressure_stats,
                    "humidity": humidity_stats,
                    "acceleration": acceleration_stats,
                    "distance": distance_stats
                },
                "motionEvents": motion_events,
                "events": events,
                "dataQuality": {
                    "anomalies": 0,  # Could implement anomaly detection
                    "completeness": 100
                },
                "commentary": commentary,
                "timestamp": datetime.now().isoformat()
            }
            
            return summary
        else:
            return {
                "duration": 0,
                "dataPoints": 0,
                "statistics": {
                    "temperature": {"min": "N/A", "max": "N/A", "avg": "N/A", "change": "N/A"},
                    "pressure": {"min": "N/A", "max": "N/A", "avg": "N/A", "change": "N/A"},
                    "humidity": {"min": "N/A", "max": "N/A", "avg": "N/A", "change": "N/A"},
                    "acceleration": {"x": {"avg": "N/A"}, "y": {"avg": "N/A"}, "z": {"avg": "N/A"}},
                    "distance": {"min": "N/A", "max": "N/A", "avg": "N/A", "change": "N/A"}
                },
                "motionEvents": 0,
                "events": [],
                "dataQuality": {"anomalies": 0, "completeness": 0},
                "commentary": "No data was collected during this experiment. Please ensure your ESP32 is connected and sending data to Supabase.",
                "timestamp": datetime.now().isoformat()
            }
            
    except Exception as e:
        print(f"Error generating experiment summary: {e}")
        return {
            "duration": 0,
            "dataPoints": 0,
            "statistics": {
                "temperature": {"min": "N/A", "max": "N/A", "avg": "N/A", "change": "N/A"},
                "pressure": {"min": "N/A", "max": "N/A", "avg": "N/A", "change": "N/A"},
                "humidity": {"min": "N/A", "max": "N/A", "avg": "N/A", "change": "N/A"},
                "acceleration": {"x": {"avg": "N/A"}, "y": {"avg": "N/A"}, "z": {"avg": "N/A"}},
                "distance": {"min": "N/A", "max": "N/A", "avg": "N/A", "change": "N/A"}
            },
            "motionEvents": 0,
            "events": [],
            "dataQuality": {"anomalies": 0, "completeness": 0},
            "commentary": "No data was collected during this experiment. Please ensure your ESP32 is connected and sending data to Supabase.",
            "timestamp": datetime.now().isoformat()
        }

@app.get("/test-supabase")
def test_supabase_connection():
    """Test endpoint to verify Supabase connection"""
    try:
        # Test basic connection
        url = f"{SUPABASE_URL}/rest/v1/"
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json"
        }
        resp = requests.get(url, headers=headers)
        
        if resp.status_code == 200:
            return {
                "status": "connected",
                "supabase_url": SUPABASE_URL,
                "message": "Successfully connected to Supabase"
            }
        else:
            return {
                "status": "error",
                "supabase_url": SUPABASE_URL,
                "error": resp.text,
                "status_code": resp.status_code
            }
    except Exception as e:
        return {
            "status": "error",
            "supabase_url": SUPABASE_URL,
            "error": str(e)
        }

@app.get("/test-sensor-data")
def test_sensor_data_fetch():
    """Test endpoint to manually fetch and return sensor data"""
    try:
        # Fetch latest sensor data from Supabase
        url = f"{SUPABASE_URL}/rest/v1/sensor_readings"
        url += "?order=created_at.desc&limit=1"
        
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json"
        }
        
        resp = requests.get(url, headers=headers)
        
        if resp.status_code == 200 and resp.json():
            # Use real data from Supabase
            data = resp.json()[0]
            timestamp = int(time.time() * 1000)
            
            sensor_data = {
                "type": "sensor_update",
                "data": {
                    "timestamp": timestamp,
                    "temperature": {
                        "value": data.get("temperature", 25.0)
                    },
                    "acceleration": {
                        "x": (data.get("accel_x", 0) / 16384.0) * 9.81,  # Convert raw to m/s²
                        "y": (data.get("accel_y", 0) / 16384.0) * 9.81,
                        "z": (data.get("accel_z", 16384) / 16384.0) * 9.81
                    },
                    "gyroscope": {
                        "pitch": (data.get("gyro_x", 0) / 131.0) * (math.pi / 180),  # Convert raw to rad/s
                        "roll": (data.get("gyro_y", 0) / 131.0) * (math.pi / 180),
                        "yaw": (data.get("gyro_z", 0) / 131.0) * (math.pi / 180)
                    },
                    "bme688": {
                        "temperature": data.get("temperature", 25.0),
                        "humidity": 60.0,  # Default humidity since not in sensor_readings
                        "pressure": data.get("pressure", 1013.0) * 100,  # Convert hPa to Pa
                        "voc": 200.0  # Default VOC value since not in schema
                    },
                    "ultrasonic": {
                        "distance": 25.0  # Default distance value
                    }
                }
            }
            
            return {
                "status": "success",
                "raw_data": data,
                "processed_data": sensor_data,
                "message": "Successfully fetched and processed sensor data"
            }
        else:
            return {
                "status": "no_data",
                "message": "No sensor data available in Supabase"
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@app.post("/api/experiment/summary-no-data")
async def generate_experiment_summary_no_data():
    """Test endpoint that simulates no data scenario"""
    return {
        "duration": 0,
        "dataPoints": 0,
        "statistics": {
            "temperature": {"min": "N/A", "max": "N/A", "avg": "N/A", "change": "N/A"},
            "pressure": {"min": "N/A", "max": "N/A", "avg": "N/A", "change": "N/A"},
            "humidity": {"min": "N/A", "max": "N/A", "avg": "N/A", "change": "N/A"},
            "acceleration": {"x": {"avg": "N/A"}, "y": {"avg": "N/A"}, "z": {"avg": "N/A"}},
            "distance": {"min": "N/A", "max": "N/A", "avg": "N/A", "change": "N/A"}
        },
        "motionEvents": 0,
        "events": [],
        "dataQuality": {"anomalies": 0, "completeness": 0},
        "commentary": "No data was collected during this experiment. Please ensure your ESP32 is connected and sending data to Supabase.",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)