// Experiment Templates for PocketLab

export interface ExperimentStep {
  id: string;
  title: string;
  instruction: string;
  duration: number; // seconds
  condition?: {
    type: 'temperature_rise' | 'temperature_fall' | 'motion_detected' | 'distance_change' | 'pressure_change';
    threshold: number;
    description: string;
  };
  expectedOutcome: string;
}

export interface ExperimentTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Physics' | 'Chemistry' | 'Environmental' | 'Biology';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedDuration: number; // minutes
  imageUrl?: string;
  steps: ExperimentStep[];
  learningObjectives: string[];
  materials: string[];
}

export const experimentTemplates: ExperimentTemplate[] = [
  {
    id: 'temp-pressure-change',
    title: 'Temperature & Pressure Change',
    description: 'Observe how temperature affects air pressure in a controlled environment.',
    category: 'Physics',
    difficulty: 'Beginner',
    estimatedDuration: 5,
    learningObjectives: [
      'Understand the relationship between temperature and pressure',
      'Learn about gas laws and thermal expansion',
      'Practice data collection and analysis'
    ],
    materials: [
      'PocketLab device',
      'Small container or box',
      'Heat source (lamp, hand warmer)',
      'Timer'
    ],
    steps: [
      {
        id: 'baseline',
        title: 'Record Baseline',
        instruction: 'Place the device in a stable environment and record baseline readings for 30 seconds. Keep the device still and avoid any movement.',
        duration: 30,
        expectedOutcome: 'Stable temperature and pressure readings'
      },
      {
        id: 'heating',
        title: 'Apply Heat',
        instruction: 'Gently warm the area around the device using a heat source. Aim to increase temperature by 5°C. Monitor the readings carefully.',
        duration: 120,
        condition: {
          type: 'temperature_rise',
          threshold: 5,
          description: 'Temperature increases by 5°C'
        },
        expectedOutcome: 'Temperature rises and pressure increases'
      },
      {
        id: 'cooling',
        title: 'Cool Down',
        instruction: 'Remove the heat source and allow the device to cool naturally. Continue recording for 60 seconds to observe the cooling process.',
        duration: 60,
        condition: {
          type: 'temperature_fall',
          threshold: 2,
          description: 'Temperature decreases by 2°C'
        },
        expectedOutcome: 'Temperature and pressure return toward baseline'
      }
    ]
  },
  {
    id: 'shake-motion-test',
    title: 'Shake & Motion Test',
    description: 'Visualize acceleration and gyroscope data when shaking or rotating the device.',
    category: 'Physics',
    difficulty: 'Beginner',
    estimatedDuration: 3,
    learningObjectives: [
      'Understand acceleration and rotation sensors',
      'Learn about motion detection and analysis',
      'Explore 3D motion visualization'
    ],
    materials: [
      'PocketLab device',
      'Timer'
    ],
    steps: [
      {
        id: 'still',
        title: 'Hold Still',
        instruction: 'Hold the device completely still for 10 seconds. This establishes the baseline acceleration (gravity) and zero rotation.',
        duration: 10,
        expectedOutcome: 'Stable acceleration readings showing only gravity'
      },
      {
        id: 'shake',
        title: 'Shake 3 Times',
        instruction: 'Shake the device vigorously 3 times, pausing between each shake. Each shake should last about 2 seconds.',
        duration: 15,
        condition: {
          type: 'motion_detected',
          threshold: 2,
          description: 'Acceleration exceeds 2g (19.6 m/s²)'
        },
        expectedOutcome: 'High acceleration spikes during shaking'
      },
      {
        id: 'rotate',
        title: 'Rotate Slowly',
        instruction: 'Slowly rotate the device in different directions - roll, pitch, and yaw. Take about 10 seconds for each rotation.',
        duration: 30,
        condition: {
          type: 'motion_detected',
          threshold: 0.5,
          description: 'Gyroscope detects rotation above 0.5 rad/s'
        },
        expectedOutcome: 'Smooth gyroscope readings showing rotation'
      }
    ]
  },
  {
    id: 'distance-reaction',
    title: 'Distance Reaction Test',
    description: 'Measure how ultrasonic distance changes with object movement and environmental factors.',
    category: 'Physics',
    difficulty: 'Intermediate',
    estimatedDuration: 4,
    learningObjectives: [
      'Understand ultrasonic distance measurement',
      'Learn about wave reflection and timing',
      'Practice precision measurement techniques'
    ],
    materials: [
      'PocketLab device',
      'Various objects (book, hand, wall)',
      'Ruler or measuring tape',
      'Timer'
    ],
    steps: [
      {
        id: 'baseline-distance',
        title: 'Record Baseline Distance',
        instruction: 'Place the device on a flat surface and record the distance to the nearest wall or object for 20 seconds.',
        duration: 20,
        expectedOutcome: 'Stable distance readings'
      },
      {
        id: 'close-object',
        title: 'Move Object Closer',
        instruction: 'Slowly move an object (like your hand or a book) toward the device until it\'s within 20cm. Hold it steady.',
        duration: 15,
        condition: {
          type: 'distance_change',
          threshold: 0.2,
          description: 'Distance decreases to less than 20cm'
        },
        expectedOutcome: 'Distance readings decrease significantly'
      },
      {
        id: 'far-object',
        title: 'Move Object Away',
        instruction: 'Move the object away from the device to a distance greater than 30cm. Record the new stable reading.',
        duration: 15,
        condition: {
          type: 'distance_change',
          threshold: 0.3,
          description: 'Distance increases to more than 30cm'
        },
        expectedOutcome: 'Distance readings increase and stabilize'
      }
    ]
  },
  {
    id: 'environmental-monitoring',
    title: 'Environmental Monitoring',
    description: 'Monitor temperature, humidity, and pressure changes in different environments.',
    category: 'Environmental',
    difficulty: 'Intermediate',
    estimatedDuration: 10,
    learningObjectives: [
      'Understand environmental factors and their interactions',
      'Learn about microclimate monitoring',
      'Practice long-term data collection'
    ],
    materials: [
      'PocketLab device',
      'Different locations (indoor, outdoor, near window)',
      'Timer'
    ],
    steps: [
      {
        id: 'indoor-baseline',
        title: 'Indoor Baseline',
        instruction: 'Record environmental conditions indoors for 2 minutes. Note the stable temperature, humidity, and pressure.',
        duration: 120,
        expectedOutcome: 'Stable indoor environmental readings'
      },
      {
        id: 'near-window',
        title: 'Near Window',
        instruction: 'Move the device near a window (but not in direct sunlight) and record for 2 minutes. Observe any changes.',
        duration: 120,
        condition: {
          type: 'temperature_rise',
          threshold: 1,
          description: 'Temperature changes by at least 1°C'
        },
        expectedOutcome: 'Slight changes in temperature and humidity'
      },
      {
        id: 'outdoor',
        title: 'Outdoor Reading',
        instruction: 'If possible, take the device outside for 2 minutes. Record the environmental differences.',
        duration: 120,
        condition: {
          type: 'pressure_change',
          threshold: 100,
          description: 'Pressure changes by at least 100 Pa'
        },
        expectedOutcome: 'Significant environmental differences'
      }
    ]
  }
];

export const getExperimentTemplate = (id: string): ExperimentTemplate | undefined => {
  return experimentTemplates.find(template => template.id === id);
};

export const getExperimentsByCategory = (category: string): ExperimentTemplate[] => {
  return experimentTemplates.filter(template => template.category === category);
};

export const getExperimentsByDifficulty = (difficulty: string): ExperimentTemplate[] => {
  return experimentTemplates.filter(template => template.difficulty === difficulty);
};
