import React from 'react';
import WebGPUCanvas from './WebGPUCanvas';
import Scene from './Scene';

type ExampleEmbedProps = {
  width?: string | number;
  height?: string | number;
};

export function ExampleEmbed({ width = '100%', height = 400 }: ExampleEmbedProps) {
  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <WebGPUCanvas
        camera={{ position: [6, 6, 6], fov: 60 }}
        style={{ background: '#0b0b0b' }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Scene />
      </WebGPUCanvas>
    </div>
  );
}

export default ExampleEmbed;
