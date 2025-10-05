import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mockSensorAPI, createWebSocket } from '../lib/mockAPI';
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
  Eye,
  Ruler,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Gyroscope3D from '../components/Gyroscope3D';
import AccelerationCombined from '../components/AccelerationCombined';
import BME688Chart from '../components/BME688Chart';
import SpikeFilterControls from '../components/SpikeFilterControls';
import ExperimentSummary from '../components/ExperimentSummary';
import { useSimpleSpikeFilter } from '../hooks/useSimpleSpikeFilter';

import type { SensorData } from '../types/sensorData';

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
  const [currentTime, setCurrentTime] = useState(Date.now());
  const wsRef = useRef<WebSocket | null>(null);
  const isRunningRef = useRef(false);
  const maxDataPoints = 300; // Limit data points for smooth scrolling

  // Update current time every second when experiment is running
  useEffect(() => {
    if (!isExperimentRunning || !sessionStartTime) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isExperimentRunning, sessionStartTime]);

  // Connect to WebSocket for real-time data (no initial mock data)
  useEffect(() => {

    // Connect to WebSocket immediately for real-time data
    wsRef.current = createWebSocket((data) => {
      console.log('WebSocket data received:', data);
      try {
        if (data && data.type === 'sensor_update' && data.data) {
          const newData: SensorData = {
            timestamp: data.data.timestamp || Date.now(),
            temperature: data.data.temperature?.value || 0,
            acceleration: {
              x: data.data.acceleration?.x || 0,
              y: data.data.acceleration?.y || 0,
              z: data.data.acceleration?.z || 0
            },
            gyroscope: {
              pitch: data.data.gyroscope?.pitch || 0,
              roll: data.data.gyroscope?.roll || 0,
              yaw: data.data.gyroscope?.yaw || 0
            },
            bme688: {
              temperature: data.data.bme688?.temperature || 0,
              humidity: data.data.bme688?.humidity || 0,
              pressure: data.data.bme688?.pressure || 0,
              voc: data.data.bme688?.voc || 0
            },
            ultrasonic: {
              distance: data.data.ultrasonic?.distance || 0
            }
          };

          console.log('Processed new data:', newData);
          setSensorData(prevData => {
            const newDataArray = [newData, ...prevData].slice(0, maxDataPoints);
            console.log('Updated sensor data array length:', newDataArray.length);
            return newDataArray;
          });

          // Update current data
          setCurrentData(newData);
          console.log('Updated current data:', newData);
        }
      } catch (error) {
        console.error('Error processing WebSocket data:', error);
      }
    });
  }, []);

  const startExperiment = async () => {
    try {
      setIsLoading(true);
      await mockSensorAPI.startExperiment();
      setIsExperimentRunning(true);
      isRunningRef.current = true;
      
          // Generate session ID and start time
          const newSessionId = `session_${Date.now()}`;
          const startTime = new Date();
          setSessionId(newSessionId);
          setSessionStartTime(startTime);
          setCurrentTime(Date.now()); // Initialize current time
      
      // WebSocket is already connected, just start data processing
      
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
      
      // Keep WebSocket connection open for future experiments
      
      await mockSensorAPI.stopExperiment();
      
      // Generate experiment summary from frontend data
      const generateFrontendSummary = () => {
        // Use the same duration calculation as the timer display
        const durationMs = sessionStartTime ? currentTime - sessionStartTime.getTime() : 0;
        const duration = Math.floor(durationMs / 1000);
        
        if (sensorData.length === 0) {
          return {
            duration: 0,
            dataPoints: 0,
            statistics: {
              temperature: { min: "N/A", max: "N/A", avg: "N/A", change: "N/A" },
              pressure: { min: "N/A", max: "N/A", avg: "N/A", change: "N/A" },
              humidity: { min: "N/A", max: "N/A", avg: "N/A", change: "N/A" },
              acceleration: { x: { avg: "N/A" }, y: { avg: "N/A" }, z: { avg: "N/A" } },
              distance: { min: "N/A", max: "N/A", avg: "N/A", change: "N/A" }
            },
            motionEvents: 0,
            events: [],
            dataQuality: { anomalies: 0, completeness: 0 },
            commentary: "No data was collected during this experiment. Please ensure your ESP32 is connected and sending data to Supabase.",
            timestamp: new Date().toISOString()
          };
        }

        // Calculate statistics from frontend sensor data
        const temperatures = sensorData.map(d => d.temperature).filter(t => t !== null && t !== undefined);
        const pressures = sensorData.map(d => d.bme688?.pressure).filter(p => p !== null && p !== undefined);
        const humidities = sensorData.map(d => d.bme688?.humidity).filter(h => h !== null && h !== undefined);
        const accelX = sensorData.map(d => d.acceleration?.x).filter(a => a !== null && a !== undefined);
        const accelY = sensorData.map(d => d.acceleration?.y).filter(a => a !== null && a !== undefined);
        const accelZ = sensorData.map(d => d.acceleration?.z).filter(a => a !== null && a !== undefined);
        const distances = sensorData.map(d => d.ultrasonic?.distance).filter(d => d !== null && d !== undefined);

        // Temperature statistics
        const tempStats = temperatures.length > 0 ? {
          min: Math.min(...temperatures),
          max: Math.max(...temperatures),
          avg: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
          change: temperatures.length > 1 ? temperatures[0] - temperatures[temperatures.length - 1] : 0
        } : { min: "N/A", max: "N/A", avg: "N/A", change: "N/A" };

        // Pressure statistics
        const pressureStats = pressures.length > 0 ? {
          min: Math.min(...pressures),
          max: Math.max(...pressures),
          avg: pressures.reduce((a, b) => a + b, 0) / pressures.length,
          change: pressures.length > 1 ? pressures[0] - pressures[pressures.length - 1] : 0
        } : { min: "N/A", max: "N/A", avg: "N/A", change: "N/A" };

        // Humidity statistics
        const humidityStats = humidities.length > 0 ? {
          min: Math.min(...humidities),
          max: Math.max(...humidities),
          avg: humidities.reduce((a, b) => a + b, 0) / humidities.length,
          change: humidities.length > 1 ? humidities[0] - humidities[humidities.length - 1] : 0
        } : { min: "N/A", max: "N/A", avg: "N/A", change: "N/A" };

        // Acceleration statistics
        const accelerationStats = {
          x: { avg: accelX.length > 0 ? accelX.reduce((a, b) => a + b, 0) / accelX.length : "N/A" },
          y: { avg: accelY.length > 0 ? accelY.reduce((a, b) => a + b, 0) / accelY.length : "N/A" },
          z: { avg: accelZ.length > 0 ? accelZ.reduce((a, b) => a + b, 0) / accelZ.length : "N/A" }
        };

        // Distance statistics
        const distanceStats = distances.length > 0 ? {
          min: Math.min(...distances),
          max: Math.max(...distances),
          avg: distances.reduce((a, b) => a + b, 0) / distances.length,
          change: distances.length > 1 ? distances[0] - distances[distances.length - 1] : 0
        } : { min: "N/A", max: "N/A", avg: "N/A", change: "N/A" };

        // Detect motion events (acceleration spikes)
        let motionEvents = 0;
        for (let i = 1; i < sensorData.length; i++) {
          const prev = sensorData[i - 1];
          const curr = sensorData[i];
          if (prev.acceleration && curr.acceleration) {
            const accelMagnitude = Math.sqrt(
              Math.pow(curr.acceleration.x - prev.acceleration.x, 2) +
              Math.pow(curr.acceleration.y - prev.acceleration.y, 2) +
              Math.pow(curr.acceleration.z - prev.acceleration.z, 2)
            );
            if (accelMagnitude > 2.0) { // Threshold for motion detection in m/s²
              motionEvents++;
            }
          }
        }

        // Generate events
        const events = [];
        if (motionEvents > 0) {
          events.push({
            type: "motion",
            description: `Detected ${motionEvents} motion events during experiment`,
            severity: "medium",
            timestamp: new Date().toISOString()
          });
        }

        if (typeof tempStats.change === 'number' && Math.abs(tempStats.change) > 5) {
          events.push({
            type: "temperature",
            description: `Significant temperature change: ${tempStats.change.toFixed(1)}°C`,
            severity: Math.abs(tempStats.change) > 10 ? "high" : "medium",
            timestamp: new Date().toISOString()
          });
        }

        // Generate AI commentary
        let commentary = "Experiment completed successfully! ";
        if (typeof tempStats.change === 'number') {
          if (tempStats.change > 2) {
            commentary += `Temperature increased by ${tempStats.change.toFixed(1)}°C, indicating active heating. `;
          } else if (tempStats.change < -2) {
            commentary += `Temperature decreased by ${Math.abs(tempStats.change).toFixed(1)}°C, showing cooling effects. `;
          } else {
            commentary += "Temperature remained relatively stable. ";
          }
        }

        if (motionEvents > 0) {
          commentary += `Detected ${motionEvents} motion events, suggesting device movement during experiment. `;
        }

        commentary += `Data quality is good with ${sensorData.length} data points collected over ${duration} seconds.`;

        return {
          duration: duration,
          dataPoints: sensorData.length,
          statistics: {
            temperature: tempStats,
            pressure: pressureStats,
            humidity: humidityStats,
            acceleration: accelerationStats,
            distance: distanceStats
          },
          motionEvents: motionEvents,
          events: events,
          dataQuality: { anomalies: 0, completeness: 100 },
          commentary: commentary,
          timestamp: new Date().toISOString()
        };
      };

      const summary = generateFrontendSummary();
      console.log('Generated frontend experiment summary:', summary);
      setExperimentSummary(summary);
      setShowSummary(true);
      
      setIsExperimentRunning(false);
      setSessionId('');
      setSessionStartTime(null);
      setCurrentTime(Date.now()); // Reset current time
      
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
      if (sensorData.length === 0) {
        showToastNotification('No data to export', 'error');
        return;
      }

      // Convert real sensor data to CSV format
      const headers = [
        'timestamp',
        'temperature',
        'acceleration_x',
        'acceleration_y', 
        'acceleration_z',
        'gyroscope_pitch',
        'gyroscope_roll',
        'gyroscope_yaw',
        'bme688_temperature',
        'bme688_humidity',
        'bme688_pressure',
        'bme688_voc',
        'ultrasonic_distance'
      ];

      const csvRows = sensorData.map(data => [
        new Date(data.timestamp).toISOString(),
        data.temperature.toFixed(3),
        data.acceleration.x.toFixed(3),
        data.acceleration.y.toFixed(3),
        data.acceleration.z.toFixed(3),
        data.gyroscope.pitch.toFixed(3),
        data.gyroscope.roll.toFixed(3),
        data.gyroscope.yaw.toFixed(3),
        data.bme688.temperature.toFixed(3),
        data.bme688.humidity.toFixed(3),
        data.bme688.pressure.toFixed(3),
        data.bme688.voc.toFixed(3),
        data.ultrasonic.distance.toFixed(3)
      ]);

      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
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
      // Keep WebSocket connection open for better user experience
    };
  }, []);

  // Prepare raw data for charts
  const rawChartData = sensorData.map(data => ({
    time: data.timestamp, // Keep original timestamp
    timeString: new Date(data.timestamp).toLocaleTimeString(), // For display
    temperature: data.temperature || 0,
    accelX: data.acceleration?.x || 0,
    accelY: data.acceleration?.y || 0,
    accelZ: data.acceleration?.z || 0,
    // BME688 data
    bmeTemp: data.bme688?.temperature || 0,
    humidity: data.bme688?.humidity || 0,
    pressure: data.bme688?.pressure || 0,
    voc: data.bme688?.voc || 0,
    // Ultrasonic data
    distance: data.ultrasonic?.distance || 0,
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
    const duration = currentTime - sessionStartTime.getTime();
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
                temperature: data.bme688?.temperature || 0,
                humidity: data.bme688?.humidity || 0,
                pressure: data.bme688?.pressure || 0,
                voc: data.bme688?.voc || 0
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
                  <p>Waiting for experiment to start</p>
          </div>
              </div>
            )}
            </div>
            
          {/* Combined Acceleration Data */}
          <div className="animate-fade-in">
            <AccelerationCombined 
              data={chartData}
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
                  <p>Waiting for experiment to start</p>
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
