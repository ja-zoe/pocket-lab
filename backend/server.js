import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock user data
const mockUsers = [
  {
    id: '1',
    email: 'test@lablink.com',
    name: 'Test User',
    created_at: new Date().toISOString()
  }
];

// Mock sensor data
let sensorData = {
  temperature: [],
  acceleration: [],
  gyroscope: [],
  bme688: [],
  ultrasonic: [],
  timestamp: []
};

// Generate initial mock data
const generateMockData = () => {
  const now = Date.now();
  const dataPoints = 50;
  
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = now - (dataPoints - i) * 1000; // 1 second intervals
    
    sensorData.temperature.push({
      timestamp,
      value: 20 + Math.sin(i * 0.1) * 5 + Math.random() * 2, // 20°C ± 5°C with noise
      unit: '°C'
    });
    
    sensorData.acceleration.push({
      timestamp,
      x: Math.sin(i * 0.2) * 2 + Math.random() * 0.5,
      y: Math.cos(i * 0.15) * 1.5 + Math.random() * 0.3,
      z: 9.8 + Math.sin(i * 0.1) * 0.5 + Math.random() * 0.2,
      unit: 'm/s²'
    });
    
    // Gyroscope data (Euler angles in degrees)
    sensorData.gyroscope.push({
      timestamp,
      pitch: Math.sin(i * 0.1) * 45 + Math.random() * 10, // X-axis rotation
      roll: Math.cos(i * 0.08) * 30 + Math.random() * 8,   // Y-axis rotation
      yaw: Math.sin(i * 0.12) * 60 + Math.random() * 15,   // Z-axis rotation
      unit: 'degrees'
    });
    
    // BME688 Environmental Sensor Data
    sensorData.bme688.push({
      timestamp,
      temperature: 22 + Math.sin(i * 0.08) * 6 + Math.random() * 2, // 22°C ± 6°C
      humidity: 50 + Math.sin(i * 0.05) * 20 + Math.random() * 5, // 50% ± 20%
      pressure: 1013 + Math.sin(i * 0.03) * 10 + Math.random() * 2, // 1013 hPa ± 10
      voc: 50 + Math.sin(i * 0.1) * 30 + Math.random() * 20, // VOC index 50 ± 30
      unit: 'mixed'
    });
    
    // Ultrasonic Distance Sensor Data
    sensorData.ultrasonic.push({
      timestamp,
      distance: 50 + Math.sin(i * 0.15) * 40 + Math.random() * 10, // 50cm ± 40cm
      unit: 'cm'
    });
    
    sensorData.timestamp.push(timestamp);
  }
};

// Initialize mock data
generateMockData();

// Authentication endpoints (mock)
app.post('/auth/v1/token', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'test@lablink.com' && password === 'password') {
    res.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: mockUsers[0]
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/auth/v1/signup', (req, res) => {
  const { email, password } = req.body;
  
  const newUser = {
    id: String(mockUsers.length + 1),
    email,
    name: email.split('@')[0],
    created_at: new Date().toISOString()
  };
  
  mockUsers.push(newUser);
  
  res.json({
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'mock-refresh-token',
    user: newUser
  });
});

// Sensor data endpoints
app.get('/api/sensor-data', (req, res) => {
  res.json({
    temperature: sensorData.temperature.slice(-100), // Last 100 points
    acceleration: sensorData.acceleration.slice(-100),
    gyroscope: sensorData.gyroscope.slice(-100),
    bme688: sensorData.bme688.slice(-100),
    ultrasonic: sensorData.ultrasonic.slice(-100),
    timestamp: sensorData.timestamp.slice(-100)
  });
});

app.get('/api/sensor-data/latest', (req, res) => {
  const latest = {
    temperature: sensorData.temperature[sensorData.temperature.length - 1],
    acceleration: sensorData.acceleration[sensorData.acceleration.length - 1],
    gyroscope: sensorData.gyroscope[sensorData.gyroscope.length - 1],
    bme688: sensorData.bme688[sensorData.bme688.length - 1],
    ultrasonic: sensorData.ultrasonic[sensorData.ultrasonic.length - 1],
    timestamp: Date.now()
  };
  
  res.json(latest);
});

// Experiment control endpoints
app.post('/api/experiment/start', (req, res) => {
  console.log('Starting experiment...');
  res.json({ 
    status: 'started', 
    message: 'Experiment started successfully',
    experimentId: `exp_${Date.now()}`
  });
});

app.post('/api/experiment/stop', (req, res) => {
  console.log('Stopping experiment...');
  res.json({ 
    status: 'stopped', 
    message: 'Experiment stopped successfully',
    dataPoints: sensorData.temperature.length
  });
});

// Export data endpoint
app.get('/api/export/csv', (req, res) => {
  const csvData = generateCSV();
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sensor-data.csv"');
  res.send(csvData);
});

// Generate CSV data
const generateCSV = () => {
  const headers = 'Timestamp,Temperature (°C),Acceleration X (m/s²),Acceleration Y (m/s²),Acceleration Z (m/s²),BME Temperature (°C),BME Humidity (%),BME Pressure (hPa),BME VOC Index,Ultrasonic Distance (cm)\n';
  
  const rows = sensorData.temperature.map((temp, index) => {
    const acc = sensorData.acceleration[index];
    const bme = sensorData.bme688[index];
    const ultrasonic = sensorData.ultrasonic[index];
    const timestamp = new Date(temp.timestamp).toISOString();
    
    return `${timestamp},${temp.value.toFixed(2)},${acc.x.toFixed(2)},${acc.y.toFixed(2)},${acc.z.toFixed(2)},${bme.temperature.toFixed(2)},${bme.humidity.toFixed(1)},${bme.pressure.toFixed(1)},${bme.voc.toFixed(1)},${ultrasonic.distance.toFixed(1)}`;
  }).join('\n');
  
  return headers + rows;
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    dataPoints: sensorData.temperature.length
  });
});

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    message: 'LabLink Mock Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      auth: {
        signIn: 'POST /auth/v1/token',
        signUp: 'POST /auth/v1/signup'
      },
      sensor: {
        data: 'GET /api/sensor-data',
        latest: 'GET /api/sensor-data/latest',
        start: 'POST /api/experiment/start',
        stop: 'POST /api/experiment/stop',
        export: 'GET /api/export/csv'
      },
      websocket: 'ws://localhost:3001'
    },
    testCredentials: {
      email: 'test@lablink.com',
      password: 'password'
    }
  });
});

// Create HTTP server
const server = createServer(app);

// WebSocket server for real-time data
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'initial_data',
    data: {
      temperature: sensorData.temperature.slice(-10),
      acceleration: sensorData.acceleration.slice(-10),
      bme688: sensorData.bme688.slice(-10),
      ultrasonic: sensorData.ultrasonic.slice(-10)
    }
  }));
  
  // Send periodic updates
  const interval = setInterval(() => {
    const now = Date.now();
    
    // Generate new data point
    const newTemp = {
      timestamp: now,
      value: 20 + Math.sin(now * 0.001) * 5 + Math.random() * 2,
      unit: '°C'
    };
    
    const newAcc = {
      timestamp: now,
      x: Math.sin(now * 0.002) * 2 + Math.random() * 0.5,
      y: Math.cos(now * 0.0015) * 1.5 + Math.random() * 0.3,
      z: 9.8 + Math.sin(now * 0.001) * 0.5 + Math.random() * 0.2,
      unit: 'm/s²'
    };
    
    // Generate new gyroscope data
    const newGyro = {
      timestamp: now,
      pitch: Math.sin(now * 0.001) * 45 + Math.random() * 10,
      roll: Math.cos(now * 0.0008) * 30 + Math.random() * 8,
      yaw: Math.sin(now * 0.0012) * 60 + Math.random() * 15,
      unit: 'degrees'
    };
    
    // Generate new BME688 data
    const newBME = {
      timestamp: now,
      temperature: 22 + Math.sin(now * 0.0008) * 6 + Math.random() * 2,
      humidity: 50 + Math.sin(now * 0.0005) * 20 + Math.random() * 5,
      pressure: 1013 + Math.sin(now * 0.0003) * 10 + Math.random() * 2,
      voc: 50 + Math.sin(now * 0.001) * 30 + Math.random() * 20,
      unit: 'mixed'
    };
    
    // Generate new ultrasonic data
    const newUltrasonic = {
      timestamp: now,
      distance: 50 + Math.sin(now * 0.0015) * 40 + Math.random() * 10,
      unit: 'cm'
    };
    
    // Add to data arrays
    sensorData.temperature.push(newTemp);
    sensorData.acceleration.push(newAcc);
    sensorData.gyroscope.push(newGyro);
    sensorData.bme688.push(newBME);
    sensorData.ultrasonic.push(newUltrasonic);
    sensorData.timestamp.push(now);
    
    // Keep only last 1000 points
    if (sensorData.temperature.length > 1000) {
      sensorData.temperature.shift();
      sensorData.acceleration.shift();
      sensorData.gyroscope.shift();
      sensorData.bme688.shift();
      sensorData.ultrasonic.shift();
      sensorData.timestamp.shift();
    }
    
    // Send to client
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: 'sensor_update',
        data: {
          temperature: newTemp,
          acceleration: newAcc,
          gyroscope: newGyro,
          bme688: newBME,
          ultrasonic: newUltrasonic,
          timestamp: now
        }
      }));
    }
  }, 1000); // Update every second
  
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
    clearInterval(interval);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Mock LabLink Backend running on http://localhost:${PORT}`);
  console.log(`📊 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Sensor data: http://localhost:${PORT}/api/sensor-data`);
});
