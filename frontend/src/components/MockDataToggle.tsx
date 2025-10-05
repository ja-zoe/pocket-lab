import React from 'react';
import { useMockData } from '../context/MockDataContext';
import { Play, Square } from 'lucide-react';

const MockDataToggle: React.FC = () => {
  const { isMockDataEnabled, toggleMockData, mockDataStatus } = useMockData();

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={toggleMockData}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
          ${isMockDataEnabled 
            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg' 
            : 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
          }
        `}
      >
        {isMockDataEnabled ? (
          <>
            <Square className="w-4 h-4" />
            <span>Stop Mock Data</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span>Simulate Mock Data</span>
          </>
        )}
      </button>
      
      <div className={`
        text-xs px-3 py-1 rounded-full font-medium
        ${isMockDataEnabled 
          ? 'bg-orange-100 text-orange-800 border border-orange-200' 
          : 'bg-green-100 text-green-800 border border-green-200'
        }
      `}>
        {isMockDataEnabled ? '🎭 Demo Mode' : '📡 Live Mode'}
      </div>
      
      <p className="text-xs text-gray-600 text-center max-w-xs">
        {mockDataStatus}
      </p>
    </div>
  );
};

export default MockDataToggle;
