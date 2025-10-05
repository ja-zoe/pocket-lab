// Mock data service for demonstration purposes
import type { SensorData } from '../types/sensorData';

export class MockDataService {
  private isEnabled = false;
  private intervalId: NodeJS.Timeout | null = null;
  private dataCallback: ((data: SensorData) => void) | null = null;
  private timeOffset = 0;

  // Enable mock data generation
  enable(callback: (data: SensorData) => void) {
    this.isEnabled = true;
    this.dataCallback = callback;
    this.timeOffset = 0;
    
    // Start generating mock data every 100ms (10Hz)
    this.intervalId = setInterval(() => {
      if (this.isEnabled && this.dataCallback) {
        const mockData = this.generateMockData();
        this.dataCallback(mockData);
        this.timeOffset += 100; // Increment time by 100ms
      }
    }, 100);
  }

  // Disable mock data generation
  disable() {
    this.isEnabled = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Check if mock data is enabled
  isMockDataEnabled(): boolean {
    return this.isEnabled;
  }

  // Generate realistic mock sensor data
  private generateMockData(): SensorData {
    const now = Date.now() + this.timeOffset;
    
    // Simulate realistic sensor readings with some variation
    const baseTemp = 25 + Math.sin(this.timeOffset / 10000) * 3; // Temperature varies slowly
    const tempVariation = (Math.random() - 0.5) * 0.5; // Small random variation
    
    // Simulate acceleration with some movement patterns
    const accelBase = {
      x: Math.sin(this.timeOffset / 2000) * 0.5 + (Math.random() - 0.5) * 0.2,
      y: Math.cos(this.timeOffset / 3000) * 0.3 + (Math.random() - 0.5) * 0.15,
      z: 9.81 + Math.sin(this.timeOffset / 5000) * 0.1 + (Math.random() - 0.5) * 0.1 // Gravity + variation
    };

    // Simulate gyroscope with rotation patterns
    const gyroBase = {
      pitch: Math.sin(this.timeOffset / 4000) * 0.1 + (Math.random() - 0.5) * 0.05,
      roll: Math.cos(this.timeOffset / 3500) * 0.08 + (Math.random() - 0.5) * 0.03,
      yaw: Math.sin(this.timeOffset / 6000) * 0.12 + (Math.random() - 0.5) * 0.04
    };

    // Simulate BME688 sensor data
    const pressure = 101325 + Math.sin(this.timeOffset / 8000) * 100 + (Math.random() - 0.5) * 50;
    const humidity = 45 + Math.sin(this.timeOffset / 12000) * 10 + (Math.random() - 0.5) * 5;
    const voc = 50 + Math.sin(this.timeOffset / 15000) * 20 + (Math.random() - 0.5) * 10;

    // Simulate ultrasonic distance
    const distance = 0.5 + Math.sin(this.timeOffset / 7000) * 0.2 + (Math.random() - 0.5) * 0.1;

    return {
      timestamp: now,
      temperature: baseTemp + tempVariation,
      acceleration: {
        x: accelBase.x,
        y: accelBase.y,
        z: accelBase.z
      },
      gyroscope: {
        pitch: gyroBase.pitch,
        roll: gyroBase.roll,
        yaw: gyroBase.yaw
      },
      bme688: {
        temperature: baseTemp + tempVariation,
        humidity: Math.max(0, Math.min(100, humidity)),
        pressure: Math.max(80000, pressure),
        voc: Math.max(0, voc)
      },
      ultrasonic: {
        distance: Math.max(0.1, distance)
      }
    };
  }

  // Generate a spike in the data for demonstration
  generateSpike(): SensorData {
    const baseData = this.generateMockData();
    
    // Add a significant spike to temperature
    baseData.temperature += 10 + Math.random() * 5;
    baseData.bme688.temperature = baseData.temperature;
    
    // Add acceleration spike
    baseData.acceleration.x += (Math.random() - 0.5) * 5;
    baseData.acceleration.y += (Math.random() - 0.5) * 5;
    baseData.acceleration.z += (Math.random() - 0.5) * 3;
    
    return baseData;
  }
}

// Export singleton instance
export const mockDataService = new MockDataService();
