// API service to connect to Supabase backend
// Use environment variable or fallback to local network IP
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.104:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://192.168.1.104:8000';

// Real authentication service
export const authService = {
  async signInWithPassword(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    return await response.json();
  },

  async signUp(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error('Sign up failed');
    }

    return await response.json();
  },

  async signInWithOAuth() {
    // Mock Google OAuth - just return a test user
    const mockUser = {
      id: 'google-user-1',
      email: 'test@pocketlab.com',
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
    // Mock sign out
    return { error: null };
  },

  async getSession() {
    // Mock session - return test user if token exists
    const token = localStorage.getItem('auth-token');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return { data: { user, session: { access_token: token } }, error: null };
    }
    return { data: null, error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Mock auth state change
    const token = localStorage.getItem('auth-token');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      callback('SIGNED_IN', { user, session: { access_token: token } });
    } else {
      callback('SIGNED_OUT', null);
    }
  }
};

// Mock sensor API for offline development
export const mockSensorAPI = {
  async startExperiment() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('🚀 Mock experiment started');
  },

  async stopExperiment() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('⏹️ Mock experiment stopped');
  },

  async getLatestData() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Generate mock sensor data
    const now = Date.now();
    return {
      timestamp: now,
      temperature: 22.5 + Math.sin(now / 10000) * 2,
      acceleration: {
        x: Math.sin(now / 2000) * 0.5,
        y: Math.cos(now / 2000) * 0.5,
        z: 9.8 + Math.sin(now / 3000) * 0.2
      },
      gyroscope: {
        pitch: Math.sin(now / 5000) * 0.1,
        roll: Math.cos(now / 5000) * 0.1,
        yaw: Math.sin(now / 7000) * 0.1
      },
      bme688: {
        temperature: 23.1 + Math.sin(now / 8000) * 1.5,
        humidity: 45 + Math.sin(now / 6000) * 5,
        pressure: 1013.25 + Math.sin(now / 4000) * 2,
        voc: 150 + Math.sin(now / 9000) * 50
      },
      ultrasonic: {
        distance: 25.0 + Math.sin(now / 10000) * 2
      }
    };
  },

  async exportData(format: 'csv' | 'json') {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockData = Array.from({ length: 100 }, (_, i) => ({
      timestamp: Date.now() - (100 - i) * 1000,
      temperature: 22.5 + Math.sin(i / 10) * 2,
      acceleration_x: Math.sin(i / 5) * 0.5,
      acceleration_y: Math.cos(i / 5) * 0.5,
      acceleration_z: 9.8 + Math.sin(i / 8) * 0.2,
      gyroscope_pitch: Math.sin(i / 15) * 0.1,
      gyroscope_roll: Math.cos(i / 15) * 0.1,
      gyroscope_yaw: Math.sin(i / 20) * 0.1,
      pressure: 1013.25 + Math.sin(i / 12) * 2,
      humidity: 45 + Math.sin(i / 18) * 5,
      distance: 25.0 + Math.sin(i / 25) * 2
    }));

    if (format === 'csv') {
      const headers = Object.keys(mockData[0]).join(',');
      const rows = mockData.map(row => Object.values(row).join(','));
      return headers + '\n' + rows.join('\n');
    } else {
      return JSON.stringify(mockData, null, 2);
    }
  }
};

// WebSocket connection for real-time data
export const createWebSocket = (onMessage: (data: any) => void) => {
  console.log('🔌 Connecting to WebSocket:', WS_BASE_URL);
  
  const ws = new WebSocket(`${WS_BASE_URL}/ws`);
  
  ws.onopen = () => {
    console.log('✅ WebSocket connected');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📡 WebSocket data received:', data);
      onMessage(data);
    } catch (error) {
      console.error('❌ Error parsing WebSocket data:', error);
    }
  };
  
  ws.onclose = () => {
    console.log('🔌 WebSocket disconnected');
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    // Don't crash the app, just log the error
  };
  
  return ws;
};

// Mock WebSocket for offline development
export const createMockWebSocket = (onMessage: (data: any) => void) => {
  console.log('🔌 Creating mock WebSocket connection');
  
  let intervalId: NodeJS.Timeout;
  
  const startMockData = () => {
    intervalId = setInterval(() => {
      const mockData = {
        type: 'sensor_update',
        data: {
          timestamp: Date.now(),
          temperature: {
            value: 22.5 + Math.sin(Date.now() / 10000) * 2
          },
          acceleration: {
            x: Math.sin(Date.now() / 2000) * 0.5,
            y: Math.cos(Date.now() / 2000) * 0.5,
            z: 9.8 + Math.sin(Date.now() / 3000) * 0.2
          },
          gyroscope: {
            pitch: Math.sin(Date.now() / 5000) * 0.1,
            roll: Math.cos(Date.now() / 5000) * 0.1,
            yaw: Math.sin(Date.now() / 7000) * 0.1
          },
          bme688: {
            temperature: 23.1 + Math.sin(Date.now() / 8000) * 1.5,
            humidity: 45 + Math.sin(Date.now() / 6000) * 5,
            pressure: 1013.25 + Math.sin(Date.now() / 4000) * 2,
            voc: 150 + Math.sin(Date.now() / 9000) * 50
          },
          ultrasonic: {
            distance: 25.0 + Math.sin(Date.now() / 10000) * 2
          }
        }
      };
      
      onMessage(mockData);
    }, 100); // 10Hz data rate
  };
  
  const stopMockData = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
  
  // Start mock data immediately
  startMockData();
  
  return {
    close: stopMockData,
    send: (data: any) => console.log('Mock WebSocket send:', data)
  };
};