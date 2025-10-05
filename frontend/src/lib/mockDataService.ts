// Mock data service for demonstration purposes
import type { SensorData } from '../types/sensorData';

export class MockDataService {
  private isEnabled = false;
  private intervalId: NodeJS.Timeout | null = null;
  private dataCallback: ((data: SensorData) => void) | null = null;
  private timeOffset = 0;
  private dataHistory: SensorData[] = [];
  private maxHistoryLength = 50;
  private experimentPhase = 0; // 0: baseline, 1: heating, 2: cooling, 3: movement, 4: stable
  private phaseStartTime = 0;

  // Enable mock data generation
  enable(callback: (data: SensorData) => void) {
    this.isEnabled = true;
    this.dataCallback = callback;
    this.timeOffset = 0;
    this.dataHistory = [];
    this.experimentPhase = 0;
    this.phaseStartTime = 0;
    
    // Start generating mock data every 200ms (5Hz) for more realistic patterns
    this.intervalId = setInterval(() => {
      if (this.isEnabled && this.dataCallback) {
        const mockData = this.generateMockData();
        this.dataHistory.push(mockData);
        if (this.dataHistory.length > this.maxHistoryLength) {
          this.dataHistory.shift();
        }
        this.dataCallback(mockData);
        this.timeOffset += 200; // Increment time by 200ms
      }
    }, 200);
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

  // Generate realistic mock sensor data with multiple phases
  private generateMockData(): SensorData {
    const now = Date.now() + this.timeOffset;
    const phaseTime = this.timeOffset - this.phaseStartTime;
    
    // Update experiment phase based on time
    this.updateExperimentPhase();
    
    // Generate data based on current phase
    const data = this.generatePhaseData(phaseTime);
    
    // Add realistic noise and drift
    return this.addRealisticNoise(data, now);
  }

  // Update experiment phase based on time
  private updateExperimentPhase() {
    const phaseDuration = 30000; // 30 seconds per phase
    const newPhase = Math.floor(this.timeOffset / phaseDuration) % 5;
    
    if (newPhase !== this.experimentPhase) {
      this.experimentPhase = newPhase;
      this.phaseStartTime = this.timeOffset;
    }
  }

  // Generate data based on current experiment phase
  private generatePhaseData(phaseTime: number): SensorData {
    const baseTime = phaseTime / 1000; // Convert to seconds
    
    switch (this.experimentPhase) {
      case 0: // Baseline - stable readings
        return this.generateBaselineData(baseTime);
      case 1: // Heating phase - temperature rising
        return this.generateHeatingData(baseTime);
      case 2: // Cooling phase - temperature falling
        return this.generateCoolingData(baseTime);
      case 3: // Movement phase - high acceleration/gyro activity
        return this.generateMovementData(baseTime);
      case 4: // Stable phase - return to baseline
        return this.generateStableData(baseTime);
      default:
        return this.generateBaselineData(baseTime);
    }
  }

  // Baseline phase - stable sensor readings
  private generateBaselineData(time: number): SensorData {
    return {
      timestamp: Date.now() + this.timeOffset,
      temperature: 22.5 + Math.sin(time * 0.1) * 0.5,
      acceleration: {
        x: Math.sin(time * 0.2) * 0.1,
        y: Math.cos(time * 0.15) * 0.08,
        z: 9.81 + Math.sin(time * 0.05) * 0.05
      },
      gyroscope: {
        pitch: Math.sin(time * 0.3) * 0.02,
        roll: Math.cos(time * 0.25) * 0.015,
        yaw: Math.sin(time * 0.2) * 0.01
      },
      bme688: {
        temperature: 22.5 + Math.sin(time * 0.1) * 0.5,
        humidity: 45 + Math.sin(time * 0.08) * 2,
        pressure: 101325 + Math.sin(time * 0.05) * 20,
        voc: 30 + Math.sin(time * 0.12) * 5
      },
      ultrasonic: {
        distance: 0.5 + Math.sin(time * 0.1) * 0.05
      }
    };
  }

  // Heating phase - temperature gradually rising
  private generateHeatingData(time: number): SensorData {
    const heatingRate = time * 0.8; // 0.8°C per second
    const baseTemp = 22.5 + heatingRate;
    
    return {
      timestamp: Date.now() + this.timeOffset,
      temperature: baseTemp + Math.sin(time * 0.3) * 0.8,
      acceleration: {
        x: Math.sin(time * 0.4) * 0.3 + Math.sin(time * 2) * 0.1,
        y: Math.cos(time * 0.35) * 0.25 + Math.cos(time * 1.8) * 0.08,
        z: 9.81 + Math.sin(time * 0.1) * 0.1
      },
      gyroscope: {
        pitch: Math.sin(time * 0.5) * 0.05 + Math.sin(time * 3) * 0.02,
        roll: Math.cos(time * 0.45) * 0.04 + Math.cos(time * 2.5) * 0.015,
        yaw: Math.sin(time * 0.4) * 0.03 + Math.sin(time * 2.2) * 0.01
      },
      bme688: {
        temperature: baseTemp + Math.sin(time * 0.3) * 0.8,
        humidity: 45 - heatingRate * 0.5 + Math.sin(time * 0.15) * 3,
        pressure: 101325 + Math.sin(time * 0.08) * 30,
        voc: 30 + heatingRate * 0.3 + Math.sin(time * 0.2) * 8
      },
      ultrasonic: {
        distance: 0.5 + Math.sin(time * 0.2) * 0.1
      }
    };
  }

  // Cooling phase - temperature gradually falling
  private generateCoolingData(time: number): SensorData {
    const coolingRate = time * 0.6; // 0.6°C per second
    const baseTemp = 45 - coolingRate; // Start from heated temperature
    
    return {
      timestamp: Date.now() + this.timeOffset,
      temperature: baseTemp + Math.sin(time * 0.4) * 1.2,
      acceleration: {
        x: Math.sin(time * 0.3) * 0.2 + Math.sin(time * 1.5) * 0.15,
        y: Math.cos(time * 0.25) * 0.18 + Math.cos(time * 1.2) * 0.12,
        z: 9.81 + Math.sin(time * 0.08) * 0.08
      },
      gyroscope: {
        pitch: Math.sin(time * 0.4) * 0.04 + Math.sin(time * 2.8) * 0.02,
        roll: Math.cos(time * 0.35) * 0.035 + Math.cos(time * 2.2) * 0.015,
        yaw: Math.sin(time * 0.3) * 0.025 + Math.sin(time * 1.8) * 0.01
      },
      bme688: {
        temperature: baseTemp + Math.sin(time * 0.4) * 1.2,
        humidity: 35 + coolingRate * 0.3 + Math.sin(time * 0.18) * 4,
        pressure: 101325 + Math.sin(time * 0.1) * 25,
        voc: 60 - coolingRate * 0.2 + Math.sin(time * 0.25) * 6
      },
      ultrasonic: {
        distance: 0.5 + Math.sin(time * 0.15) * 0.08
      }
    };
  }

  // Movement phase - high activity with shaking/motion
  private generateMovementData(time: number): SensorData {
    const shakeIntensity = Math.sin(time * 8) * 0.5 + 0.5; // 0 to 1
    
    return {
      timestamp: Date.now() + this.timeOffset,
      temperature: 25 + Math.sin(time * 0.2) * 2 + shakeIntensity * 1.5,
      acceleration: {
        x: Math.sin(time * 6) * 2 * shakeIntensity + Math.sin(time * 0.3) * 0.5,
        y: Math.cos(time * 7) * 1.8 * shakeIntensity + Math.cos(time * 0.25) * 0.4,
        z: 9.81 + Math.sin(time * 5) * 1.5 * shakeIntensity + Math.sin(time * 0.1) * 0.3
      },
      gyroscope: {
        pitch: Math.sin(time * 8) * 0.3 * shakeIntensity + Math.sin(time * 0.4) * 0.05,
        roll: Math.cos(time * 9) * 0.25 * shakeIntensity + Math.cos(time * 0.35) * 0.04,
        yaw: Math.sin(time * 7) * 0.2 * shakeIntensity + Math.sin(time * 0.3) * 0.03
      },
      bme688: {
        temperature: 25 + Math.sin(time * 0.2) * 2 + shakeIntensity * 1.5,
        humidity: 45 + Math.sin(time * 0.15) * 5 + shakeIntensity * 3,
        pressure: 101325 + Math.sin(time * 0.12) * 40 + shakeIntensity * 20,
        voc: 40 + Math.sin(time * 0.3) * 10 + shakeIntensity * 8
      },
      ultrasonic: {
        distance: 0.5 + Math.sin(time * 4) * 0.2 * shakeIntensity + Math.sin(time * 0.2) * 0.1
      }
    };
  }

  // Stable phase - return to baseline with some oscillation
  private generateStableData(time: number): SensorData {
    const stabilizationFactor = Math.exp(-time * 0.1); // Exponential decay
    
    return {
      timestamp: Date.now() + this.timeOffset,
      temperature: 22.5 + Math.sin(time * 0.2) * 0.8 * stabilizationFactor,
      acceleration: {
        x: Math.sin(time * 0.3) * 0.2 * stabilizationFactor,
        y: Math.cos(time * 0.25) * 0.15 * stabilizationFactor,
        z: 9.81 + Math.sin(time * 0.08) * 0.1 * stabilizationFactor
      },
      gyroscope: {
        pitch: Math.sin(time * 0.4) * 0.03 * stabilizationFactor,
        roll: Math.cos(time * 0.35) * 0.025 * stabilizationFactor,
        yaw: Math.sin(time * 0.3) * 0.02 * stabilizationFactor
      },
      bme688: {
        temperature: 22.5 + Math.sin(time * 0.2) * 0.8 * stabilizationFactor,
        humidity: 45 + Math.sin(time * 0.15) * 3 * stabilizationFactor,
        pressure: 101325 + Math.sin(time * 0.1) * 25 * stabilizationFactor,
        voc: 30 + Math.sin(time * 0.2) * 6 * stabilizationFactor
      },
      ultrasonic: {
        distance: 0.5 + Math.sin(time * 0.15) * 0.08 * stabilizationFactor
      }
    };
  }

  // Add realistic noise and sensor drift
  private addRealisticNoise(data: SensorData, timestamp: number): SensorData {
    const noise = () => (Math.random() - 0.5) * 0.1;
    const drift = () => Math.sin(timestamp / 10000) * 0.05;
    
    return {
      ...data,
      temperature: data.temperature + noise() + drift(),
      acceleration: {
        x: data.acceleration.x + noise() + drift(),
        y: data.acceleration.y + noise() + drift(),
        z: data.acceleration.z + noise() + drift()
      },
      gyroscope: {
        pitch: data.gyroscope.pitch + noise() + drift(),
        roll: data.gyroscope.roll + noise() + drift(),
        yaw: data.gyroscope.yaw + noise() + drift()
      },
      bme688: {
        temperature: data.bme688.temperature + noise() + drift(),
        humidity: Math.max(0, Math.min(100, data.bme688.humidity + noise() * 2 + drift() * 2)),
        pressure: Math.max(80000, data.bme688.pressure + noise() * 10 + drift() * 5),
        voc: Math.max(0, data.bme688.voc + noise() * 3 + drift() * 2)
      },
      ultrasonic: {
        distance: Math.max(0.1, data.ultrasonic.distance + noise() + drift())
      }
    };
  }

  // Generate multiple data points for initial population
  generateInitialDataPoints(count: number = 50): SensorData[] {
    const dataPoints: SensorData[] = [];
    const startTime = Date.now() - (count * 200); // Go back in time
    
    for (let i = 0; i < count; i++) {
      this.timeOffset = i * 200; // 200ms intervals
      const data = this.generateMockData();
      data.timestamp = startTime + (i * 200);
      dataPoints.push(data);
    }
    
    return dataPoints;
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

  // Get current experiment phase for display
  getCurrentPhase(): string {
    const phases = [
      "Baseline - Stable readings",
      "Heating - Temperature rising",
      "Cooling - Temperature falling", 
      "Movement - High activity",
      "Stable - Return to baseline"
    ];
    return phases[this.experimentPhase] || "Unknown";
  }
}

// Export singleton instance
export const mockDataService = new MockDataService();
