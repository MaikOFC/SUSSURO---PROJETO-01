import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  volume: number; // 0 to 1
  isActive: boolean;
  color: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ volume, isActive, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        width = canvas.width;
        height = canvas.height;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        // Use a generic semi-transparent color for inactive line that works on both dark/light
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'; // slate-400 with opacity
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      ctx.beginPath();
      const time = Date.now() / 300;
      ctx.moveTo(0, height / 2);

      // Use volume to control amplitude
      const baseAmplitude = Math.max(2, volume * (height / 3));

      for (let i = 0; i < width; i++) {
        // Multi-sine wave for organic look
        const y = height / 2 + 
          Math.sin(i * 0.02 + time) * 
          Math.sin(i * 0.01 - time * 2) * 
          baseAmplitude;
        
        ctx.lineTo(i, y);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, volume, color]);

  return (
    <div className="w-full h-24 bg-slate-100 dark:bg-slate-900/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner transition-colors duration-300">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default AudioVisualizer;