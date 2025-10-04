import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Gyroscope3DProps {
  pitch: number;
  roll: number;
  yaw: number;
  width?: number;
  height?: number;
}

// 3D Cube component that rotates based on sensor data
const RotatingCube: React.FC<{ pitch: number; roll: number; yaw: number }> = ({ 
  pitch, 
  roll, 
  yaw 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Convert degrees to radians and apply rotations
      // Note: Three.js uses different rotation order, so we adjust accordingly
      meshRef.current.rotation.x = THREE.MathUtils.degToRad(pitch);
      meshRef.current.rotation.y = THREE.MathUtils.degToRad(yaw);
      meshRef.current.rotation.z = THREE.MathUtils.degToRad(roll);
    }
  });

  return (
    <group>
      {/* Main rotating cube */}
      <mesh ref={meshRef}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color="#14b8a6" 
          metalness={0.3} 
          roughness={0.4}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Wireframe outline */}
      <mesh ref={meshRef}>
        <boxGeometry args={[2.05, 2.05, 2.05]} />
        <meshBasicMaterial 
          color="#14b8a6" 
          wireframe 
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Axis indicators */}
      <group ref={meshRef}>
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
      {/* Pitch label */}
      <Text
        position={[3, 0, 0]}
        fontSize={0.3}
        color="#ef4444"
        anchorX="center"
        anchorY="middle"
      >
        Pitch: {pitch.toFixed(1)}°
      </Text>
      
      {/* Roll label */}
      <Text
        position={[0, 3, 0]}
        fontSize={0.3}
        color="#22c55e"
        anchorX="center"
        anchorY="middle"
      >
        Roll: {roll.toFixed(1)}°
      </Text>
      
      {/* Yaw label */}
      <Text
        position={[0, 0, 3]}
        fontSize={0.3}
        color="#3b82f6"
        anchorX="center"
        anchorY="middle"
      >
        Yaw: {yaw.toFixed(1)}°
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
  return (
    <div style={{ width, height }} className="border border-lab-teal/30 rounded-xl overflow-hidden hover:border-lab-teal/50 transition-all duration-300 shadow-lg hover:shadow-glow-teal">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} />
        
        {/* 3D Scene */}
        <RotatingCube pitch={pitch} roll={roll} yaw={yaw} />
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
  );
};

export default Gyroscope3D;

