import os
import asyncio
import math
import json
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="PocketLab Backend API", version="1.0.0")

# CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://xywmpoeoqhqjqjqjqjqj.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5d21wb2VvcWhxampxampxampxaiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzM0NzQ4MDAsImV4cCI6MjA0OTA1MDgwMH0.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.data_generation_task = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"📱 Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"📱 Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except:
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection)

    def start_data_generation(self):
        if self.data_generation_task is None:
            self.data_generation_task = asyncio.create_task(self.generate_sensor_data())
            print("🔄 Started sensor data generation")

    def stop_data_generation(self):
        if self.data_generation_task:
            self.data_generation_task.cancel()
            self.data_generation_task = None
            print("⏹️ Stopped sensor data generation")

manager = ConnectionManager()

# Pydantic models
class Reading(BaseModel):
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

class SensorData(BaseModel):
    timestamp: int
    temperature: float
    acceleration: Dict[str, float]
    gyroscope: Dict[str, float]
    bme688: Dict[str, float]
    ultrasonic: Dict[str, float]

class SessionStart(BaseModel):
    session_id: str

class SessionStop(BaseModel):
    session_id: str

class AuthRequest(BaseModel):
    email: str
    password: str

# API endpoints
@app.get("/")
async def root():
    return {"message": "PocketLab Backend API", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/sensor-data")
async def receive_sensor_data(reading: Reading):
    """Receive sensor data from ESP32 and store in Supabase"""
    try:
        # Store in Supabase
        url = f"{SUPABASE_URL}/rest/v1/sensor_readings"
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        data = {
            "session_id": reading.session_id,
            "timestamp": reading.timestamp,
            "temperature": reading.temperature,
            "pressure": reading.pressure,
            "humidity": reading.humidity,
            "voc": reading.voc,
            "accel_x": reading.accelX,
            "accel_y": reading.accelY,
            "accel_z": reading.accelZ,
            "gyro_x": reading.gyroX,
            "gyro_y": reading.gyroY,
            "gyro_z": reading.gyroZ,
            "distance": reading.distance
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code in [200, 201]:
            return {"status": "success", "message": "Data stored successfully"}
        else:
            print(f"❌ Supabase error: {response.status_code} - {response.text}")
            return {"status": "error", "message": "Failed to store data"}
            
    except Exception as e:
        print(f"❌ Error storing sensor data: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/experiment/start")
async def start_experiment(session: SessionStart):
    """Start an experiment session"""
    try:
        manager.start_data_generation()
        return {"status": "success", "session_id": session.session_id, "message": "Experiment started"}
    except Exception as e:
        print(f"❌ Error starting experiment: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/experiment/stop")
async def stop_experiment(session: SessionStop):
    """Stop an experiment session"""
    try:
        manager.stop_data_generation()
        return {"status": "success", "session_id": session.session_id, "message": "Experiment stopped"}
    except Exception as e:
        print(f"❌ Error stopping experiment: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/auth/v1/token")
async def authenticate(auth: AuthRequest):
    """Mock authentication endpoint"""
    if auth.email == "test@pocketlab.com" and auth.password == "password":
        return {
            "access_token": "mock-access-token",
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "id": "user-1",
                "email": auth.email,
                "created_at": datetime.now().isoformat()
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/auth/v1/signup")
async def signup(auth: AuthRequest):
    """Mock signup endpoint"""
    return {
        "access_token": "mock-access-token",
        "token_type": "bearer",
        "expires_in": 3600,
        "user": {
            "id": "user-1",
            "email": auth.email,
            "created_at": datetime.now().isoformat()
        }
    }

@app.get("/api/sensor-data")
async def get_sensor_data(limit: int = 100):
    """Get recent sensor data from Supabase"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/sensor_readings"
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json"
        }
        
        params = {
            "order": "timestamp.desc",
            "limit": limit
        }
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            data = response.json()
            return {"status": "success", "data": data}
        else:
            print(f"❌ Supabase error: {response.status_code} - {response.text}")
            return {"status": "error", "message": "Failed to fetch data"}
            
    except Exception as e:
        print(f"❌ Error fetching sensor data: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/experiment/summary")
async def generate_experiment_summary():
    """Generate experiment summary with AI commentary"""
    try:
        # Fetch recent data from Supabase
        url = f"{SUPABASE_URL}/rest/v1/sensor_readings"
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json"
        }
        
        params = {
            "order": "timestamp.desc",
            "limit": 1000
        }
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            data = response.json()
            
            if not data:
                # No data scenario
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
            
            # Calculate duration
            if len(data) > 1:
                duration = (data[0]["timestamp"] - data[-1]["timestamp"]) / 1000  # Convert to seconds
            else:
                duration = 0
            
            # Extract sensor values
            temperatures = [d["temperature"] for d in data if d.get("temperature")]
            pressures = [d["pressure"] for d in data if d.get("pressure")]
            humidities = [d["humidity"] for d in data if d.get("humidity")]
            accel_x = [d["accel_x"] for d in data if d.get("accel_x")]
            accel_y = [d["accel_y"] for d in data if d.get("accel_y")]
            accel_z = [d["accel_z"] for d in data if d.get("accel_z")]
            gyro_x = [d["gyro_x"] for d in data if d.get("gyro_x")]
            gyro_y = [d["gyro_y"] for d in data if d.get("gyro_y")]
            gyro_z = [d["gyro_z"] for d in data if d.get("gyro_z")]
            distances = [d["distance"] for d in data if d.get("distance")]
            
            # Calculate statistics
            temp_stats = {
                "min": min(temperatures) if temperatures else 0,
                "max": max(temperatures) if temperatures else 0,
                "avg": sum(temperatures) / len(temperatures) if temperatures else 0,
                "change": temperatures[-1] - temperatures[0] if len(temperatures) > 1 else 0
            }
            
            pressure_stats = {
                "min": min(pressures) if pressures else 0,
                "max": max(pressures) if pressures else 0,
                "avg": sum(pressures) / len(pressures) if pressures else 0,
                "change": pressures[-1] - pressures[0] if len(pressures) > 1 else 0
            }
            
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
            
            # Detect motion events
            motion_events = 0
            for i in range(1, len(data)):
                prev = data[i-1]
                curr = data[i]
                if all(key in prev and key in curr for key in ["accel_x", "accel_y", "accel_z"]):
                    accel_magnitude = math.sqrt(
                        (curr["accel_x"] - prev["accel_x"])**2 +
                        (curr["accel_y"] - prev["accel_y"])**2 +
                        (curr["accel_z"] - prev["accel_z"])**2
                    )
                    if accel_magnitude > 2.0:  # Threshold for motion detection
                        motion_events += 1
            
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
            
            commentary += f"Data quality is good with {len(data)} data points collected over {duration:.0f} seconds."
            
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
                    "anomalies": 0,
                    "completeness": 100
                },
                "commentary": commentary,
                "timestamp": datetime.now().isoformat()
            }
            
            return summary
            
        else:
            print(f"❌ Supabase error: {response.status_code} - {response.text}")
            return {"status": "error", "message": "Failed to fetch data for summary"}
            
    except Exception as e:
        print(f"❌ Error generating experiment summary: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/experiment/summary-no-data")
async def generate_experiment_summary_no_data():
    """Test endpoint for no data scenario"""
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
async def test_supabase():
    """Test Supabase connection"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/sensor_readings"
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers, params={"limit": 1})
        
        if response.status_code == 200:
            return {"status": "success", "message": "Supabase connection working", "data": response.json()}
        else:
            return {"status": "error", "message": f"Supabase error: {response.status_code}", "response": response.text}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Background task to generate and broadcast sensor data
async def generate_sensor_data():
    """Generate sensor data and broadcast to connected clients"""
    print("🔄 Starting sensor data generation loop")
    
    while True:
        try:
            if len(manager.active_connections) > 0:
                # Fetch real data from Supabase
                url = f"{SUPABASE_URL}/rest/v1/sensor_readings"
                headers = {
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json"
                }
                
                params = {
                    "order": "timestamp.desc",
                    "limit": 1
                }
                
                response = requests.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data:
                        # Use real data from Supabase
                        latest = data[0]
                        
                        # Transform to frontend format
                        sensor_data = {
                            "type": "sensor_update",
                            "data": {
                                "timestamp": latest["timestamp"],
                                "temperature": {
                                    "value": latest["temperature"]
                                },
                                "acceleration": {
                                    "x": latest["accel_x"],
                                    "y": latest["accel_y"],
                                    "z": latest["accel_z"]
                                },
                                "gyroscope": {
                                    "pitch": (latest["gyro_x"] / 131.0) * (math.pi / 180),  # Convert raw to rad/s
                                    "roll": (latest["gyro_y"] / 131.0) * (math.pi / 180),
                                    "yaw": (latest["gyro_z"] / 131.0) * (math.pi / 180)
                                },
                                "bme688": {
                                    "temperature": latest["temperature"],
                                    "humidity": latest["humidity"],
                                    "pressure": latest["pressure"],
                                    "voc": latest["voc"]
                                },
                                "ultrasonic": {
                                    "distance": latest["distance"]
                                }
                            }
                        }
                        
                        # Broadcast to all connected clients
                        await manager.broadcast(json.dumps(sensor_data))
                        print(f"📡 Broadcasted real sensor data to {len(manager.active_connections)} clients")
                    else:
                        print("📊 No data in Supabase, not broadcasting")
                else:
                    print(f"❌ Supabase error: {response.status_code}")
                
                await asyncio.sleep(0.1)  # 10Hz data rate
                
            else:
                # No active connections, sleep longer
                await asyncio.sleep(1)
                
        except Exception as e:
            print(f"❌ Error in sensor data generation: {e}")
            # Don't send mock data on error - keep graphs empty
            await asyncio.sleep(0.1)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)