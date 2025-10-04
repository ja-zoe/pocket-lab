import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Acceleration3DProps {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  width?: number;
  height?: number;
}

// 3D Acceleration visualization component
const AccelerationVisualization: React.FC<{ acceleration: { x: number; y: number; z: number } }> = ({ 
  acceleration 
}) => {
  const pointRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Points>(null);
  const trailPoints = useRef<THREE.Vector3[]>([]);
  const trailGeometry = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());

  useFrame(() => {
    if (pointRef.current) {
      // Scale acceleration values for better visualization
      const scale = 2;
      const x = acceleration.x * scale;
      const y = acceleration.y * scale;
      const z = acceleration.z * scale;
      
      // Update point position
      pointRef.current.position.set(x, y, z);
      
      // Add to trail
      trailPoints.current.push(new THREE.Vector3(x, y, z));
      
      // Keep only last 50 points for trail
      if (trailPoints.current.length > 50) {
        trailPoints.current.shift();
      }
      
      // Update trail geometry
      if (trailRef.current && trailPoints.current.length > 0) {
        trailGeometry.current.setFromPoints(trailPoints.current);
        trailGeometry.current.attributes.position.needsUpdate = true;
      }
    }
    
    if (arrowRef.current) {
      // Update arrow direction and length
      const scale = 2;
      const x = acceleration.x * scale;
      const y = acceleration.y * scale;
      const z = acceleration.z * scale;
      
      // Calculate arrow direction and length
      const direction = new THREE.Vector3(x, y, z);
      const length = direction.length();
      
      // Position arrow at origin pointing to acceleration point
      arrowRef.current.position.set(0, 0, 0);
      arrowRef.current.lookAt(x, y, z);
      
      // Scale arrow based on acceleration magnitude
      const arrowScale = Math.min(length / 2, 1);
      arrowRef.current.scale.set(arrowScale, arrowScale, length);
    }
  });

  // Calculate acceleration magnitude for color coding
  const magnitude = Math.sqrt(
    acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
  );
  
  // Color based on magnitude (green = low, yellow = medium, red = high)
  const getColor = (mag: number) => {
    if (mag < 1) return '#22c55e'; // Green
    if (mag < 2) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <group>
      {/* Grid helper for reference */}
      <gridHelper args={[10, 10, '#374151', '#374151']} />
      
      {/* Coordinate axes */}
      <group>
        {/* X-axis (Red) */}
        <arrowHelper
          dir={[1, 0, 0]}
          origin={[0, 0, 0]}
          length={3}
          color="#ef4444"
          headLength={0.3}
          headWidth={0.2}
        />
        <Text
          position={[3.5, 0, 0]}
          fontSize={0.3}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
        >
          X
        </Text>
        
        {/* Y-axis (Green) */}
        <arrowHelper
          dir={[0, 1, 0]}
          origin={[0, 0, 0]}
          length={3}
          color="#22c55e"
          headLength={0.3}
          headWidth={0.2}
        />
        <Text
          position={[0, 3.5, 0]}
          fontSize={0.3}
          color="#22c55e"
          anchorX="center"
          anchorY="middle"
        >
          Y
        </Text>
        
        {/* Z-axis (Blue) */}
        <arrowHelper
          dir={[0, 0, 1]}
          origin={[0, 0, 0]}
          length={3}
          color="#3b82f6"
          headLength={0.3}
          headWidth={0.2}
        />
        <Text
          position={[0, 0, 3.5]}
          fontSize={0.3}
          color="#3b82f6"
          anchorX="center"
          anchorY="middle"
        >
          Z
        </Text>
      </group>
      
      {/* Acceleration vector arrow */}
      <group ref={arrowRef}>
        <arrowHelper
          dir={[1, 0, 0]}
          origin={[0, 0, 0]}
          length={1}
          color={getColor(magnitude)}
          headLength={0.2}
          headWidth={0.1}
        />
      </group>
      
      {/* Moving point representing current acceleration */}
      <mesh ref={pointRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color={getColor(magnitude)}
          emissive={getColor(magnitude)}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Trail of previous positions */}
      <points ref={trailRef} geometry={trailGeometry.current}>
        <pointsMaterial 
          color="#14b8a6" 
          size={0.05}
          transparent
          opacity={0.6}
        />
      </points>
      
      {/* Current acceleration values display */}
      <Text
        position={[0, -4, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        X: {acceleration.x.toFixed(2)}g
      </Text>
      <Text
        position={[0, -4.5, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Y: {acceleration.y.toFixed(2)}g
      </Text>
      <Text
        position={[0, -5, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Z: {acceleration.z.toFixed(2)}g
      </Text>
      <Text
        position={[0, -5.5, 0]}
        fontSize={0.3}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
      >
        Magnitude: {magnitude.toFixed(2)}g
      </Text>
    </group>
  );
};

const Acceleration3D: React.FC<Acceleration3DProps> = ({ 
  acceleration, 
  width = 500, 
  height = 400 
}) => {
  return (
    <div style={{ width, height }} className="border border-gray-600 rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [8, 8, 8], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} />
        
        {/* 3D Scene */}
        <AccelerationVisualization acceleration={acceleration} />
        
        {/* Orbit controls for mouse interaction */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
          autoRotate={false}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
};

export default Acceleration3D;
