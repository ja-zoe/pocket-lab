import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FlaskConical,
  Play,
  Square,
  Download,
  LogOut,
  History,
  Thermometer,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SensorData {
  timestamp: number;
  temperature: number;
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isExperimentRunning, setIsExperimentRunning] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data generation for demo purposes
  const generateMockData = (): SensorData => {
    const now = Date.now();
    return {
      timestamp: now,
      temperature: 20 + Math.random() * 10 + Math.sin(now / 10000) * 2,
      acceleration: {
        x: Math.sin(now / 5000) * 2 + Math.random() * 0.5,
        y: Math.cos(now / 5000) * 2 + Math.random() * 0.5,
        z: Math.sin(now / 3000) * 1.5 + Math.random() * 0.3,
      }
    };
  };

  const startExperiment = () => {
    setIsExperimentRunning(true);
    setSensorData([]);
    
    // Start collecting data every 1 second
    intervalRef.current = setInterval(() => {
      const newData = generateMockData();
      setCurrentData(newData);
      setSensorData(prev => [...prev, newData]);
    }, 1000);
  };

  const stopExperiment = () => {
    setIsExperimentRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const exportCSV = () => {
    if (sensorData.length === 0) return;

    const headers = ['Timestamp', 'Temperature (°C)', 'Acceleration X', 'Acceleration Y', 'Acceleration Z'];
    const csvContent = [
      headers.join(','),
      ...sensorData.map(data => [
        new Date(data.timestamp).toISOString(),
        data.temperature.toFixed(2),
        data.acceleration.x.toFixed(3),
        data.acceleration.y.toFixed(3),
        data.acceleration.z.toFixed(3),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lablink-experiment-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Prepare data for charts
  const chartData = sensorData.map(data => ({
    time: new Date(data.timestamp).toLocaleTimeString(),
    temperature: data.temperature,
    accelX: data.acceleration.x,
    accelY: data.acceleration.y,
    accelZ: data.acceleration.z,
  }));

  return (
    <div className="min-h-screen bg-lab-dark">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-lab-teal/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-8 h-8 text-lab-teal" />
                <h1 className="text-2xl font-bold text-white">LabLink</h1>
              </div>
              <span className="text-sm text-gray-400">Live Experiment Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/history"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <History className="w-5 h-5" />
                <span>History</span>
              </Link>
              
              <div className="flex items-center space-x-2 text-gray-300">
                <span className="text-sm">{user?.email}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Control Panel */}
        <div className="mb-8">
          <div className="card-glow rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isExperimentRunning ? 'bg-lab-green animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-white font-medium">
                    {isExperimentRunning ? 'Experiment Running' : 'Experiment Stopped'}
                  </span>
                </div>
                
                {currentData && (
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <div className="flex items-center space-x-1">
                      <Thermometer className="w-4 h-4" />
                      <span>{currentData.temperature.toFixed(1)}°C</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Activity className="w-4 h-4" />
                      <span>X:{currentData.acceleration.x.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {!isExperimentRunning ? (
                  <button
                    onClick={startExperiment}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Experiment</span>
                  </button>
                ) : (
                  <button
                    onClick={stopExperiment}
                    className="btn-danger flex items-center space-x-2"
                  >
                    <Square className="w-5 h-5" />
                    <span>Stop Experiment</span>
                  </button>
                )}
                
                <button
                  onClick={exportCSV}
                  disabled={sensorData.length === 0}
                  className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Temperature Chart */}
          <div className="card-glow rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Thermometer className="w-6 h-6 text-lab-teal" />
                <span>Temperature</span>
              </h2>
              <div className="text-sm text-gray-400">
                {sensorData.length} readings
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    label={{ value: '°C', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #14B8A6',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#14B8A6" 
                    strokeWidth={2}
                    dot={false}
                    name="Temperature"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Acceleration Chart */}
          <div className="card-glow rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Activity className="w-6 h-6 text-lab-green" />
                <span>Acceleration</span>
              </h2>
              <div className="text-sm text-gray-400">
                3-axis IMU data
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    label={{ value: 'g', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #22C55E',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="accelX" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={false}
                    name="X-axis"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accelY" 
                    stroke="#22C55E" 
                    strokeWidth={2}
                    dot={false}
                    name="Y-axis"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accelZ" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={false}
                    name="Z-axis"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
