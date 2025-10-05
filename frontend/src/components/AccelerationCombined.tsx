import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, BarChart3, RotateCcw } from 'lucide-react';
import Acceleration3D from './Acceleration3D';

interface AccelerationCombinedProps {
  data: any[];
  width?: number;
  height?: number;
}

type ViewType = 'timeSeries' | '3d';

const AccelerationCombined: React.FC<AccelerationCombinedProps> = ({ 
  data, 
  width = 600
}) => {
  const [selectedView, setSelectedView] = useState<ViewType>('timeSeries');

  const viewConfig = {
    timeSeries: {
      key: 'timeSeries',
      label: 'Time Series',
      icon: <BarChart3 className="w-4 h-4" />,
      description: '3-axis accelerometer data over time'
    },
    '3d': {
      key: '3d',
      label: '3D Visualization',
      icon: <RotateCcw className="w-4 h-4" />,
      description: 'Real-time 3D acceleration visualization'
    }
  };

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(item => ({
      timestamp: item.time, // Keep original timestamp
      timeString: item.timeString, // For display
      time: item.time,
      accelX: item.acceleration?.x || 0,
      accelY: item.acceleration?.y || 0,
      accelZ: item.acceleration?.z || 0,
    }));
  }, [data]);

  const currentConfig = viewConfig[selectedView];
  const currentData = (data && data.length > 0) ? data[data.length - 1] : { 
    acceleration: { x: 0, y: 0, z: 0 } 
  };

  // Custom tooltip for time series
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2 text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-gray-300">{entry.dataKey}:</span>
              <span className="text-white font-medium">{entry.value?.toFixed(1)} m/s²</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-glow p-6">
      {/* Header with dropdown */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            {currentConfig.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Acceleration Data</h3>
            <p className="text-sm text-gray-400">{currentConfig.description}</p>
          </div>
        </div>
        
        {/* View Selection Dropdown */}
        <div className="relative">
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value as ViewType)}
            className="appearance-none bg-gradient-to-r from-gray-800 to-gray-700 border border-red-500/30 rounded-xl px-4 py-3 pr-10 text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20 cursor-pointer"
          >
            <option value="timeSeries" className="bg-gray-700 text-white">Time Series</option>
            <option value="3d" className="bg-gray-700 text-white">3D Visualization</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <div className="p-1 bg-red-500/20 rounded-full">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Current Value Display */}
      <div className="mb-4 p-4 bg-gray-800/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Acceleration</p>
              <div className="flex space-x-4 text-sm">
                <div>
                  <span className="text-gray-400">X:</span>
                  <span className="text-white font-medium ml-1">{currentData.accelX?.toFixed(1)} m/s²</span>
                </div>
                <div>
                  <span className="text-gray-400">Y:</span>
                  <span className="text-white font-medium ml-1">{currentData.accelY?.toFixed(1)} m/s²</span>
                </div>
                <div>
                  <span className="text-gray-400">Z:</span>
                  <span className="text-white font-medium ml-1">{currentData.accelZ?.toFixed(1)} m/s²</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Magnitude */}
          <div className="text-right">
            <p className="text-sm text-gray-400">Magnitude</p>
            <p className="text-lg font-bold text-white">
              {Math.sqrt(
                Math.pow(currentData.accelX || 0, 2) + 
                Math.pow(currentData.accelY || 0, 2) + 
                Math.pow(currentData.accelZ || 0, 2)
              ).toFixed(1)} m/s²
            </p>
          </div>
        </div>
      </div>

      {/* Content based on selected view */}
      {selectedView === 'timeSeries' ? (
        /* Time Series Chart */
        <div className="w-full h-80 overflow-hidden max-w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#9ca3af"
                fontSize={10}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={{ stroke: '#9ca3af' }}
                axisLine={{ stroke: '#9ca3af' }}
                interval="preserveStartEnd"
                tickFormatter={(value) => {
                  if (!value || isNaN(value)) return '';
                  const date = new Date(value);
                  if (isNaN(date.getTime())) return '';
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={9}
                tick={{ fill: '#9ca3af', fontSize: 9 }}
                tickLine={{ stroke: '#9ca3af' }}
                axisLine={{ stroke: '#9ca3af' }}
                width={50}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                tickFormatter={(value) => {
                  return value.toFixed(0);
                }}
                allowDataOverflow={false}
                scale="linear"
                tickCount={5}
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
                activeDot={{ r: 4, stroke: '#ef4444', strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="accelY"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                name="Y-axis"
                activeDot={{ r: 4, stroke: '#22c55e', strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="accelZ"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Z-axis"
                activeDot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* 3D Visualization */
        <div className="w-full h-80">
          {currentData ? (
            <Acceleration3D 
              acceleration={{
                x: currentData.acceleration?.x || 0,
                y: currentData.acceleration?.y || 0,
                z: currentData.acceleration?.z || 0
              }}
              width={width}
              height={320}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start experiment to see 3D acceleration data</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>X-axis (m/s²)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Y-axis (m/s²)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Z-axis (m/s²)</span>
          </div>
        </div>
        <div>
          Data points: {data.length}
        </div>
      </div>
    </div>
  );
};

export default AccelerationCombined;
