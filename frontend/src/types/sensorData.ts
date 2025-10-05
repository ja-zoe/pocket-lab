// Shared SensorData interface for consistent data structure across components
export interface SensorData {
  timestamp: number;
  temperature: number;
  acceleration: {
    x: number;  // m/s²
    y: number;  // m/s²
    z: number;  // m/s²
  };
  gyroscope: {
    pitch: number;  // rad/s (X-axis rotation)
    roll: number;   // rad/s (Y-axis rotation)
    yaw: number;    // rad/s (Z-axis rotation)
  };
  bme688: {
    temperature: number;  // °C
    humidity: number;     // %
    pressure: number;     // Pa
    voc: number;          // ppm
  };
  ultrasonic: {
    distance: number;     // m
  };
}

// Legacy interface for backward compatibility (will be removed)
export interface LegacySensorData {
  timestamp: number;
  temperature: number;
  pressure: number;
  humidity: number;
  gasResistance: number;
  vocIndex: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  distance: number;
}

// Utility function to convert legacy data to new format
export function convertLegacyToSensorData(legacy: LegacySensorData): SensorData {
  return {
    timestamp: legacy.timestamp,
    temperature: legacy.temperature,
    acceleration: {
      x: legacy.accelX,
      y: legacy.accelY,
      z: legacy.accelZ,
    },
    gyroscope: {
      pitch: legacy.gyroX,
      roll: legacy.gyroY,
      yaw: legacy.gyroZ,
    },
    bme688: {
      temperature: legacy.temperature,
      humidity: legacy.humidity,
      pressure: legacy.pressure,
      voc: legacy.vocIndex,
    },
    ultrasonic: {
      distance: legacy.distance,
    },
  };
}
