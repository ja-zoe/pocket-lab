import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Droplets, Gauge, Wind } from 'lucide-react';

interface BME688Data {
  timestamp: number;
  temperature: number;
  humidity: number;
  pressure: number;
  voc: number;
}

interface BME688ChartProps {
  data: BME688Data[];
  width?: number;
  height?: number;
}

type MetricType = 'temperature' | 'humidity' | 'pressure';

const BME688Chart: React.FC<BME688ChartProps> = ({ 
  data, 
  width = 500, 
  height = 250 
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('temperature');

  const metricConfig = {
    temperature: {
      key: 'temperature',
      label: 'Temperature',
      unit: '°C',
      color: '#ef4444',
      icon: <Gauge className="w-4 h-4" />,
      description: 'Ambient temperature from BME688 sensor'
    },
    humidity: {
      key: 'humidity',
      label: 'Humidity',
      unit: '%',
      color: '#3b82f6',
      icon: <Droplets className="w-4 h-4" />,
      description: 'Relative humidity from BME688 sensor'
    },
    pressure: {
      key: 'pressure',
      label: 'Pressure',
      unit: 'hPa',
      color: '#8b5cf6',
      icon: <Wind className="w-4 h-4" />,
      description: 'Atmospheric pressure from BME688 sensor'
    }
  };

  const chartData = useMemo(() => {
    return data.map(item => {
      // Clamp values to prevent extreme outliers
      const clampValue = (value: number, min: number, max: number) => 
        Math.max(min, Math.min(max, value));
      
      const clampedTemperature = clampValue(item.temperature, -50, 100);
      const clampedHumidity = clampValue(item.humidity, 0, 100);
      const clampedPressure = clampValue(item.pressure, 800, 1200);
      const clampedVoc = clampValue(item.voc, 0, 1000);
      
      return {
        timestamp: item.timestamp, // Keep original timestamp
        timeString: new Date(item.timestamp).toLocaleTimeString(), // For display
        [selectedMetric]: item[selectedMetric],
        // Add other metrics for tooltip display with clamped values
        temperature: clampedTemperature,
        humidity: clampedHumidity,
        pressure: clampedPressure,
        voc: clampedVoc
      };
    });
  }, [data, selectedMetric]);

  const currentConfig = metricConfig[selectedMetric];
  const currentData = data[data.length - 1] || { temperature: 0, humidity: 0, pressure: 0, voc: 0 };

  return (
    <div className="card-glow p-6 w-full max-w-full">
      {/* Header with dropdown */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            {currentConfig.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Environmental Data</h3>
            <p className="text-sm text-gray-400">{currentConfig.description}</p>
          </div>
        </div>
        
        {/* Metric Selection Dropdown */}
        <div className="relative">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
            className="appearance-none bg-gradient-to-r from-gray-800 to-gray-700 border border-teal-500/30 rounded-xl px-4 py-3 pr-10 text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all duration-200 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/20 cursor-pointer"
          >
            <option value="temperature" className="bg-gray-700 text-white">Temperature (°C)</option>
            <option value="humidity" className="bg-gray-700 text-white">Humidity (%)</option>
            <option value="pressure" className="bg-gray-700 text-white">Pressure (hPa)</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <div className="p-1 bg-teal-500/20 rounded-full">
              <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="p-2 bg-blue-500/20 rounded-lg">
              {currentConfig.icon}
            </div>
            <div>
              <p className="text-sm text-gray-400">Current {currentConfig.label}</p>
              <p className="text-2xl font-bold text-white">
                {currentData[selectedMetric]?.toFixed(1) || '0.0'}
                <span className="text-lg text-gray-400 ml-1">{currentConfig.unit}</span>
              </p>
            </div>
          </div>
          
          {/* Additional metrics in compact view */}
          <div className="text-right space-y-1">
            {Object.entries(metricConfig).map(([key, config]) => {
              if (key === selectedMetric) return null;
              return (
                <div key={key} className="text-sm">
                  <span className="text-gray-400">{config.label}: </span>
                  <span className="text-white font-medium">
                    {currentData[key as keyof BME688Data]?.toFixed(1) || '0.0'}{config.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart */}
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
              width={40}
              domain={['dataMin - 0.1', 'dataMax + 0.1']}
              tickFormatter={(value) => {
                const formatted = value.toPrecision(3);
                return `${formatted}${currentConfig.unit}`;
              }}
              allowDataOverflow={false}
              scale="linear"
              tickCount={5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#ffffff'
              }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(value: any, name: string) => [
                `${value?.toFixed(2)}${currentConfig.unit}`,
                currentConfig.label
              ]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={currentConfig.color}
              strokeWidth={2}
              dot={{ fill: currentConfig.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: currentConfig.color, strokeWidth: 2 }}
              name={currentConfig.label}
              connectNulls={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentConfig.color }}></div>
            <span>{currentConfig.label} ({currentConfig.unit})</span>
          </div>
        </div>
        <div>
          Data points: {data.length}
        </div>
      </div>
    </div>
  );
};

export default BME688Chart;
