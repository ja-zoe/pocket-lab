import { useState, useEffect, useMemo } from 'react';
import { filterSensorData, getSpikeStats } from '../lib/simpleSpikeFilter';

interface UseSimpleSpikeFilterOptions {
  windowSize?: number;
  threshold?: number;
  enabled?: boolean;
}

interface UseSimpleSpikeFilterReturn {
  rawData: any[];
  filteredData: any[];
  displayData: any[];
  showClean: boolean;
  setShowClean: (show: boolean) => void;
  spikeStats: any;
  filterOptions: {
    windowSize: number;
    threshold: number;
    enabled: boolean;
  };
  updateFilterOptions: (options: Partial<UseSimpleSpikeFilterOptions>) => void;
}

/**
 * Simple hook for managing spike filtering
 * @param rawData - Raw sensor data
 * @param options - Filter configuration options
 * @returns Filter state and controls
 */
export function useSimpleSpikeFilter(
  rawData: any[],
  options: UseSimpleSpikeFilterOptions = {}
): UseSimpleSpikeFilterReturn {
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
  const updateFilterOptions = (newOptions: Partial<UseSimpleSpikeFilterOptions>) => {
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
