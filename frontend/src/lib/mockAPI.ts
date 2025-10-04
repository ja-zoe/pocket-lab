// Mock API service to replace Supabase calls
const API_BASE_URL = 'http://localhost:3001';

// Mock authentication
export const mockAuth = {
  async signInWithPassword(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    return { data: { user: data.user, session: { access_token: data.access_token } }, error: null };
  },

  async signUp(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Signup failed');
    }

    const data = await response.json();
    return { data: { user: data.user, session: { access_token: data.access_token } }, error: null };
  },

  async signInWithOAuth() {
    // Mock Google OAuth - just return a test user
    const mockUser = {
      id: 'google-user-1',
      email: 'test@lablink.com',
      name: 'Test User',
      created_at: new Date().toISOString()
    };
    
    return { 
      data: { 
        user: mockUser, 
        session: { access_token: 'mock-google-token' } 
      }, 
      error: null 
    };
  },

  async signOut() {
    return { error: null };
  },

  async getSession() {
    // Check if we have a stored session
    const token = localStorage.getItem('mock-token');
    if (token) {
      const mockUser = {
        id: '1',
        email: 'test@lablink.com',
        name: 'Test User',
        created_at: new Date().toISOString()
      };
      return { data: { session: { user: mockUser, access_token: token } }, error: null };
    }
    return { data: { session: null }, error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Mock auth state change listener
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }
};

// Mock sensor data API
export const mockSensorAPI = {
  async getSensorData() {
    // Generate mock data with BME688 and ultrasonic sensor data
    const now = Date.now();
    const data = [];
    
    for (let i = 0; i < 50; i++) {
      const timestamp = now - (50 - i) * 2000; // 2 seconds apart
      data.push({
        timestamp,
        temperature: { value: 20 + Math.random() * 10 },
        acceleration: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
          z: (Math.random() - 0.5) * 2 + 1
        },
        bme688: {
          temperature: 22 + Math.random() * 8,
          humidity: 45 + Math.random() * 30,
          pressure: 1010 + Math.random() * 20,
          voc: 30 + Math.random() * 120
        },
        ultrasonic: {
          distance: 20 + Math.random() * 150
        }
      });
    }
    
    return {
      temperature: data.map(d => ({ timestamp: d.timestamp, value: d.temperature.value })),
      acceleration: data.map(d => d.acceleration),
      bme688: data.map(d => d.bme688),
      ultrasonic: data.map(d => d.ultrasonic)
    };
  },

  async getLatestData() {
    const response = await fetch(`${API_BASE_URL}/api/sensor-data/latest`);
    if (!response.ok) throw new Error('Failed to fetch latest data');
    return response.json();
  },

  async startExperiment() {
    const response = await fetch(`${API_BASE_URL}/api/experiment/start`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to start experiment');
    return response.json();
  },

  async stopExperiment() {
    const response = await fetch(`${API_BASE_URL}/api/experiment/stop`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to stop experiment');
    return response.json();
  },

  async exportCSV() {
    // Generate CSV with all sensor data
    const data = await this.getSensorData();
    const csvData = [];
    
    // CSV header
    csvData.push('Timestamp,Temperature,Accel_X,Accel_Y,Accel_Z,BME_Temp,BME_Humidity,BME_Pressure,BME_VOC,Ultrasonic_Distance');
    
    // CSV rows
    for (let i = 0; i < data.temperature.length; i++) {
      const row = [
        new Date(data.temperature[i].timestamp).toISOString(),
        data.temperature[i].value.toFixed(2),
        data.acceleration[i].x.toFixed(3),
        data.acceleration[i].y.toFixed(3),
        data.acceleration[i].z.toFixed(3),
        data.bme688[i].temperature.toFixed(2),
        data.bme688[i].humidity.toFixed(1),
        data.bme688[i].pressure.toFixed(1),
        data.bme688[i].voc.toFixed(1),
        data.ultrasonic[i].distance.toFixed(1)
      ];
      csvData.push(row.join(','));
    }
    
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return blob;
  }
};

// WebSocket connection for real-time data
export const createMockWebSocket = (onMessage: (data: any) => void) => {
  const ws = new WebSocket('ws://localhost:3001');
  
  ws.onopen = () => {
    console.log('Connected to mock WebSocket');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  
  ws.onclose = () => {
    console.log('Disconnected from mock WebSocket');
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return ws;
};
