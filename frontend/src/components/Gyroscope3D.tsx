import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { RotateCcw } from 'lucide-react';
import * as THREE from 'three';

interface Gyroscope3DProps {
  pitch: number; // X-axis rotation (pitch_rad)
  roll: number;  // Z-axis rotation (roll_rad) 
  yaw: number;   // Y-axis rotation (yaw_rad)
  width?: number;
  height?: number;
}

// 3D Cube component that rotates based on sensor data
const RotatingCube: React.FC<{ pitch: number; roll: number; yaw: number; resetKey: number }> = ({ 
  pitch, 
  roll, 
  yaw,
  resetKey
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const cumulativeRotation = useRef({ x: 0, y: 0, z: 0 });
  const lastSensorValues = useRef({ pitch: 0, roll: 0, yaw: 0 });
  const isFirstFrame = useRef(true);

  // Reset cumulative rotation when resetKey changes
  React.useEffect(() => {
    cumulativeRotation.current = { x: 0, y: 0, z: 0 };
    lastSensorValues.current = { pitch: pitch || 0, roll: roll || 0, yaw: yaw || 0 };
    isFirstFrame.current = true;
  }, [resetKey, pitch, roll, yaw]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      // MPU6050 rotation mapping with YXZ rotation order
      // roll_rad → Z-axis rotation
      // pitch_rad → X-axis rotation  
      // yaw_rad → Y-axis rotation
      
      // Values are already in radians, with fallback to 0
      const pitchRad = pitch || 0;
      const rollRad = roll || 0;
      const yawRad = yaw || 0;
      
      if (isFirstFrame.current) {
        // Initialize with current sensor values
        lastSensorValues.current = { pitch: pitchRad, roll: rollRad, yaw: yawRad };
        isFirstFrame.current = false;
      } else {
        // Calculate the difference from last frame (angular velocity)
        const deltaPitch = pitchRad - lastSensorValues.current.pitch;
        const deltaRoll = rollRad - lastSensorValues.current.roll;
        const deltaYaw = yawRad - lastSensorValues.current.yaw;
        
        // Only accumulate if there's a meaningful change (avoid noise)
        if (Math.abs(deltaPitch) > 0.001 || Math.abs(deltaRoll) > 0.001 || Math.abs(deltaYaw) > 0.001) {
          // Accumulate the rotation changes
          cumulativeRotation.current.x += deltaPitch;
          cumulativeRotation.current.y += deltaYaw;
          cumulativeRotation.current.z += deltaRoll;
          
          // Debug logging (remove after testing)
          console.log('Gyro rotation:', {
            deltas: { pitch: deltaPitch, roll: deltaRoll, yaw: deltaYaw },
            cumulative: cumulativeRotation.current
          });
        }
        
        // Update last sensor values
        lastSensorValues.current = { pitch: pitchRad, roll: rollRad, yaw: yawRad };
      }
      
      // Apply cumulative rotation with smooth interpolation
      const lerpFactor = Math.min(delta * 8, 1); // Faster interpolation for more responsive feel
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, cumulativeRotation.current.x, lerpFactor);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, cumulativeRotation.current.y, lerpFactor);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, cumulativeRotation.current.z, lerpFactor);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main rotating cube */}
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color="#14b8a6" 
          metalness={0.3} 
          roughness={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Wireframe outline */}
      <mesh>
        <boxGeometry args={[2.05, 2.05, 2.05]} />
        <meshBasicMaterial 
          color="#14b8a6" 
          wireframe 
          transparent
          opacity={0.5}
        />
      </mesh>
      
      {/* Corner markers for better rotation visibility */}
      {/* Red corner markers */}
      <mesh position={[1.1, 1.1, 1.1]}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[-1.1, 1.1, 1.1]}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[1.1, -1.1, 1.1]}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[1.1, 1.1, -1.1]}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      
      {/* Axis indicators - MPU6050 mapping */}
      {/* X-axis (Pitch) - Red */}
      <mesh position={[1.5, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[1.7, 0, 0]}>
        <coneGeometry args={[0.1, 0.2]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      
      {/* Y-axis (Yaw) - Green */}
      <mesh position={[0, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh position={[0, 1.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.2]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      
      {/* Z-axis (Roll) - Blue */}
      <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[0, 0, 1.7]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.2]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
    </group>
  );
};

// Labels for the axes
const AxisLabels: React.FC<{ pitch: number; roll: number; yaw: number }> = ({ 
  pitch, 
  roll, 
  yaw 
}) => {
  return (
    <group>
      {/* Pitch label (X-axis) */}
      <Text
        position={[3, 0, 0]}
        fontSize={0.3}
        color="#ef4444"
        anchorX="center"
        anchorY="middle"
      >
        Pitch: {pitch.toFixed(3)} rad (X)
      </Text>
      
      {/* Yaw label (Y-axis) */}
      <Text
        position={[0, 3, 0]}
        fontSize={0.3}
        color="#22c55e"
        anchorX="center"
        anchorY="middle"
      >
        Yaw: {yaw.toFixed(3)} rad (Y)
      </Text>
      
      {/* Roll label (Z-axis) */}
      <Text
        position={[0, 0, 3]}
        fontSize={0.3}
        color="#3b82f6"
        anchorX="center"
        anchorY="middle"
      >
        Roll: {roll.toFixed(3)} rad (Z)
      </Text>
    </group>
  );
};

const Gyroscope3D: React.FC<Gyroscope3DProps> = ({ 
  pitch, 
  roll, 
  yaw, 
  width = 400, 
  height = 400 
}) => {
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  return (
    <div className="relative">
      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="absolute top-2 right-2 z-10 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200 shadow-sm"
        title="Reset rotation to initial position"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      
      <div style={{ width, height }} className="border border-gray-600 rounded-lg overflow-hidden hover:border-gray-500 transition-all duration-200 shadow-sm">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        {/* Enhanced Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.0} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[5, -5, 5]} intensity={0.3} color="#14b8a6" />
        
        {/* 3D Scene */}
        <RotatingCube pitch={pitch} roll={roll} yaw={yaw} resetKey={resetKey} />
        <AxisLabels pitch={pitch} roll={roll} yaw={yaw} />
        
        {/* Grid helper for reference */}
        <gridHelper args={[10, 10, '#374151', '#374151']} />
        
        {/* Orbit controls for mouse interaction */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
          autoRotate={false}
        />
      </Canvas>
    </div>
    </div>
  );
};

export default Gyroscope3D;

