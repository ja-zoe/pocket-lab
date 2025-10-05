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
  BookOpen,
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
import AccelerationCombined from '../components/AccelerationCombined';
import BME688Chart from '../components/BME688Chart';
import SpikeFilterControls from '../components/SpikeFilterControls';
import ExperimentSummary from '../components/ExperimentSummary';
import { useSimpleSpikeFilter } from '../hooks/useSimpleSpikeFilter';

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
  const [showSummary, setShowSummary] = useState(false);
  const [experimentSummary, setExperimentSummary] = useState<any>(null);
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
      
      // Generate experiment summary
      try {
        const response = await fetch('http://localhost:3001/api/experiment/summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const summary = await response.json();
          setExperimentSummary(summary);
          setShowSummary(true);
        }
      } catch (summaryError) {
        console.error('Failed to generate summary:', summaryError);
        // Continue with stopping experiment even if summary fails
      }
      
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

  const downloadSummaryCSV = () => {
    if (!experimentSummary) return;
    
    const csvContent = generateSummaryCSV(experimentSummary);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment-summary-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToastNotification('Summary CSV exported successfully!', 'success');
  };

  const downloadSummaryPDF = () => {
    if (!experimentSummary) return;
    
    // For now, we'll create a simple HTML report that can be printed as PDF
    const htmlContent = generateSummaryHTML(experimentSummary);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment-summary-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToastNotification('Summary report exported successfully!', 'success');
  };

  const generateSummaryCSV = (summary: any) => {
    const headers = [
      'Metric',
      'Min Value',
      'Max Value', 
      'Average Value',
      'Change',
      'Unit'
    ].join(',');
    
    const rows = [
      `Temperature,${summary.statistics.temperature.min},${summary.statistics.temperature.max},${summary.statistics.temperature.avg},${summary.statistics.temperature.change},${summary.statistics.temperature.unit}`,
      `Pressure,${summary.statistics.pressure.min},${summary.statistics.pressure.max},${summary.statistics.pressure.avg},${summary.statistics.pressure.change},${summary.statistics.pressure.unit}`,
      `Humidity,${summary.statistics.humidity.min},${summary.statistics.humidity.max},${summary.statistics.humidity.avg},${summary.statistics.humidity.change},${summary.statistics.humidity.unit}`,
      `Distance,${summary.statistics.distance.min},${summary.statistics.distance.max},${summary.statistics.distance.avg},${summary.statistics.distance.change},${summary.statistics.distance.unit}`,
      `Acceleration X,${summary.statistics.acceleration.x.min},${summary.statistics.acceleration.x.max},${summary.statistics.acceleration.x.avg},0,${summary.statistics.acceleration.x.unit}`,
      `Acceleration Y,${summary.statistics.acceleration.y.min},${summary.statistics.acceleration.y.max},${summary.statistics.acceleration.y.avg},0,${summary.statistics.acceleration.y.unit}`,
      `Acceleration Z,${summary.statistics.acceleration.z.min},${summary.statistics.acceleration.z.max},${summary.statistics.acceleration.z.avg},0,${summary.statistics.acceleration.z.unit}`
    ];
    
    return [headers, ...rows].join('\n');
  };

  const generateSummaryHTML = (summary: any) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Experiment Summary Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .stats-table { width: 100%; border-collapse: collapse; }
        .stats-table th, .stats-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .stats-table th { background-color: #f2f2f2; }
        .commentary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Experiment Summary Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="section">
        <h2>Overview</h2>
        <p><strong>Duration:</strong> ${Math.floor(summary.duration / 60)}:${(summary.duration % 60).toString().padStart(2, '0')}</p>
        <p><strong>Data Points:</strong> ${summary.dataPoints.toLocaleString()}</p>
        <p><strong>Data Quality:</strong> ${summary.dataQuality.anomalies === 0 ? 'Clean' : `${summary.dataQuality.anomalies} anomalies detected`}</p>
    </div>
    
    <div class="section">
        <h2>Statistics</h2>
        <table class="stats-table">
            <tr><th>Metric</th><th>Min</th><th>Max</th><th>Average</th><th>Change</th><th>Unit</th></tr>
            <tr><td>Temperature</td><td>${summary.statistics.temperature.min.toFixed(1)}</td><td>${summary.statistics.temperature.max.toFixed(1)}</td><td>${summary.statistics.temperature.avg.toFixed(1)}</td><td>${summary.statistics.temperature.change.toFixed(1)}</td><td>${summary.statistics.temperature.unit}</td></tr>
            <tr><td>Pressure</td><td>${(summary.statistics.pressure.min/100).toFixed(1)}</td><td>${(summary.statistics.pressure.max/100).toFixed(1)}</td><td>${(summary.statistics.pressure.avg/100).toFixed(1)}</td><td>${(summary.statistics.pressure.change/100).toFixed(1)}</td><td>hPa</td></tr>
            <tr><td>Humidity</td><td>${summary.statistics.humidity.min.toFixed(1)}</td><td>${summary.statistics.humidity.max.toFixed(1)}</td><td>${summary.statistics.humidity.avg.toFixed(1)}</td><td>${summary.statistics.humidity.change.toFixed(1)}</td><td>${summary.statistics.humidity.unit}</td></tr>
            <tr><td>Distance</td><td>${summary.statistics.distance.min.toFixed(2)}</td><td>${summary.statistics.distance.max.toFixed(2)}</td><td>${summary.statistics.distance.avg.toFixed(2)}</td><td>${summary.statistics.distance.change.toFixed(2)}</td><td>${summary.statistics.distance.unit}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>AI Analysis</h2>
        <div class="commentary">
            ${summary.commentary}
        </div>
    </div>
    
    ${summary.events.length > 0 ? `
    <div class="section">
        <h2>Detected Events</h2>
        <ul>
            ${summary.events.map((event: any) => `<li>${event.description} (${new Date(event.timestamp).toLocaleTimeString()})</li>`).join('')}
        </ul>
    </div>
    ` : ''}
</body>
</html>`;
  };

  const exportRawData = () => {
    try {
      const csvContent = generateCSV(rawChartData, 'raw');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pocket-lab-raw-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToastNotification('Raw data exported successfully!', 'success');
    } catch (error) {
      console.error('Raw export failed:', error);
      showToastNotification('Raw export failed', 'error');
    }
  };

  const exportCleanData = () => {
    try {
      const csvContent = generateCSV(chartData, 'clean');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pocket-lab-clean-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToastNotification('Clean data exported successfully!', 'success');
    } catch (error) {
      console.error('Clean export failed:', error);
      showToastNotification('Clean export failed', 'error');
    }
  };

  const generateCSV = (data: any[], type: 'raw' | 'clean') => {
    if (data.length === 0) return '';
    
    const headers = [
      'Timestamp',
      'Time',
      'Temperature (°C)',
      'Acceleration X (m/s²)',
      'Acceleration Y (m/s²)',
      'Acceleration Z (m/s²)',
      'BME688 Temperature (°C)',
      'Humidity (%)',
      'Pressure (Pa)',
      'VOC Index',
      'Distance (m)'
    ];

    if (type === 'clean') {
      headers.push(
        'Temperature Spike',
        'AccelX Spike',
        'AccelY Spike',
        'AccelZ Spike',
        'BME688 Temp Spike',
        'Humidity Spike',
        'Pressure Spike',
        'VOC Spike',
        'Distance Spike'
      );
    }

    const csvRows = [headers.join(',')];
    
    data.forEach(point => {
      const row = [
        point.time,
        point.timeString,
        point.temperature,
        point.accelX,
        point.accelY,
        point.accelZ,
        point.bmeTemp,
        point.humidity,
        point.pressure,
        point.voc,
        point.distance
      ];

      if (type === 'clean' && point.spikesDetected) {
        row.push(
          point.spikesDetected.temperature,
          point.spikesDetected.accelX,
          point.spikesDetected.accelY,
          point.spikesDetected.accelZ,
          point.spikesDetected.bmeTemp,
          point.spikesDetected.humidity,
          point.spikesDetected.pressure,
          point.spikesDetected.voc,
          point.spikesDetected.distance
        );
      }

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
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

  // Prepare raw data for charts
  const rawChartData = sensorData.map(data => ({
    time: data.timestamp, // Keep original timestamp
    timeString: new Date(data.timestamp).toLocaleTimeString(), // For display
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

  // Apply spike filtering
  const {
    displayData: chartData,
    showClean,
    setShowClean,
    spikeStats,
    filterOptions,
    updateFilterOptions
  } = useSimpleSpikeFilter(rawChartData, {
    windowSize: 10,
    threshold: 2,
    enabled: true
  });
  
  // Custom tooltip component for better styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2 text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-300" style={{ color: entry.color }}>
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
    <div className="min-h-screen bg-gray-900">
      {/* Toast Notification */}
      {showToast && (
        <div className={`toast ${toastType}`}>
          <div className="flex items-center space-x-2">
            {toastType === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      
      {/* Enhanced Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-8 h-8 text-blue-500 hover:text-blue-400 transition-colors" />
                <h1 className="text-2xl font-bold text-white">PocketLab</h1>
              </div>
              <span className="text-sm text-gray-400 hidden sm:block">Live Experiment Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/experiments"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors hover-lift"
              >
                <BookOpen className="w-5 h-5" />
                <span className="hidden sm:block">Experiments</span>
              </Link>
              
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Enhanced Control Panel */}
        <div className="mb-8">
          <div className="card-glow p-6 animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Guided Experiment Button */}
              <div className="mb-4 lg:mb-0">
                <Link
                  to="/experiments"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/25"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Start Guided Experiment</span>
                </Link>
                <p className="text-gray-400 text-sm mt-2">
                  Choose from curated science experiments with step-by-step guidance
                </p>
              </div>
              
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
                      <Thermometer className="w-4 h-4 text-blue-500" />
                      <span>{currentData.bme688.temperature.toFixed(1)}°C</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Droplets className="w-4 h-4 text-cyan-500" />
                      <span>{currentData.bme688.humidity.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Gauge className="w-4 h-4 text-purple-500" />
                      <span>{currentData.bme688.pressure.toFixed(0)}hPa</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Ruler className="w-4 h-4 text-orange-500" />
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

        {/* Spike Filter Controls */}
        <SpikeFilterControls
          showClean={showClean}
          setShowClean={setShowClean}
          spikeStats={spikeStats}
          onExportRaw={exportRawData}
          onExportClean={exportCleanData}
          windowSize={filterOptions.windowSize}
          threshold={filterOptions.threshold}
          onWindowSizeChange={(size) => updateFilterOptions({ windowSize: size })}
          onThresholdChange={(threshold) => updateFilterOptions({ threshold })}
        />

        {/* Enhanced Charts Grid */}
        <div className="dashboard-grid">
          {/* BME688 Environmental Data Chart with Dropdown */}
          <div className="animate-fade-in">
            <BME688Chart 
              data={sensorData.map(data => ({
                timestamp: data.timestamp,
                temperature: data.bme688.temperature,
                humidity: data.bme688.humidity,
                pressure: data.bme688.pressure,
                voc: data.bme688.voc
              }))}
            />
          </div>

          {/* Air Quality / VOC Chart */}
          <div className="card-glow p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Eye className="w-6 h-6 text-orange-500" />
                <span>Air Quality / VOC</span>
              </h2>
              <div className="text-sm text-gray-400">
                BME688 VOC Index
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      fontSize={10}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      tickLine={{ stroke: '#9CA3AF' }}
                      axisLine={{ stroke: '#9CA3AF' }}
                      interval="preserveStartEnd"
                      tickFormatter={(value) => {
                        if (!value || isNaN(value)) return '';
                        const date = new Date(value);
                        if (isNaN(date.getTime())) return '';
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={9}
                      tick={{ fill: '#9CA3AF', fontSize: 9 }}
                      tickLine={{ stroke: '#9CA3AF' }}
                      axisLine={{ stroke: '#9CA3AF' }}
                      width={50}
                      label={{ 
                        value: 'VOC Index', 
                        angle: -90, 
                        position: 'insideLeft', 
                        style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 10 } 
                      }}
                      domain={['dataMin - 10', 'dataMax + 10']}
                      allowDataOverflow={false}
                      tickCount={5}
                      tickFormatter={(value) => {
                        if (value >= 1000) return (value / 1000).toPrecision(3) + 'k';
                        if (value >= 100) return value.toPrecision(3);
                        if (value >= 10) return value.toPrecision(3);
                        return value.toPrecision(3);
                      }}
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

          {/* Combined Acceleration Data */}
          <div className="animate-fade-in">
            <AccelerationCombined 
              data={chartData}
              width={600}
              height={300}
            />
          </div>

          {/* 3D Gyroscope Visualization */}
          <div className="card-glow p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Activity className="w-6 h-6 text-cyan-500" />
                <span>3D Gyroscope</span>
              </h2>
              <div className="text-sm text-gray-400">
                MPU6050 YXZ rotation mapping
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


          {/* Distance (Ultrasonic) Chart */}
          <div className="card-glow p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Ruler className="w-6 h-6 text-purple-500" />
                <span>Distance / Motion</span>
              </h2>
              <div className="text-sm text-gray-400">
                Object proximity detection
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      fontSize={10}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      tickLine={{ stroke: '#9CA3AF' }}
                      axisLine={{ stroke: '#9CA3AF' }}
                      interval="preserveStartEnd"
                      tickFormatter={(value) => {
                        if (!value || isNaN(value)) return '';
                        const date = new Date(value);
                        if (isNaN(date.getTime())) return '';
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={9}
                      tick={{ fill: '#9CA3AF', fontSize: 9 }}
                      tickLine={{ stroke: '#9CA3AF' }}
                      axisLine={{ stroke: '#9CA3AF' }}
                      width={50}
                      label={{ 
                        value: 'Distance (m)', 
                        angle: -90, 
                        position: 'insideLeft', 
                        style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 10 } 
                      }}
                      domain={['dataMin - 5', 'dataMax + 5']}
                      allowDataOverflow={false}
                      tickCount={5}
                      tickFormatter={(value) => {
                        if (value >= 1000) return (value / 1000).toPrecision(3) + 'k';
                        if (value >= 100) return value.toPrecision(3);
                        if (value >= 10) return value.toPrecision(3);
                        return value.toPrecision(3);
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="distance" 
                      stroke="#a855f7" 
                      strokeWidth={3}
                      dot={false}
                      name="Distance (m)"
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

      {/* Experiment Summary Modal */}
      {showSummary && experimentSummary && (
        <ExperimentSummary
          summary={experimentSummary}
          onDownloadCSV={downloadSummaryCSV}
          onDownloadPDF={downloadSummaryPDF}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
