import React from 'react';
import { Filter, BarChart3, Settings, Download } from 'lucide-react';

interface SpikeFilterControlsProps {
  showClean: boolean;
  setShowClean: (show: boolean) => void;
  spikeStats: {
    totalDataPoints: number;
    totalSpikes: number;
    spikePercentage: number;
    spikesBySensor: Record<string, number>;
  };
  onExportRaw: () => void;
  onExportClean: () => void;
  windowSize: number;
  threshold: number;
  onWindowSizeChange: (size: number) => void;
  onThresholdChange: (threshold: number) => void;
}

const SpikeFilterControls: React.FC<SpikeFilterControlsProps> = ({
  showClean,
  setShowClean,
  spikeStats,
  onExportRaw,
  onExportClean,
  windowSize,
  threshold,
  onWindowSizeChange,
  onThresholdChange
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Filter className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Spike Filter</h3>
            <p className="text-sm text-gray-400">Real-time data cleaning with rolling mean + std dev</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowClean(!showClean)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              showClean
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
            }`}
          >
            {showClean ? 'Show Clean Data' : 'Show Raw Data'}
          </button>
        </div>
      </div>

      {/* Filter Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">Data Points</span>
          </div>
          <div className="text-xl font-bold text-white">{spikeStats.totalDataPoints}</div>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Filter className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-300">Spikes Detected</span>
          </div>
          <div className="text-xl font-bold text-white">{spikeStats.totalSpikes}</div>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Settings className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">Spike Rate</span>
          </div>
          <div className="text-xl font-bold text-white">{spikeStats.spikePercentage.toFixed(1)}%</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Window Size: {windowSize}
          </label>
          <input
            type="range"
            min="5"
            max="20"
            value={windowSize}
            onChange={(e) => onWindowSizeChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5</span>
            <span>20</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Threshold: {threshold}σ
          </label>
          <input
            type="range"
            min="1"
            max="4"
            step="0.5"
            value={threshold}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1σ</span>
            <span>4σ</span>
          </div>
        </div>
      </div>

      {/* Export Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          <span className="font-medium">Algorithm:</span> Rolling Mean + Standard Deviation
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onExportRaw}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all duration-200 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Raw</span>
          </button>
          
          <button
            onClick={onExportClean}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all duration-200 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Clean</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpikeFilterControls;
