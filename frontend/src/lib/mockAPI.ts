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
    const response = await fetch(`${API_BASE_URL}/api/sensor-data`);
    if (!response.ok) throw new Error('Failed to fetch sensor data');
    return response.json();
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
    const response = await fetch(`${API_BASE_URL}/api/export/csv`);
    if (!response.ok) throw new Error('Failed to export CSV');
    return response.blob();
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
