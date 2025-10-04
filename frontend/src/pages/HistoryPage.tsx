import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FlaskConical, 
  ArrowLeft, 
  Download, 
  Calendar,
  Clock,
  Thermometer,
  Activity,
  Trash2
} from 'lucide-react';

interface ExperimentHistory {
  id: string;
  name: string;
  date: string;
  duration: string;
  dataPoints: number;
  avgTemperature: number;
  maxAcceleration: number;
}

const HistoryPage: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentHistory[]>([]);

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
      },
      {
        id: '2',
        name: 'Motion Analysis',
        date: '2024-01-14',
        duration: '8:45',
        dataPoints: 525,
        avgTemperature: 21.8,
        maxAcceleration: 4.7,
      },
      {
        id: '3',
        name: 'Environmental Monitoring',
        date: '2024-01-13',
        duration: '22:15',
        dataPoints: 1335,
        avgTemperature: 24.1,
        maxAcceleration: 1.2,
      },
    ];
    setExperiments(mockExperiments);
  }, []);

  const downloadExperiment = (experiment: ExperimentHistory) => {
    // Mock CSV download
    const csvContent = `Experiment Name,Date,Duration,Data Points,Avg Temperature,Max Acceleration
${experiment.name},${experiment.date},${experiment.duration},${experiment.dataPoints},${experiment.avgTemperature},${experiment.maxAcceleration}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${experiment.name.replace(/\s+/g, '-').toLowerCase()}-${experiment.date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const deleteExperiment = (id: string) => {
    setExperiments(prev => prev.filter(exp => exp.id !== id));
  };

  return (
    <div className="min-h-screen bg-lab-dark">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-lab-teal/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
              
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-8 h-8 text-lab-teal" />
                <h1 className="text-2xl font-bold text-white">LabLink</h1>
              </div>
              <span className="text-sm text-gray-400">Experiment History</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Experiment History</h2>
          <p className="text-gray-400">View and manage your past experiments</p>
        </div>

        {experiments.length === 0 ? (
          <div className="card-glow rounded-2xl p-12 text-center">
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
              <div key={experiment.id} className="card-glow rounded-2xl p-6 hover:shadow-xl hover:shadow-lab-teal/20 transition-all duration-200">
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
                      <Thermometer className="w-4 h-4 text-lab-teal" />
                      <span className="text-xs text-gray-400">Avg Temp</span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {experiment.avgTemperature.toFixed(1)}°C
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Activity className="w-4 h-4 text-lab-green" />
                      <span className="text-xs text-gray-400">Max Accel</span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {experiment.maxAcceleration.toFixed(1)}g
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => downloadExperiment(experiment)}
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
    </div>
  );
};

export default HistoryPage;
