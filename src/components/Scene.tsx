import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Sphere, Torus } from '@react-three/drei'
import { useControls } from 'leva'
import type { Mesh } from 'three'

function AnimatedBox() {
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  const { 
    position,
    color,
    rotationSpeed,
    scale
  } = useControls('Animated Box', {
    position: { value: [-2, 0, 0], step: 0.1 },
    color: '#ff6b6b',
    rotationSpeed: { value: 1, min: 0, max: 5, step: 0.1 },
    scale: { value: 1, min: 0.5, max: 2, step: 0.1 }
  })

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01 * rotationSpeed
      meshRef.current.rotation.y += 0.01 * rotationSpeed
      meshRef.current.scale.setScalar(scale + (hovered ? 0.1 : 0))
    }
  })

  return (
    <Box
      ref={meshRef}
      position={position}
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial color={hovered ? '#ff8e8e' : color} />
    </Box>
  )
}

function AnimatedSphere() {
  const meshRef = useRef<Mesh>(null)
  
  const { 
    position,
    color,
    floatSpeed,
    floatHeight
  } = useControls('Floating Sphere', {
    position: { value: [0, 2, 0], step: 0.1 },
    color: '#4ecdc4',
    floatSpeed: { value: 2, min: 0, max: 5, step: 0.1 },
    floatHeight: { value: 1, min: 0, max: 3, step: 0.1 }
  })

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * floatSpeed) * floatHeight
    }
  })

  return (
    <Sphere ref={meshRef} position={position} args={[0.5, 32, 32]}>
      <meshStandardMaterial color={color} />
    </Sphere>
  )
}

function AnimatedTorus() {
  const meshRef = useRef<Mesh>(null)
  
  const { 
    position,
    color,
    rotationSpeed
  } = useControls('Spinning Torus', {
    position: { value: [2, 0, 0], step: 0.1 },
    color: '#ffe66d',
    rotationSpeed: { value: 1.5, min: 0, max: 5, step: 0.1 }
  })

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01 * rotationSpeed
      meshRef.current.rotation.z += 0.01 * rotationSpeed
    }
  })

  return (
    <Torus ref={meshRef} position={position} args={[1, 0.3, 16, 100]}>
      <meshStandardMaterial color={color} />
    </Torus>
  )
}

export default function Scene() {
  const showObjects = useControls('Scene Controls', {
    showBox: true,
    showSphere: true,
    showTorus: true
  })

  return (
    <>
      {showObjects.showBox && <AnimatedBox />}
      {showObjects.showSphere && <AnimatedSphere />}
      {showObjects.showTorus && <AnimatedTorus />}
    </>
  )
}