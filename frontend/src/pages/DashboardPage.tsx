import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mockSensorAPI, createMockWebSocket } from '../lib/mockAPI';
import { 
  FlaskConical,
  Play,
  Square,
  Download,
  LogOut,
  History,
  Thermometer,
  Activity,
  Droplets,
  Gauge,
  Wind,
  Eye,
  Ruler
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
  // BME688 Environmental Sensor Data
  bme688: {
    temperature: number;
    humidity: number;
    pressure: number;
    voc: number;
  };
  // Ultrasonic Distance Sensor Data
  ultrasonic: {
    distance: number;
  };
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isExperimentRunning, setIsExperimentRunning] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await mockSensorAPI.getSensorData();
        const formattedData = data.temperature.map((temp: any, index: number) => ({
          timestamp: temp.timestamp,
          temperature: temp.value,
          acceleration: {
            x: data.acceleration[index].x,
            y: data.acceleration[index].y,
            z: data.acceleration[index].z,
          },
          bme688: {
            temperature: data.bme688?.[index]?.temperature || 25 + Math.random() * 5,
            humidity: data.bme688?.[index]?.humidity || 40 + Math.random() * 20,
            pressure: data.bme688?.[index]?.pressure || 1013 + Math.random() * 10,
            voc: data.bme688?.[index]?.voc || 50 + Math.random() * 100,
          },
          ultrasonic: {
            distance: data.ultrasonic?.[index]?.distance || 50 + Math.random() * 100,
          }
        }));
        setSensorData(formattedData);
        
        // Set current data to latest
        if (formattedData.length > 0) {
          setCurrentData(formattedData[formattedData.length - 1]);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  const startExperiment = async () => {
    try {
      await mockSensorAPI.startExperiment();
      setIsExperimentRunning(true);
      
      // Connect to WebSocket for real-time data
      wsRef.current = createMockWebSocket((data) => {
        if (data.type === 'sensor_update') {
          const newData: SensorData = {
            timestamp: data.data.timestamp,
            temperature: data.data.temperature.value,
            acceleration: {
              x: data.data.acceleration.x,
              y: data.data.acceleration.y,
              z: data.data.acceleration.z,
            },
            bme688: {
              temperature: data.data.bme688?.temperature || 25 + Math.random() * 5,
              humidity: data.data.bme688?.humidity || 40 + Math.random() * 20,
              pressure: data.data.bme688?.pressure || 1013 + Math.random() * 10,
              voc: data.data.bme688?.voc || 50 + Math.random() * 100,
            },
            ultrasonic: {
              distance: data.data.ultrasonic?.distance || 50 + Math.random() * 100,
            }
          };
          
          setCurrentData(newData);
          setSensorData(prev => [...prev, newData]);
        }
      });
    } catch (error) {
      console.error('Failed to start experiment:', error);
    }
  };

  const stopExperiment = async () => {
    try {
      await mockSensorAPI.stopExperiment();
      setIsExperimentRunning(false);
      
      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    } catch (error) {
      console.error('Failed to stop experiment:', error);
    }
  };

  const exportCSV = async () => {
    try {
      const blob = await mockSensorAPI.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lablink-experiment-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
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
      if (wsRef.current) {
        wsRef.current.close();
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
    // BME688 data
    bmeTemp: data.bme688.temperature,
    humidity: data.bme688.humidity,
    pressure: data.bme688.pressure,
    voc: data.bme688.voc,
    // Ultrasonic data
    distance: data.ultrasonic.distance,
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
                <h1 className="text-2xl font-bold text-white">PocketLab</h1>
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
                      <span>{currentData.bme688.temperature.toFixed(1)}°C</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Droplets className="w-4 h-4" />
                      <span>{currentData.bme688.humidity.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Gauge className="w-4 h-4" />
                      <span>{currentData.bme688.pressure.toFixed(0)}hPa</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Ruler className="w-4 h-4" />
                      <span>{currentData.ultrasonic.distance.toFixed(0)}cm</span>
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

        {/* Enhanced Charts Grid */}
        <div className="space-y-8">
          {/* Row 1: Environmental Conditions (BME688) */}
          <div className="card-glow rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Wind className="w-6 h-6 text-lab-teal" />
                <span>Environmental Conditions (BME688)</span>
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
                    label={{ value: 'Values', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #14B8A6',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="bmeTemp" 
                    stroke="#14B8A6" 
                    strokeWidth={2}
                    dot={false}
                    name="Temperature (°C)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={false}
                    name="Humidity (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pressure" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={false}
                    name="Pressure (hPa)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Air Quality / VOC */}
          <div className="card-glow rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Eye className="w-6 h-6 text-lab-orange" />
                <span>Air Quality / VOC</span>
              </h2>
              <div className="text-sm text-gray-400">
                BME688 VOC Index
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
                    label={{ value: 'VOC Index', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #F97316',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="voc" 
                    stroke="#F97316" 
                    strokeWidth={3}
                    dot={false}
                    name="VOC Index"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: Acceleration / Gyroscope */}
          <div className="card-glow rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Activity className="w-6 h-6 text-lab-green" />
                <span>Acceleration (3-Axis IMU)</span>
              </h2>
              <div className="text-sm text-gray-400">
                3-axis accelerometer data
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

          {/* Row 4: Distance (Ultrasonic) */}
          <div className="card-glow rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Ruler className="w-6 h-6 text-lab-purple" />
                <span>Distance / Motion (Ultrasonic)</span>
              </h2>
              <div className="text-sm text-gray-400">
                Object proximity detection
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
                    label={{ value: 'Distance (cm)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #A855F7',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="distance" 
                    stroke="#A855F7" 
                    strokeWidth={3}
                    dot={false}
                    name="Distance (cm)"
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
