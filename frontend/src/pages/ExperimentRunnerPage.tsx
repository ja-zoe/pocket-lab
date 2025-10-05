import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  Download,
  FlaskConical,
  BookOpen,
  History,
  LogOut
} from 'lucide-react';
import * as ExperimentData from '../data/experimentTemplates';
import { useSimpleSpikeFilter } from '../hooks/useSimpleSpikeFilter';
import BME688Chart from '../components/BME688Chart';
import AccelerationCombined from '../components/AccelerationCombined';
import Gyroscope3D from '../components/Gyroscope3D';

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

interface SensorData {
  timestamp: number;
  temperature: number;
  pressure: number;
  humidity: number;
  gasResistance: number;
  vocIndex: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  distance: number;
}

const ExperimentRunnerPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<ExperimentData.ExperimentTemplate | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [stepStartTime, setStepStartTime] = useState<number | null>(null);
  const [stepElapsedTime, setStepElapsedTime] = useState(0);
  const [experimentStartTime, setExperimentStartTime] = useState<number | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [stepData, setStepData] = useState<{ [stepId: string]: SensorData[] }>({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [conditionMet, setConditionMet] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Spike filter for data processing
  const {
    filteredData,
    showClean,
    setShowClean,
    spikeStats,
    filterOptions,
    updateFilterOptions
  } = useSimpleSpikeFilter(sensorData || [], {
    windowSize: 5,
    threshold: 2
  });

  // Transform data for AccelerationCombined component
  const transformedData = useMemo(() => {
    return filteredData.map(item => ({
      ...item,
      time: item.timestamp,
      timeString: new Date(item.timestamp).toLocaleTimeString()
    }));
  }, [filteredData]);

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

  // Mock sensor data generation - only when experiment is running
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const newData: SensorData = {
          timestamp: now,
          temperature: 20 + Math.sin(now * 0.001) * 5 + Math.random() * 2,
          pressure: 101300 + Math.sin(now * 0.0005) * 1000 + Math.random() * 100,
          humidity: 50 + Math.sin(now * 0.0008) * 10 + Math.random() * 5,
          gasResistance: 1000 + Math.sin(now * 0.0003) * 200 + Math.random() * 50,
          vocIndex: 100 + Math.sin(now * 0.0007) * 20 + Math.random() * 10,
          accelX: Math.sin(now * 0.002) * 2 + Math.random() * 0.5,
          accelY: Math.cos(now * 0.0015) * 1.5 + Math.random() * 0.3,
          accelZ: 9.81 + Math.sin(now * 0.001) * 0.5 + Math.random() * 0.2,
          gyroX: Math.sin(now * 0.001) * 0.5 + Math.random() * 0.1,
          gyroY: Math.cos(now * 0.0008) * 0.3 + Math.random() * 0.08,
          gyroZ: Math.sin(now * 0.0012) * 0.6 + Math.random() * 0.15,
          distance: 0.5 + Math.sin(now * 0.0015) * 0.4 + Math.random() * 0.1
        };

        setSensorData(prev => [...prev.slice(-100), newData]);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]); // Run when isRunning changes

  // Check step conditions
  useEffect(() => {
    if (!template || !isRunning || sensorData.length === 0) return;

    const currentStep = template.steps[currentStepIndex];
    if (!currentStep.condition) return;

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
        const acceleration = Math.sqrt(latestData.accelX ** 2 + latestData.accelY ** 2 + latestData.accelZ ** 2);
        conditionSatisfied = acceleration >= currentStep.condition.threshold;
        break;
      case 'distance_change':
        if (sensorData.length > 5) {
          const recent = sensorData.slice(-5);
          const avgDistance = recent.reduce((sum, d) => sum + d.distance, 0) / recent.length;
          conditionSatisfied = Math.abs(avgDistance - 0.5) >= currentStep.condition.threshold;
        }
        break;
      case 'pressure_change':
        if (sensorData.length > 10) {
          const recent = sensorData.slice(-10);
          const oldest = recent[0].pressure;
          const newest = recent[recent.length - 1].pressure;
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

  const startExperiment = () => {
    setIsRunning(true);
    setExperimentStartTime(Date.now());
    setStepStartTime(Date.now());
    setStepElapsedTime(0);
    // Clear previous data and start fresh
    setSensorData([]);
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

  const stopExperiment = () => {
    setIsRunning(false);
    // Clear both intervals when stopping
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const nextStep = () => {
    if (!template) return;

    // Save current step data
    const currentStep = template.steps[currentStepIndex];
    setStepData(prev => ({
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
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setStepStartTime(Date.now());
      setStepElapsedTime(0);
      setConditionMet(false);
    }
  };

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
                    <BME688Chart key={`env-${filteredData.length}`} data={filteredData} />
                  )}

                  {/* Motion Data */}
                  {requiredGraphs.acceleration && (
                    <AccelerationCombined key={`accel-${transformedData.length}`} data={transformedData} width={600} height={300} />
                  )}

                  {/* Gyroscope 3D */}
                  {requiredGraphs.gyroscope && filteredData && filteredData.length > 0 && (
                    <div key={`gyro-${filteredData.length}`} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <h3 className="text-lg font-semibold text-white mb-4">3D Gyroscope</h3>
                      <Gyroscope3D
                        pitch={filteredData[filteredData.length - 1]?.gyroX || 0}
                        roll={filteredData[filteredData.length - 1]?.gyroZ || 0}
                        yaw={filteredData[filteredData.length - 1]?.gyroY || 0}
                        width={600}
                        height={300}
                      />
                    </div>
                  )}

                  {/* Distance Chart */}
                  {requiredGraphs.distance && filteredData && filteredData.length > 0 && (
                    <div key={`distance-${filteredData.length}`} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <h3 className="text-lg font-semibold text-white mb-4">Distance Measurement</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart key={`distance-chart-${filteredData.length}`} data={filteredData}>
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
                              dataKey="distance" 
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
