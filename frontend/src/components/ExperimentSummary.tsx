import React from 'react';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Thermometer, 
  Wind, 
  Droplets,
  Ruler,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface ExperimentSummaryData {
  duration: number;
  dataPoints: number;
  timestamp: string;
  statistics: {
    temperature: {
      min: number;
      max: number;
      avg: number;
      change: number;
      unit: string;
    };
    acceleration: {
      x: { min: number; max: number; avg: number; unit: string };
      y: { min: number; max: number; avg: number; unit: string };
      z: { min: number; max: number; avg: number; unit: string };
    };
    pressure: {
      min: number;
      max: number;
      avg: number;
      change: number;
      unit: string;
    };
    humidity: {
      min: number;
      max: number;
      avg: number;
      change: number;
      unit: string;
    };
    distance: {
      min: number;
      max: number;
      avg: number;
      change: number;
      unit: string;
    };
  };
  events: Array<{
    type: string;
    description: string;
    timestamp: number;
    severity: string;
  }>;
  commentary: string;
  dataQuality: {
    anomalies: number;
    motionEvents: number;
    totalEvents: number;
  };
}

interface ExperimentSummaryProps {
  summary: ExperimentSummaryData;
  onDownloadCSV: () => void;
  onDownloadPDF: () => void;
  onClose: () => void;
}

const ExperimentSummary: React.FC<ExperimentSummaryProps> = ({
  summary,
  onDownloadCSV,
  onDownloadPDF,
  onClose
}) => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <BarChart3 className="w-4 h-4 text-gray-500" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Experiment Summary</h2>
              <p className="text-sm text-gray-400">AI-Generated Analysis Report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-400">Duration</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatDuration(summary.duration)}</div>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-400">Data Points</span>
            </div>
            <div className="text-2xl font-bold text-white">{summary.dataPoints.toLocaleString()}</div>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-400">Data Quality</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {summary.dataQuality.anomalies === 0 ? 'Clean' : `${summary.dataQuality.anomalies} Issues`}
            </div>
          </div>
        </div>

        {/* AI Commentary */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 mb-6 border border-blue-500/20">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-400">AI Analysis</span>
          </div>
          <p className="text-gray-300 leading-relaxed">{summary.commentary}</p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Temperature */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Thermometer className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-gray-300">Temperature</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Range</span>
                <span className="text-sm text-white">
                  {summary.statistics.temperature.min.toFixed(1)} - {summary.statistics.temperature.max.toFixed(1)}°C
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Average</span>
                <span className="text-sm text-white">{summary.statistics.temperature.avg.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Change</span>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(summary.statistics.temperature.change)}
                  <span className="text-sm text-white">
                    {summary.statistics.temperature.change > 0 ? '+' : ''}{summary.statistics.temperature.change.toFixed(1)}°C
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pressure */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Wind className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-300">Pressure</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Range</span>
                <span className="text-sm text-white">
                  {(summary.statistics.pressure.min/100).toFixed(1)} - {(summary.statistics.pressure.max/100).toFixed(1)} hPa
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Average</span>
                <span className="text-sm text-white">{(summary.statistics.pressure.avg/100).toFixed(1)} hPa</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Change</span>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(summary.statistics.pressure.change)}
                  <span className="text-sm text-white">
                    {summary.statistics.pressure.change > 0 ? '+' : ''}{(summary.statistics.pressure.change/100).toFixed(1)} hPa
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Humidity */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Droplets className="w-5 h-5 text-cyan-500" />
              <span className="text-sm font-medium text-gray-300">Humidity</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Range</span>
                <span className="text-sm text-white">
                  {summary.statistics.humidity.min.toFixed(1)} - {summary.statistics.humidity.max.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Average</span>
                <span className="text-sm text-white">{summary.statistics.humidity.avg.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Change</span>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(summary.statistics.humidity.change)}
                  <span className="text-sm text-white">
                    {summary.statistics.humidity.change > 0 ? '+' : ''}{summary.statistics.humidity.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Acceleration */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-300">Acceleration</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">X-axis</span>
                <span className="text-sm text-white">{summary.statistics.acceleration.x.avg.toFixed(1)} m/s²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Y-axis</span>
                <span className="text-sm text-white">{summary.statistics.acceleration.y.avg.toFixed(1)} m/s²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Z-axis</span>
                <span className="text-sm text-white">{summary.statistics.acceleration.z.avg.toFixed(1)} m/s²</span>
              </div>
            </div>
          </div>

          {/* Distance */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Ruler className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-300">Distance</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Range</span>
                <span className="text-sm text-white">
                  {summary.statistics.distance.min.toFixed(2)} - {summary.statistics.distance.max.toFixed(2)} m
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Average</span>
                <span className="text-sm text-white">{summary.statistics.distance.avg.toFixed(2)} m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Change</span>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(summary.statistics.distance.change)}
                  <span className="text-sm text-white">
                    {summary.statistics.distance.change > 0 ? '+' : ''}{summary.statistics.distance.change.toFixed(2)} m
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events */}
        {summary.events.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span>Detected Events</span>
            </h3>
            <div className="space-y-2">
              {summary.events.map((event, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(event.severity)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{event.description}</span>
                    <span className="text-xs opacity-75">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onDownloadCSV}
            className="flex-1 btn-secondary flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Report</span>
          </button>
          <button
            onClick={onDownloadPDF}
            className="flex-1 btn-primary flex items-center justify-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExperimentSummary;
