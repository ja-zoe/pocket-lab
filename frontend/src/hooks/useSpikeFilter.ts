import { useState, useMemo } from 'react';
import { filterSensorData, getSpikeStats } from '../lib/spikeFilter';

// Define FilteredDataPoint locally to avoid import issues
interface FilteredDataPoint {
  timestamp: number;
  time: number;
  timeString: string;
  temperature: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  bmeTemp: number;
  humidity: number;
  pressure: number;
  voc: number;
  distance: number;
  spikesDetected: {
    temperature: boolean;
    accelX: boolean;
    accelY: boolean;
    accelZ: boolean;
    bmeTemp: boolean;
    humidity: boolean;
    pressure: boolean;
    voc: boolean;
    distance: boolean;
  };
}

interface UseSpikeFilterOptions {
  windowSize?: number;
  threshold?: number;
  enabled?: boolean;
}

interface UseSpikeFilterReturn {
  rawData: any[];
  filteredData: FilteredDataPoint[];
  displayData: any[];
  showClean: boolean;
  setShowClean: (show: boolean) => void;
  spikeStats: ReturnType<typeof getSpikeStats>;
  filterOptions: {
    windowSize: number;
    threshold: number;
    enabled: boolean;
  };
  updateFilterOptions: (options: Partial<UseSpikeFilterOptions>) => void;
}

/**
 * Custom hook for managing spike filtering
 * @param rawData - Raw sensor data
 * @param options - Filter configuration options
 * @returns Filter state and controls
 */
export function useSpikeFilter(
  rawData: any[],
  options: UseSpikeFilterOptions = {}
): UseSpikeFilterReturn {
  const {
    windowSize = 10,
    threshold = 2,
    enabled = true
  } = options;

  const [showClean, setShowClean] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    windowSize,
    threshold,
    enabled
  });

  // Apply filtering when raw data or options change
  const filteredData = useMemo(() => {
    if (!enabled || rawData.length === 0) {
      return rawData.map(point => ({
        ...point,
        spikesDetected: {
          temperature: false,
          accelX: false,
          accelY: false,
          accelZ: false,
          bmeTemp: false,
          humidity: false,
          pressure: false,
          voc: false,
          distance: false,
        }
      }));
    }

    return filterSensorData(rawData, filterOptions.windowSize, filterOptions.threshold);
  }, [rawData, filterOptions, enabled]);

  // Choose which data to display
  const displayData = useMemo(() => {
    return showClean ? filteredData : rawData;
  }, [showClean, filteredData, rawData]);

  // Calculate spike statistics
  const spikeStats = useMemo(() => {
    return getSpikeStats(filteredData);
  }, [filteredData]);

  // Update filter options
  const updateFilterOptions = (newOptions: Partial<UseSpikeFilterOptions>) => {
    setFilterOptions(prev => ({
      ...prev,
      ...newOptions
    }));
  };

  return {
    rawData,
    filteredData,
    displayData,
    showClean,
    setShowClean,
    spikeStats,
    filterOptions,
    updateFilterOptions
  };
}
