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
  Ruler,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Gyroscope3D from '../components/Gyroscope3D';
import Acceleration3D from '../components/Acceleration3D';
import BME688Chart from '../components/BME688Chart';

interface SensorData {
  timestamp: number;
  temperature: number;
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  // Gyroscope data (Euler angles in degrees)
  gyroscope: {
    pitch: number;  // X-axis rotation
    roll: number;   // Y-axis rotation
    yaw: number;    // Z-axis rotation
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
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const isRunningRef = useRef(false);
  const maxDataPoints = 300; // Limit data points for smooth scrolling

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
          gyroscope: {
            pitch: data.gyroscope?.[index]?.pitch || (Math.random() - 0.5) * 180,
            roll: data.gyroscope?.[index]?.roll || (Math.random() - 0.5) * 180,
            yaw: data.gyroscope?.[index]?.yaw || (Math.random() - 0.5) * 180,
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
      setIsLoading(true);
      await mockSensorAPI.startExperiment();
      setIsExperimentRunning(true);
      isRunningRef.current = true;
      
      // Generate session ID and start time
      const newSessionId = `session_${Date.now()}`;
      setSessionId(newSessionId);
      setSessionStartTime(new Date());
      
      // Connect to WebSocket for real-time data
      wsRef.current = createMockWebSocket((data) => {
        if (data.type === 'sensor_update' && isRunningRef.current) {
          const newData: SensorData = {
            timestamp: data.data.timestamp,
            temperature: data.data.temperature.value,
            acceleration: {
              x: data.data.acceleration.x,
              y: data.data.acceleration.y,
              z: data.data.acceleration.z,
            },
            gyroscope: {
              pitch: data.data.gyroscope?.pitch || (Math.random() - 0.5) * 180,
              roll: data.data.gyroscope?.roll || (Math.random() - 0.5) * 180,
              yaw: data.data.gyroscope?.yaw || (Math.random() - 0.5) * 180,
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
          setSensorData(prev => {
            const updated = [...prev, newData];
            // Keep only last maxDataPoints for smooth scrolling
            return updated.length > maxDataPoints ? updated.slice(-maxDataPoints) : updated;
          });
        }
      });
      
      showToastNotification('Experiment started successfully!', 'success');
    } catch (error) {
      console.error('Failed to start experiment:', error);
      showToastNotification('Failed to start experiment', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const stopExperiment = async () => {
    try {
      // Stop data processing immediately
      isRunningRef.current = false;
      
      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      await mockSensorAPI.stopExperiment();
      setIsExperimentRunning(false);
      setSessionId('');
      setSessionStartTime(null);
      
      showToastNotification('Experiment stopped successfully!', 'success');
      console.log('Experiment stopped - WebSocket closed and data processing halted');
    } catch (error) {
      console.error('Failed to stop experiment:', error);
      // Still set experiment as stopped even if API call fails
      isRunningRef.current = false;
      setIsExperimentRunning(false);
      showToastNotification('Failed to stop experiment', 'error');
    }
  };

  const exportCSV = async () => {
    try {
      const blob = await mockSensorAPI.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pocket-lab-experiment-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToastNotification('CSV exported successfully!', 'success');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      showToastNotification('Failed to export CSV', 'error');
    }
  };
  
  const showToastNotification = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
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
      isRunningRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Prepare data for charts with better formatting
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
  
  // Custom tooltip component for better styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-lab-dark-alt border border-lab-teal/50 rounded-lg p-3 shadow-glow-teal">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Format session duration
  const formatSessionDuration = () => {
    if (!sessionStartTime) return '';
    const duration = Date.now() - sessionStartTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-lab-dark">
      {/* Toast Notification */}
      {showToast && (
        <div className={`toast ${toastType}`}>
          <div className="flex items-center space-x-2">
            {toastType === 'success' ? (
              <CheckCircle className="w-5 h-5 text-lab-green" />
            ) : (
              <AlertCircle className="w-5 h-5 text-lab-red" />
            )}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      
      {/* Enhanced Header */}
      <header className="bg-lab-dark-alt/80 backdrop-blur-sm border-b border-lab-teal/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-8 h-8 text-lab-teal hover:text-lab-teal-light transition-colors" />
                <h1 className="text-2xl font-bold text-white">PocketLab</h1>
              </div>
              <span className="text-sm text-gray-400 hidden sm:block">Live Experiment Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/history"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors hover-lift"
              >
                <History className="w-5 h-5" />
                <span className="hidden sm:block">History</span>
              </Link>
              
              <div className="flex items-center space-x-2 text-gray-300">
                <span className="text-sm hidden sm:block">{user?.email}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors hover-lift"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Control Panel */}
        <div className="mb-8">
          <div className="card-glow p-6 animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Session Status Section */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="status-indicator">
                  <div className={`status-dot ${isExperimentRunning ? 'live' : 'paused'}`} />
                  <span className="text-white font-medium">
                    {isExperimentRunning ? 'Live' : 'Paused'}
                  </span>
                  {sessionId && (
                    <span className="text-xs text-gray-400 ml-2">
                      {sessionId.slice(-8)}
                    </span>
                  )}
                </div>
                
                {sessionStartTime && (
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {formatSessionDuration()}</span>
                  </div>
                )}
                
                {currentData && (
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                    <div className="flex items-center space-x-1">
                      <Thermometer className="w-4 h-4 text-lab-blue" />
                      <span>{currentData.bme688.temperature.toFixed(1)}°C</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Droplets className="w-4 h-4 text-lab-cyan" />
                      <span>{currentData.bme688.humidity.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Gauge className="w-4 h-4 text-lab-purple" />
                      <span>{currentData.bme688.pressure.toFixed(0)}hPa</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Ruler className="w-4 h-4 text-lab-orange" />
                      <span>{currentData.ultrasonic.distance.toFixed(0)}cm</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                {!isExperimentRunning ? (
                  <button
                    onClick={startExperiment}
                    disabled={isLoading}
                    className="btn-primary flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-lab-dark border-t-transparent rounded-full animate-spin" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Start Experiment</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={stopExperiment}
                    className="btn-danger flex items-center justify-center space-x-2"
                  >
                    <Square className="w-5 h-5" />
                    <span>Stop Experiment</span>
                  </button>
                )}
                
                <button
                  onClick={exportCSV}
                  disabled={sensorData.length === 0}
                  className="btn-secondary flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Charts Grid */}
        <div className="dashboard-grid">
          {/* BME688 Environmental Data Chart with Dropdown */}
          <div className="animate-slide-up">
            <BME688Chart 
              data={sensorData.map(data => ({
                timestamp: data.timestamp,
                temperature: data.bme688.temperature,
                humidity: data.bme688.humidity,
                pressure: data.bme688.pressure,
                voc: data.bme688.voc
              }))}
              width={600}
              height={400}
            />
          </div>

          {/* Air Quality / VOC Chart */}
          <div className="card-glow p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Eye className="w-6 h-6 text-lab-orange" />
                <span>Air Quality / VOC</span>
              </h2>
              <div className="text-sm text-gray-400">
                BME688 VOC Index
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                      label={{ value: 'VOC Index', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                      domain={['dataMin - 10', 'dataMax + 10']}
                      allowDataOverflow={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="voc" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      dot={false}
                      name="VOC Index"
                      activeDot={{ r: 5, fill: '#f97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start experiment to see VOC data</p>
                </div>
              </div>
            )}
          </div>

          {/* 3D Acceleration Visualization */}
          <div className="card-glow p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Activity className="w-6 h-6 text-lab-green" />
                <span>3D Acceleration</span>
              </h2>
              <div className="text-sm text-gray-400">
                Real-time 3D acceleration vector
              </div>
            </div>
            
            <div className="h-80 flex items-center justify-center">
              {currentData ? (
                <Acceleration3D 
                  acceleration={currentData.acceleration}
                  width={600}
                  height={300}
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start experiment to see 3D acceleration data</p>
                </div>
              )}
            </div>
          </div>

          {/* 3D Gyroscope Visualization */}
          <div className="card-glow p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Activity className="w-6 h-6 text-lab-cyan" />
                <span>3D Gyroscope</span>
              </h2>
              <div className="text-sm text-gray-400">
                Real-time 3D orientation
              </div>
            </div>
            
            <div className="h-80 flex items-center justify-center">
              {currentData ? (
                <Gyroscope3D 
                  pitch={currentData.gyroscope.pitch}
                  roll={currentData.gyroscope.roll}
                  yaw={currentData.gyroscope.yaw}
                  width={600}
                  height={300}
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start experiment to see 3D gyroscope data</p>
                </div>
              )}
            </div>
          </div>

          {/* Acceleration Time Series */}
          <div className="card-glow p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Activity className="w-6 h-6 text-lab-orange" />
                <span>Acceleration Time Series</span>
              </h2>
              <div className="text-sm text-gray-400">
                3-axis accelerometer data over time
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                      label={{ value: 'g', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                      allowDataOverflow={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="accelX" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={false}
                      name="X-axis"
                      activeDot={{ r: 4, fill: '#ef4444' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="accelY" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={false}
                      name="Y-axis"
                      activeDot={{ r: 4, fill: '#22c55e' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="accelZ" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      name="Z-axis"
                      activeDot={{ r: 4, fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start experiment to see acceleration data</p>
                </div>
              </div>
            )}
          </div>

          {/* Distance (Ultrasonic) Chart */}
          <div className="card-glow p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Ruler className="w-6 h-6 text-lab-purple" />
                <span>Distance / Motion</span>
              </h2>
              <div className="text-sm text-gray-400">
                Object proximity detection
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                      label={{ value: 'Distance (cm)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                      domain={['dataMin - 5', 'dataMax + 5']}
                      allowDataOverflow={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="distance" 
                      stroke="#a855f7" 
                      strokeWidth={3}
                      dot={false}
                      name="Distance (cm)"
                      activeDot={{ r: 5, fill: '#a855f7' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Ruler className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start experiment to see distance data</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
