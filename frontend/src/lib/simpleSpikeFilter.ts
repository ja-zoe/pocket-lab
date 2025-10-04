/**
 * Simple Spike Removal Filter
 * 
 * This utility detects and removes spikes in sensor data using a rolling mean approach.
 */

/**
 * Rolling mean filter for spike removal
 * @param data - Array of data points
 * @param windowSize - Size of the sliding window (default: 10)
 * @param threshold - Number of standard deviations for spike detection (default: 2)
 * @returns Filtered data with spikes replaced by interpolated values
 */
export function rollingFilter(
  data: number[], 
  windowSize: number = 10, 
  threshold: number = 2
): { filtered: number[], spikes: boolean[] } {
  if (data.length < windowSize) {
    return { filtered: [...data], spikes: new Array(data.length).fill(false) };
  }

  const filtered = [...data];
  const spikes = new Array(data.length).fill(false);
  
  for (let i = windowSize; i < data.length; i++) {
    const window = data.slice(i - windowSize, i);
    const mean = window.reduce((a, b) => a + b, 0) / windowSize;
    const variance = window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowSize;
    const std = Math.sqrt(variance);

    // Check if current value is a spike
    if (Math.abs(data[i] - mean) > threshold * std) {
      spikes[i] = true;
      // Replace spike with interpolated value (average of neighbors)
      const prevValue = filtered[i - 1];
      const nextValue = i < data.length - 1 ? data[i + 1] : prevValue;
      filtered[i] = (prevValue + nextValue) / 2;
    }
  }

  return { filtered, spikes };
}

/**
 * Apply spike filtering to sensor data
 * @param rawData - Raw sensor data array
 * @param windowSize - Window size for rolling filter
 * @param threshold - Spike detection threshold
 * @returns Filtered data with spike detection flags
 */
export function filterSensorData(
  rawData: any[],
  windowSize: number = 10,
  threshold: number = 2
): any[] {
  if (rawData.length === 0) return [];

  // Extract individual sensor readings
  const temperatureData = rawData.map(d => d.temperature);
  const accelXData = rawData.map(d => d.accelX);
  const accelYData = rawData.map(d => d.accelY);
  const accelZData = rawData.map(d => d.accelZ);
  const bmeTempData = rawData.map(d => d.bmeTemp);
  const humidityData = rawData.map(d => d.humidity);
  const pressureData = rawData.map(d => d.pressure);
  const vocData = rawData.map(d => d.voc);
  const distanceData = rawData.map(d => d.distance);

  // Apply rolling filter to each sensor
  const tempFiltered = rollingFilter(temperatureData, windowSize, threshold);
  const accelXFiltered = rollingFilter(accelXData, windowSize, threshold);
  const accelYFiltered = rollingFilter(accelYData, windowSize, threshold);
  const accelZFiltered = rollingFilter(accelZData, windowSize, threshold);
  const bmeTempFiltered = rollingFilter(bmeTempData, windowSize, threshold);
  const humidityFiltered = rollingFilter(humidityData, windowSize, threshold);
  const pressureFiltered = rollingFilter(pressureData, windowSize, threshold);
  const vocFiltered = rollingFilter(vocData, windowSize, threshold);
  const distanceFiltered = rollingFilter(distanceData, windowSize, threshold);

  // Reconstruct data with filtered values and spike flags
  return rawData.map((dataPoint, index) => ({
    ...dataPoint,
    temperature: tempFiltered.filtered[index],
    accelX: accelXFiltered.filtered[index],
    accelY: accelYFiltered.filtered[index],
    accelZ: accelZFiltered.filtered[index],
    bmeTemp: bmeTempFiltered.filtered[index],
    humidity: humidityFiltered.filtered[index],
    pressure: pressureFiltered.filtered[index],
    voc: vocFiltered.filtered[index],
    distance: distanceFiltered.filtered[index],
    spikesDetected: {
      temperature: tempFiltered.spikes[index],
      accelX: accelXFiltered.spikes[index],
      accelY: accelYFiltered.spikes[index],
      accelZ: accelZFiltered.spikes[index],
      bmeTemp: bmeTempFiltered.spikes[index],
      humidity: humidityFiltered.spikes[index],
      pressure: pressureFiltered.spikes[index],
      voc: vocFiltered.spikes[index],
      distance: distanceFiltered.spikes[index],
    }
  }));
}

/**
 * Get spike statistics for a dataset
 * @param filteredData - Data with spike detection flags
 * @returns Statistics about detected spikes
 */
export function getSpikeStats(filteredData: any[]) {
  const stats = {
    totalDataPoints: filteredData.length,
    totalSpikes: 0,
    spikesBySensor: {
      temperature: 0,
      accelX: 0,
      accelY: 0,
      accelZ: 0,
      bmeTemp: 0,
      humidity: 0,
      pressure: 0,
      voc: 0,
      distance: 0,
    },
    spikePercentage: 0
  };

  filteredData.forEach(point => {
    if (point.spikesDetected) {
      Object.entries(point.spikesDetected).forEach(([sensor, isSpike]) => {
        if (isSpike) {
          stats.totalSpikes++;
          stats.spikesBySensor[sensor as keyof typeof stats.spikesBySensor]++;
        }
      });
    }
  });

  stats.spikePercentage = stats.totalDataPoints > 0 
    ? (stats.totalSpikes / (stats.totalDataPoints * 9)) * 100 
    : 0;

  return stats;
}
