# LabLink Mock Backend Setup

This setup provides a mock backend server that simulates Supabase data for testing the LabLink frontend without requiring actual Supabase configuration.

## 🚀 Quick Start

### 1. Start the Mock Backend
```bash
cd backend
npm install
npm run dev
```

The server will start on `http://localhost:3001`

### 2. Start the Frontend
```bash
cd frontend
pnpm dev
```

The frontend will start on `http://localhost:5173`

## 🔐 Mock Authentication

### Test Credentials
- **Email**: `test@lablink.com`
- **Password**: `password`

### Features
- ✅ Email/Password authentication
- ✅ Google OAuth simulation
- ✅ Session persistence
- ✅ Real-time sensor data via WebSocket
- ✅ CSV export functionality

## 📊 Mock Data

The backend generates realistic sensor data:
- **Temperature**: 20°C ± 5°C with sinusoidal variation
- **Acceleration**: 3-axis IMU data with realistic patterns
- **Real-time updates**: New data points every second via WebSocket

## 🔗 API Endpoints

- `GET /health` - Health check
- `POST /auth/v1/token` - Sign in
- `POST /auth/v1/signup` - Sign up
- `GET /api/sensor-data` - Get historical data
- `GET /api/sensor-data/latest` - Get latest reading
- `POST /api/experiment/start` - Start experiment
- `POST /api/experiment/stop` - Stop experiment
- `GET /api/export/csv` - Export CSV data
- `WebSocket /` - Real-time data stream

## 🎯 Testing the Frontend

1. **Login**: Use `test@lablink.com` / `password`
2. **Dashboard**: View live sensor data charts
3. **Start Experiment**: Begin real-time data collection
4. **Export Data**: Download CSV with collected data
5. **Google Sign-in**: Simulated OAuth flow

## 🔧 Configuration

The mock backend uses:
- **Express.js** for REST API
- **WebSocket** for real-time data
- **CORS** enabled for frontend communication
- **Mock data generation** with realistic patterns

## 📝 Notes

- All data is stored in memory (resets on server restart)
- WebSocket connections are automatically managed
- CSV export includes all collected data points
- Authentication tokens are stored in localStorage
