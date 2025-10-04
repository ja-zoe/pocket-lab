import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'demo-key');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
      x: (Math.sin(i * 0.2) * 2 + Math.random() * 0.5) * 9.81, // Convert g to m/s²
      y: (Math.cos(i * 0.15) * 1.5 + Math.random() * 0.3) * 9.81, // Convert g to m/s²
      z: (1 + Math.sin(i * 0.1) * 0.5 + Math.random() * 0.2) * 9.81, // Convert g to m/s²
      unit: 'm/s²'
    });
    
    // Gyroscope data (Euler angles in radians)
    sensorData.gyroscope.push({
      timestamp,
      pitch: (Math.sin(i * 0.1) * 45 + Math.random() * 10) * Math.PI / 180, // X-axis rotation in rad
      roll: (Math.cos(i * 0.08) * 30 + Math.random() * 8) * Math.PI / 180,   // Y-axis rotation in rad
      yaw: (Math.sin(i * 0.12) * 60 + Math.random() * 15) * Math.PI / 180,   // Z-axis rotation in rad
      unit: 'rad'
    });
    
    // BME688 Environmental Sensor Data
    sensorData.bme688.push({
      timestamp,
      temperature: 22 + Math.sin(i * 0.08) * 6 + Math.random() * 2, // 22°C ± 6°C
      humidity: 50 + Math.sin(i * 0.05) * 20 + Math.random() * 5, // 50% ± 20%
      pressure: (1013 + Math.sin(i * 0.03) * 10 + Math.random() * 2) * 100, // 101300 Pa ± 1000
      voc: 50 + Math.sin(i * 0.1) * 30 + Math.random() * 20, // VOC index 50 ± 30
      unit: 'mixed'
    });
    
    // Ultrasonic Distance Sensor Data
    sensorData.ultrasonic.push({
      timestamp,
      distance: (50 + Math.sin(i * 0.15) * 40 + Math.random() * 10) / 100, // 0.5m ± 0.4m
      unit: 'm'
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

// Experiment summary generation
app.post('/api/experiment/summary', async (req, res) => {
  try {
    const summary = await generateExperimentSummary();
    res.json(summary);
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ error: 'Failed to generate experiment summary' });
  }
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

// Generate experiment summary with AI commentary
const generateExperimentSummary = async () => {
  if (sensorData.temperature.length === 0) {
    return {
      duration: 0,
      dataPoints: 0,
      message: 'No data available for analysis'
    };
  }

  const duration = Math.round((sensorData.temperature[sensorData.temperature.length - 1].timestamp - sensorData.temperature[0].timestamp) / 1000);
  const dataPoints = sensorData.temperature.length;

  // Calculate statistics for each sensor
  const tempStats = calculateStats(sensorData.temperature.map(d => d.value));
  const accelXStats = calculateStats(sensorData.acceleration.map(d => d.x));
  const accelYStats = calculateStats(sensorData.acceleration.map(d => d.y));
  const accelZStats = calculateStats(sensorData.acceleration.map(d => d.z));
  const pressureStats = calculateStats(sensorData.bme688.map(d => d.pressure));
  const humidityStats = calculateStats(sensorData.bme688.map(d => d.humidity));
  const distanceStats = calculateStats(sensorData.ultrasonic.map(d => d.distance));

  // Detect events
  const events = detectEvents();
  
  // Generate AI commentary
  const commentary = await generateAICommentary({
    tempStats,
    accelXStats,
    accelYStats,
    accelZStats,
    pressureStats,
    humidityStats,
    distanceStats,
    events,
    duration,
    dataPoints
  });

  return {
    duration,
    dataPoints,
    timestamp: new Date().toISOString(),
    statistics: {
      temperature: {
        min: tempStats.min,
        max: tempStats.max,
        avg: tempStats.avg,
        change: tempStats.change,
        unit: '°C'
      },
      acceleration: {
        x: { min: accelXStats.min, max: accelXStats.max, avg: accelXStats.avg, unit: 'm/s²' },
        y: { min: accelYStats.min, max: accelYStats.max, avg: accelYStats.avg, unit: 'm/s²' },
        z: { min: accelZStats.min, max: accelZStats.max, avg: accelZStats.avg, unit: 'm/s²' }
      },
      pressure: {
        min: pressureStats.min,
        max: pressureStats.max,
        avg: pressureStats.avg,
        change: pressureStats.change,
        unit: 'Pa'
      },
      humidity: {
        min: humidityStats.min,
        max: humidityStats.max,
        avg: humidityStats.avg,
        change: humidityStats.change,
        unit: '%'
      },
      distance: {
        min: distanceStats.min,
        max: distanceStats.max,
        avg: distanceStats.avg,
        change: distanceStats.change,
        unit: 'm'
      }
    },
    events,
    commentary,
    dataQuality: {
      anomalies: events.filter(e => e.type === 'spike').length,
      motionEvents: events.filter(e => e.type === 'motion').length,
      totalEvents: events.length
    }
  };
};

// Calculate basic statistics
const calculateStats = (data) => {
  if (data.length === 0) return { min: 0, max: 0, avg: 0, change: 0 };
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const change = data[data.length - 1] - data[0];
  
  return { min, max, avg, change };
};

// Detect events in the data
const detectEvents = () => {
  const events = [];
  
  // Detect motion events (high acceleration variance)
  const accelMagnitude = sensorData.acceleration.map(acc => 
    Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z)
  );
  
  const accelVariance = calculateVariance(accelMagnitude);
  if (accelVariance > 50) { // Threshold for motion detection
    events.push({
      type: 'motion',
      description: 'Significant motion detected',
      timestamp: sensorData.temperature[Math.floor(sensorData.temperature.length / 2)].timestamp,
      severity: accelVariance > 100 ? 'high' : 'medium'
    });
  }
  
  // Detect temperature spikes
  const tempValues = sensorData.temperature.map(d => d.value);
  for (let i = 1; i < tempValues.length - 1; i++) {
    const change = Math.abs(tempValues[i] - tempValues[i-1]);
    if (change > 5) { // Temperature spike threshold
      events.push({
        type: 'temperature_spike',
        description: `Temperature spike: ${change.toFixed(1)}°C change`,
        timestamp: sensorData.temperature[i].timestamp,
        severity: change > 10 ? 'high' : 'medium'
      });
    }
  }
  
  // Detect pressure changes
  const pressureValues = sensorData.bme688.map(d => d.pressure);
  const pressureChange = pressureValues[pressureValues.length - 1] - pressureValues[0];
  if (Math.abs(pressureChange) > 1000) { // 10 hPa change
    events.push({
      type: 'pressure_change',
      description: `Pressure change: ${(pressureChange/100).toFixed(1)} hPa`,
      timestamp: sensorData.temperature[0].timestamp,
      severity: Math.abs(pressureChange) > 2000 ? 'high' : 'medium'
    });
  }
  
  return events;
};

// Calculate variance
const calculateVariance = (data) => {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
  return variance;
};

// Generate AI commentary using Gemini API
const generateAICommentary = async (data) => {
  const { tempStats, pressureStats, humidityStats, distanceStats, accelXStats, accelYStats, accelZStats, events, duration } = data;
  
  // If no API key is provided, fall back to rule-based commentary
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'demo-key') {
    console.log('🔄 No API key provided, using rule-based commentary...');
    return generateFallbackCommentary(data);
  }
  
  try {
    console.log('🤖 Attempting to generate AI commentary with Gemini...');
    const prompt = `You are a science teacher analyzing a student's sensor data experiment. Please provide a clear, educational commentary on the following experiment data:

EXPERIMENT OVERVIEW:
- Duration: ${Math.floor(duration / 60)} minutes ${duration % 60} seconds
- Data Points: ${data.dataPoints || 'N/A'}

SENSOR DATA:
Temperature: ${tempStats.min.toFixed(1)}°C to ${tempStats.max.toFixed(1)}°C (avg: ${tempStats.avg.toFixed(1)}°C, change: ${tempStats.change > 0 ? '+' : ''}${tempStats.change.toFixed(1)}°C)
Pressure: ${(pressureStats.min/100).toFixed(1)} to ${(pressureStats.max/100).toFixed(1)} hPa (avg: ${(pressureStats.avg/100).toFixed(1)} hPa, change: ${(pressureStats.change/100).toFixed(1)} hPa)
Humidity: ${humidityStats.min.toFixed(1)}% to ${humidityStats.max.toFixed(1)}% (avg: ${humidityStats.avg.toFixed(1)}%, change: ${humidityStats.change > 0 ? '+' : ''}${humidityStats.change.toFixed(1)}%)
Distance: ${distanceStats.min.toFixed(2)}m to ${distanceStats.max.toFixed(2)}m (avg: ${distanceStats.avg.toFixed(2)}m, change: ${distanceStats.change > 0 ? '+' : ''}${distanceStats.change.toFixed(2)}m)
Acceleration: X=${accelXStats.avg.toFixed(1)} m/s², Y=${accelYStats.avg.toFixed(1)} m/s², Z=${accelZStats.avg.toFixed(1)} m/s²

DETECTED EVENTS:
${events.length > 0 ? events.map(e => `- ${e.description} (${e.severity} severity)`).join('\n') : 'No significant events detected'}

Please provide:
1. A brief analysis of the key trends and patterns
2. What the data suggests about the experimental conditions
3. Any notable observations or anomalies
4. Educational insights for the student

Keep the response concise (2-3 sentences) and educational, suitable for a high school science class.`;

    // Add timeout and retry logic
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
    );
    
    const apiPromise = model.generateContent(prompt);
    const result = await Promise.race([apiPromise, timeoutPromise]);
    const response = await result.response;
    const commentary = response.text();
    
    console.log('✅ Gemini API successful!');
    return commentary;
    
  } catch (error) {
    console.error('❌ Gemini API failed:', error.message);
    
    // Provide specific error guidance
    if (error.message.includes('fetch failed') || error.message.includes('timeout')) {
      console.log('🌐 Network issue detected. Possible causes:');
      console.log('   • Corporate firewall blocking Google APIs');
      console.log('   • Network connectivity problems');
      console.log('   • DNS resolution issues');
      console.log('   • Proxy configuration needed');
      console.log('   • Try: nslookup generativelanguage.googleapis.com');
    } else if (error.message.includes('404')) {
      console.log('🔧 Model not found - check model name');
    } else if (error.message.includes('403') || error.message.includes('401')) {
      console.log('🔑 API key issue - check key validity');
    }
    
    console.log('🔄 Falling back to rule-based commentary...');
    return generateFallbackCommentary(data);
  }
};

// Fallback rule-based commentary
const generateFallbackCommentary = (data) => {
  const { tempStats, pressureStats, humidityStats, events, duration } = data;
  
  let commentary = [];
  
  // Temperature analysis
  if (Math.abs(tempStats.change) > 2) {
    if (tempStats.change > 0) {
      commentary.push(`Temperature increased steadily by ${tempStats.change.toFixed(1)}°C over the experiment duration.`);
    } else {
      commentary.push(`Temperature decreased by ${Math.abs(tempStats.change).toFixed(1)}°C during the experiment.`);
    }
  } else {
    commentary.push(`Temperature remained relatively stable with minimal variation.`);
  }
  
  // Pressure analysis
  if (Math.abs(pressureStats.change) > 500) {
    commentary.push(`Atmospheric pressure showed significant changes, indicating potential environmental variations.`);
  } else {
    commentary.push(`Pressure readings remained stable throughout the experiment.`);
  }
  
  // Motion analysis
  const motionEvents = events.filter(e => e.type === 'motion');
  if (motionEvents.length > 0) {
    commentary.push(`${motionEvents.length} motion event${motionEvents.length > 1 ? 's' : ''} detected, suggesting active movement or vibration.`);
  } else {
    commentary.push(`No significant motion events detected - experiment conducted in stable conditions.`);
  }
  
  // Data quality
  const anomalies = events.filter(e => e.type === 'temperature_spike').length;
  if (anomalies > 0) {
    commentary.push(`Data quality: ${anomalies} temperature anomaly${anomalies > 1 ? 'ies' : 'y'} detected during recording.`);
  } else {
    commentary.push(`Data quality: No significant anomalies detected - clean dataset.`);
  }
  
  // Overall assessment
  if (duration > 300) { // 5 minutes
    commentary.push(`Extended experiment duration (${Math.round(duration/60)} minutes) provides robust data for analysis.`);
  }
  
  return commentary.join(' ');
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
      x: (Math.sin(now * 0.002) * 2 + Math.random() * 0.5) * 9.81, // Convert g to m/s²
      y: (Math.cos(now * 0.0015) * 1.5 + Math.random() * 0.3) * 9.81, // Convert g to m/s²
      z: (1 + Math.sin(now * 0.001) * 0.5 + Math.random() * 0.2) * 9.81, // Convert g to m/s²
      unit: 'm/s²'
    };
    
    // Generate new gyroscope data
    const newGyro = {
      timestamp: now,
      pitch: (Math.sin(now * 0.001) * 45 + Math.random() * 10) * Math.PI / 180, // Convert to rad
      roll: (Math.cos(now * 0.0008) * 30 + Math.random() * 8) * Math.PI / 180,   // Convert to rad
      yaw: (Math.sin(now * 0.0012) * 60 + Math.random() * 15) * Math.PI / 180,   // Convert to rad
      unit: 'rad'
    };
    
    // Generate new BME688 data
    const newBME = {
      timestamp: now,
      temperature: 22 + Math.sin(now * 0.0008) * 6 + Math.random() * 2,
      humidity: 50 + Math.sin(now * 0.0005) * 20 + Math.random() * 5,
      pressure: (1013 + Math.sin(now * 0.0003) * 10 + Math.random() * 2) * 100, // Convert hPa to Pa
      voc: 50 + Math.sin(now * 0.001) * 30 + Math.random() * 20,
      unit: 'mixed'
    };
    
    // Generate new ultrasonic data
    const newUltrasonic = {
      timestamp: now,
      distance: (50 + Math.sin(now * 0.0015) * 40 + Math.random() * 10) / 100, // Convert cm to m
      unit: 'm'
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
