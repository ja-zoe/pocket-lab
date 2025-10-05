import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FlaskConical, 
  Download, 
  Calendar,
  Clock,
  Thermometer,
  Activity,
  Trash2,
  X,
  Filter,
  BookOpen,
  LogOut
} from 'lucide-react';

interface ExperimentHistory {
  id: string;
  name: string;
  date: string;
  duration: string;
  dataPoints: number;
  avgTemperature: number;
  maxAcceleration: number;
  startTime?: string;
  endTime?: string;
}

interface TimeframeSelection {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  includeAllData: boolean;
}

const HistoryPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState<ExperimentHistory[]>([]);
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentHistory | null>(null);
  const [timeframeSelection, setTimeframeSelection] = useState<TimeframeSelection>({
    startDate: '',
    endDate: '',
    startTime: '00:00',
    endTime: '23:59',
    includeAllData: true
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockExperiments: ExperimentHistory[] = [
      {
        id: '1',
        name: 'Temperature Stability Test',
        date: '2024-01-15',
        duration: '15:30',
        dataPoints: 930,
        avgTemperature: 23.4,
        maxAcceleration: 2.1,
        startTime: '09:00',
        endTime: '00:30'
      },
      {
        id: '2',
        name: 'Motion Analysis',
        date: '2024-01-14',
        duration: '8:45',
        dataPoints: 525,
        avgTemperature: 21.8,
        maxAcceleration: 4.7,
        startTime: '14:15',
        endTime: '23:00'
      },
      {
        id: '3',
        name: 'Environmental Monitoring',
        date: '2024-01-13',
        duration: '22:15',
        dataPoints: 1335,
        avgTemperature: 24.1,
        maxAcceleration: 1.2,
        startTime: '08:30',
        endTime: '06:45'
      },
    ];
    setExperiments(mockExperiments);
  }, []);

  const openTimeframeModal = (experiment: ExperimentHistory) => {
    setSelectedExperiment(experiment);
    setTimeframeSelection({
      startDate: experiment.date,
      endDate: experiment.date,
      startTime: experiment.startTime || '00:00',
      endTime: experiment.endTime || '23:59',
      includeAllData: true
    });
    setShowTimeframeModal(true);
  };

  const downloadExperiment = (experiment: ExperimentHistory, timeframe?: TimeframeSelection) => {
    // Mock CSV download with timeframe information
    const timeframeInfo = timeframe && !timeframe.includeAllData 
      ? `\nTimeframe: ${timeframe.startDate} ${timeframe.startTime} to ${timeframe.endDate} ${timeframe.endTime}`
      : '\nTimeframe: All data';
    
    const csvContent = `Experiment Name,Date,Duration,Data Points,Avg Temperature,Max Acceleration${timeframeInfo}
${experiment.name},${experiment.date},${experiment.duration},${experiment.dataPoints},${experiment.avgTemperature},${experiment.maxAcceleration}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timeframeSuffix = timeframe && !timeframe.includeAllData 
      ? `-${timeframe.startDate}-${timeframe.startTime}-to-${timeframe.endDate}-${timeframe.endTime}`
      : '';
    a.download = `${experiment.name.replace(/\s+/g, '-').toLowerCase()}-${experiment.date}${timeframeSuffix}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Close modal if open
    setShowTimeframeModal(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleTimeframeChange = (field: keyof TimeframeSelection, value: string | boolean) => {
    setTimeframeSelection(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const deleteExperiment = (id: string) => {
    setExperiments(prev => prev.filter(exp => exp.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Enhanced Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-8 h-8 text-blue-500 hover:text-blue-400 transition-colors" />
                <h1 className="text-2xl font-bold text-white">PocketLab</h1>
              </div>
              <span className="text-sm text-gray-400 hidden sm:block">Experiment History</span>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Experiment History</h2>
          <p className="text-gray-400">View and manage your past experiments</p>
        </div>

        {experiments.length === 0 ? (
          <div className="card-glow p-12 text-center">
            <FlaskConical className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Experiments Yet</h3>
            <p className="text-gray-400 mb-6">Start your first experiment to see it here</p>
            <Link
              to="/dashboard"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <FlaskConical className="w-5 h-5" />
              <span>Start Experiment</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiments.map((experiment) => (
              <div key={experiment.id} className="card-glow p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{experiment.name}</h3>
                  <button
                    onClick={() => deleteExperiment(experiment.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>{experiment.date}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span>{experiment.duration}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Activity className="w-4 h-4" />
                    <span>{experiment.dataPoints} data points</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Thermometer className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-gray-400">Avg Temp</span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {experiment.avgTemperature.toFixed(1)}°C
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Activity className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-gray-400">Max Accel</span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {experiment.maxAcceleration.toFixed(1)} m/s²
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openTimeframeModal(experiment)}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Data</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Timeframe Selection Modal */}
      {showTimeframeModal && selectedExperiment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Export Timeframe</h3>
              </div>
              <button
                onClick={() => setShowTimeframeModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-1">{selectedExperiment.name}</h4>
              <p className="text-xs text-gray-400">
                {selectedExperiment.date} • {selectedExperiment.duration} • {selectedExperiment.dataPoints} data points
              </p>
            </div>

            <div className="space-y-4">
              {/* Include All Data Toggle */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="includeAllData"
                  checked={timeframeSelection.includeAllData}
                  onChange={(e) => handleTimeframeChange('includeAllData', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="includeAllData" className="text-sm text-gray-300">
                  Export all data from this experiment
                </label>
              </div>

              {!timeframeSelection.includeAllData && (
                <div className="space-y-4 pl-7 border-l-2 border-gray-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={timeframeSelection.startDate}
                        onChange={(e) => handleTimeframeChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">End Date</label>
                      <input
                        type="date"
                        value={timeframeSelection.endDate}
                        onChange={(e) => handleTimeframeChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={timeframeSelection.startTime}
                        onChange={(e) => handleTimeframeChange('startTime', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">End Time</label>
                      <input
                        type="time"
                        value={timeframeSelection.endTime}
                        onChange={(e) => handleTimeframeChange('endTime', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowTimeframeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => downloadExperiment(selectedExperiment, timeframeSelection)}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
