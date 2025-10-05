import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { mockDataService } from '../lib/mockDataService';
import MockDataToggle from '../components/MockDataToggle';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Play, 
  Pause, 
  Square, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock,
  Target,
  AlertCircle,
  FlaskConical,
  BookOpen,
  History,
  LogOut
} from 'lucide-react';
import * as ExperimentData from '../data/experimentTemplates';
import type { SensorData } from '../types/sensorData';
import { useSimpleSpikeFilter } from '../hooks/useSimpleSpikeFilter';
import BME688Chart from '../components/BME688Chart';
import AccelerationCombined from '../components/AccelerationCombined';
import Gyroscope3D from '../components/Gyroscope3D';
import { createWebSocket } from '../lib/mockAPI';

// Function to determine which graphs to show based on experiment type
const getRequiredGraphs = (experimentId: string) => {
  const graphConfig = {
    'temp-pressure-change': {
      environmental: true,
      acceleration: false,
      gyroscope: false,
      distance: false
    },
    'shake-motion-test': {
      environmental: false,
      acceleration: true,
      gyroscope: true,
      distance: false
    },
    'distance-reaction': {
      environmental: false,
      acceleration: false,
      gyroscope: false,
      distance: true
    },
    'environmental-monitoring': {
      environmental: true,
      acceleration: false,
      gyroscope: false,
      distance: false
    }
  };
  
  return graphConfig[experimentId as keyof typeof graphConfig] || {
    environmental: true,
    acceleration: true,
    gyroscope: true,
    distance: true
  };
};

const ExperimentRunnerPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { isMockDataEnabled } = useMockData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<ExperimentData.ExperimentTemplate | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [stepStartTime, setStepStartTime] = useState<number | null>(null);
  const [stepElapsedTime, setStepElapsedTime] = useState(0);
  const [experimentStartTime, setExperimentStartTime] = useState<number | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [, setStepData] = useState<{ [stepId: string]: SensorData[] }>({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [conditionMet, setConditionMet] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDataPoints = 300; // Limit data points for smooth scrolling

  // Spike filter for data processing
  const {
    filteredData
  } = useSimpleSpikeFilter(sensorData || [], {
    windowSize: 5,
    threshold: 2
  });

  // Generate zero data when no real data is available
  const generateZeroData = useCallback((count: number = 10) => {
    const now = Date.now();
    return Array.from({ length: count }, (_, i) => ({
      timestamp: now - (count - i) * 1000,
      time: now - (count - i) * 1000,
      timeString: new Date(now - (count - i) * 1000).toLocaleTimeString(),
      temperature: 0,
      acceleration: { x: 0, y: 0, z: 0 },
      gyroscope: { pitch: 0, roll: 0, yaw: 0 },
      bme688: { temperature: 0, humidity: 0, pressure: 0, voc: 0 },
      ultrasonic: { distance: 0 },
      accelX: 0,
      accelY: 0,
      accelZ: 0,
      // Flatten BME688 data for BME688Chart component
      humidity: 0,
      pressure: 0,
      voc: 0
    }));
  }, []);

  // Transform data for AccelerationCombined component
  const transformedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return generateZeroData();
    }
    return filteredData.map(item => ({
      ...item,
      time: item.timestamp,
      timeString: new Date(item.timestamp).toLocaleTimeString(),
      accelX: item.acceleration?.x || 0,
      accelY: item.acceleration?.y || 0,
      accelZ: item.acceleration?.z || 0
    }));
  }, [filteredData, generateZeroData]);

  // Generate zero data for charts when no real data
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return generateZeroData();
    }
    // Flatten BME688 data for BME688Chart component
    return filteredData.map(item => ({
      ...item,
      temperature: item.bme688?.temperature || 0,
      humidity: item.bme688?.humidity || 0,
      pressure: item.bme688?.pressure || 0,
      voc: item.bme688?.voc || 0
    }));
  }, [filteredData, generateZeroData]);

  // Define functions before useEffects that use them
  const stopExperiment = useCallback(() => {
    setIsRunning(false);
    // Clear timer when stopping
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    // Keep WebSocket connection open for future experiments
  }, []);

  const nextStep = useCallback(() => {
    if (!template) return;

    // Save current step data
    const currentStep = template.steps[currentStepIndex];
        setStepData((prev: { [stepId: string]: SensorData[] }) => ({
      ...prev,
      [currentStep.id]: [...sensorData]
    }));
    setCompletedSteps(prev => new Set([...prev, currentStep.id]));

    // Move to next step
    if (currentStepIndex < template.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setStepStartTime(Date.now());
      setStepElapsedTime(0);
      setConditionMet(false);
    } else {
      // Experiment completed
      stopExperiment();
      navigate(`/experiment/${id}/results`);
    }
  }, [template, currentStepIndex, sensorData, id, navigate, stopExperiment]);

  const startExperiment = () => {
    setIsRunning(true);
    setExperimentStartTime(Date.now());
    setStepStartTime(Date.now());
    setStepElapsedTime(0);
    // Keep real-time data flowing, just reset experiment state
    setStepData({});
    setCompletedSteps(new Set());
    setCurrentStepIndex(0);
  };

  const pauseExperiment = () => {
    setIsRunning(false);
  };

  const resumeExperiment = () => {
    setIsRunning(true);
    setStepStartTime(Date.now() - stepElapsedTime * 1000);
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setStepStartTime(Date.now());
      setStepElapsedTime(0);
      setConditionMet(false);
    }
  };

  // Load experiment template
  useEffect(() => {
    if (id) {
      const experimentTemplate = ExperimentData.getExperimentTemplate(id);
      if (experimentTemplate) {
        setTemplate(experimentTemplate);
      } else {
        navigate('/experiments');
      }
    }
  }, [id, navigate]);

  // Timer for step duration
  useEffect(() => {
    if (isRunning && stepStartTime) {
      timerRef.current = setInterval(() => {
        setStepElapsedTime(Math.floor((Date.now() - stepStartTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, stepStartTime]);

  // Connect to WebSocket for real-time data or use mock data
  useEffect(() => {
    if (isMockDataEnabled) {
      // Generate initial data points for realistic graphs
      const initialData = mockDataService.generateInitialDataPoints(50);
      setSensorData(initialData);
      
      // Use mock data service
      mockDataService.enable((data) => {
        console.log('Mock data received in experiment:', data);
        setSensorData(prevData => {
          const newDataArray = [data, ...prevData].slice(0, maxDataPoints);
          return newDataArray;
        });
      });
    } else {
      // Connect to WebSocket for real-time data
      wsRef.current = createWebSocket((data) => {
        console.log('WebSocket data received in experiment:', data);
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

            console.log('Processed new data in experiment:', newData);
            setSensorData(prevData => {
              const newDataArray = [newData, ...prevData].slice(0, maxDataPoints);
              console.log('Updated sensor data array length in experiment:', newDataArray.length);
              return newDataArray;
            });

            // Update current data
            console.log('Updated current data in experiment:', newData);
          }
        } catch (error) {
          console.error('Error processing WebSocket data in experiment:', error);
        }
      });
    }

    return () => {
      if (isMockDataEnabled) {
        mockDataService.disable();
      } else if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isMockDataEnabled]); // Re-run when mock data mode changes

  // Check if step duration has been reached
  useEffect(() => {
    if (!template || !isRunning || !stepStartTime) return;

    const currentStep = template.steps[currentStepIndex];
    const stepDurationMs = currentStep.duration * 1000; // Convert seconds to milliseconds
    const elapsedMs = Date.now() - stepStartTime;

    if (elapsedMs >= stepDurationMs) {
      // Step duration reached, move to next step
      nextStep();
    }
  }, [stepElapsedTime, template, currentStepIndex, isRunning, stepStartTime, nextStep]);

  // Check step conditions
  useEffect(() => {
    if (!template || !isRunning) return;

    const currentStep = template.steps[currentStepIndex];
    if (!currentStep.condition) return;

    // If no data, condition is not met
    if (sensorData.length === 0) {
      setConditionMet(false);
      return;
    }

    const latestData = sensorData[sensorData.length - 1];
    let conditionSatisfied = false;

    switch (currentStep.condition.type) {
      case 'temperature_rise':
        if (sensorData.length > 10) {
          const recent = sensorData.slice(-10);
          const oldest = recent[0].temperature;
          const newest = recent[recent.length - 1].temperature;
          conditionSatisfied = (newest - oldest) >= currentStep.condition.threshold;
        }
        break;
      case 'temperature_fall':
        if (sensorData.length > 10) {
          const recent = sensorData.slice(-10);
          const oldest = recent[0].temperature;
          const newest = recent[recent.length - 1].temperature;
          conditionSatisfied = (oldest - newest) >= currentStep.condition.threshold;
        }
        break;
      case 'motion_detected':
        const acceleration = Math.sqrt(latestData.acceleration.x ** 2 + latestData.acceleration.y ** 2 + latestData.acceleration.z ** 2);
        conditionSatisfied = acceleration >= currentStep.condition.threshold;
        break;
      case 'distance_change':
        if (sensorData.length > 5) {
          const recent = sensorData.slice(-5);
          const avgDistance = recent.reduce((sum, d) => sum + d.ultrasonic.distance, 0) / recent.length;
          conditionSatisfied = Math.abs(avgDistance - 0.5) >= currentStep.condition.threshold;
        }
        break;
      case 'pressure_change':
        if (sensorData.length > 10) {
          const recent = sensorData.slice(-10);
          const oldest = recent[0].bme688.pressure;
          const newest = recent[recent.length - 1].bme688.pressure;
          conditionSatisfied = Math.abs(newest - oldest) >= currentStep.condition.threshold;
        }
        break;
    }

    setConditionMet(conditionSatisfied);
  }, [template, currentStepIndex, isRunning, sensorData]);

  // Auto-advance when condition is met
  useEffect(() => {
    if (conditionMet && template && currentStepIndex < template.steps.length - 1) {
      setTimeout(() => {
        nextStep();
      }, 2000); // Wait 2 seconds before advancing
    }
  }, [conditionMet, template, currentStepIndex]);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepProgress = () => {
    if (!template) return 0;
    return ((currentStepIndex + 1) / template.steps.length) * 100;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading experiment...</div>
      </div>
    );
  }

  const currentStep = template.steps[currentStepIndex];
  const isLastStep = currentStepIndex === template.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <div className="min-h-screen bg-gray-900 pt-24">
      {/* Enhanced Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-8 h-8 text-blue-500 hover:text-blue-400 transition-colors" />
                <h1 className="text-2xl font-bold text-white">PocketLab</h1>
              </div>
              <span className="text-sm text-gray-400 hidden sm:block">Experiment Runner</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors hover-lift"
              >
                <BookOpen className="w-5 h-5" />
                <span className="hidden sm:block">Dashboard</span>
              </Link>
              
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">{template.title}</h1>
          <p className="text-gray-400">{template.category} • {template.difficulty}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Step {currentStepIndex + 1} of {template.steps.length}</span>
            <span>{Math.round(getStepProgress())}% Complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getStepProgress()}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls and Instructions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Step */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {currentStep.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(stepElapsedTime)} / {formatTime(currentStep.duration)}</span>
                    </div>
                    {currentStep.condition && (
                      <div className="flex items-center gap-1">
                        {conditionMet ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className={conditionMet ? 'text-green-400' : 'text-yellow-400'}>
                          {conditionMet ? 'Condition Met!' : 'Waiting...'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-gray-300 mb-4 leading-relaxed">
                {currentStep.instruction}
              </p>

              {currentStep.condition && (
                <div className="bg-gray-700 rounded-lg p-3 mb-4">
                  <h4 className="text-white font-medium mb-1">Condition to Meet:</h4>
                  <p className="text-gray-300 text-sm">
                    {currentStep.condition.description}
                  </p>
                </div>
              )}

              <div className="bg-gray-700 rounded-lg p-3">
                <h4 className="text-white font-medium mb-1">Expected Outcome:</h4>
                <p className="text-gray-300 text-sm">
                  {currentStep.expectedOutcome}
                </p>
              </div>
            </div>

            {/* Controls */}
            {/* Mock Data Toggle */}
            <div className="mb-6 flex justify-center">
              <MockDataToggle />
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Experiment Controls</h3>
              
              <div className="space-y-3">
                {!isRunning ? (
                  <button
                    onClick={startExperiment}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Experiment
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={pauseExperiment}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                    <button
                      onClick={stopExperiment}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </button>
                  </div>
                )}

                {!isRunning && experimentStartTime && (
                  <button
                    onClick={resumeExperiment}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={previousStep}
                    disabled={isFirstStep}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={isLastStep}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Step List */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">All Steps</h3>
              <div className="space-y-2">
                {template.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      index === currentStepIndex
                        ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                        : completedSteps.has(step.id)
                        ? 'bg-green-500/20 border-green-500 text-green-400'
                        : 'bg-gray-700 border-gray-600 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {completedSteps.has(step.id) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-current" />
                      )}
                      <span className="font-medium">{step.title}</span>
                    </div>
                    <p className="text-sm mt-1 opacity-80">
                      {formatTime(step.duration)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Data Visualization */}
          <div className="lg:col-span-2 space-y-6">
            {(() => {
              const requiredGraphs = getRequiredGraphs(id || '');
              
              return (
                <>
                  {/* Environmental Data */}
                  {requiredGraphs.environmental && (
                    <div className="relative">
                      {sensorData.length === 0 && (
                        <div className="absolute top-2 right-2 z-10 bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                          No Data - Showing Zero
                        </div>
                      )}
                      <BME688Chart key={`env-${chartData.length}`} data={chartData} />
                    </div>
                  )}

                  {/* Motion Data */}
                  {requiredGraphs.acceleration && (
                    <div className="relative">
                      {sensorData.length === 0 && (
                        <div className="absolute top-2 right-2 z-10 bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                          No Data - Showing Zero
                        </div>
                      )}
                      <AccelerationCombined key={`accel-${transformedData.length}`} data={transformedData}  />
                    </div>
                  )}

                  {/* Gyroscope 3D */}
                  {requiredGraphs.gyroscope && (
                    <div key={`gyro-${chartData.length}`} className="bg-gray-800 rounded-xl p-6 border border-gray-700 relative">
                      {sensorData.length === 0 && (
                        <div className="absolute top-2 right-2 z-10 bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                          No Data - Showing Zero
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-white mb-4">3D Gyroscope</h3>
                      <Gyroscope3D
                        pitch={chartData.length > 0 ? (chartData[chartData.length - 1]?.gyroscope?.pitch || 0) : 0}
                        roll={chartData.length > 0 ? (chartData[chartData.length - 1]?.gyroscope?.roll || 0) : 0}
                        yaw={chartData.length > 0 ? (chartData[chartData.length - 1]?.gyroscope?.yaw || 0) : 0}
                        width={600}
                        height={300}
                      />
                    </div>
                  )}

                  {/* Distance Chart */}
                  {requiredGraphs.distance && (
                    <div key={`distance-${chartData.length}`} className="bg-gray-800 rounded-xl p-6 border border-gray-700 relative">
                      {sensorData.length === 0 && (
                        <div className="absolute top-2 right-2 z-10 bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                          No Data - Showing Zero
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-white mb-4">Distance Measurement</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart key={`distance-chart-${chartData.length}`} data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="timestamp"
                              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                              stroke="#9CA3AF"
                              fontSize={12}
                            />
                            <YAxis 
                              label={{ value: 'Distance (m)', angle: -90, position: 'insideLeft' }}
                              stroke="#9CA3AF"
                              fontSize={12}
                              tickFormatter={(value) => value.toFixed(2)}
                            />
                            <Tooltip 
                              labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                              formatter={(value: number) => [`${value.toFixed(3)} m`, 'Distance']}
                              contentStyle={{ 
                                backgroundColor: '#1F2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#F9FAFB'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="ultrasonic.distance" 
                              stroke="#3B82F6" 
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4, fill: '#3B82F6' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperimentRunnerPage;
