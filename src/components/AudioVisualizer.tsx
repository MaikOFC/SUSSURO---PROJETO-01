import React, { useEffect, useRef } from 'react';
import { VisualizerStyle } from '../types';

interface AudioVisualizerProps {
  rms: number;
  isActive: boolean;
  style?: VisualizerStyle;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ rms, isActive, style = 'wave' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (style === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      if (style === 'wave') {
        const targetAmplitude = Math.min(rms * 500, height / 2);
        const amplitude = targetAmplitude * 0.8 + (Math.random() * targetAmplitude * 0.2);

        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.05 + time) * amplitude * Math.sin(x * 0.01);
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = 'rgba(20, 184, 166, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(20, 184, 166, 0.5)';
      } else if (style === 'bars') {
        const barCount = 40;
        const barWidth = width / barCount;
        const targetAmplitude = Math.min(rms * 800, height);

        for (let i = 0; i < barCount; i++) {
          const barHeight = (targetAmplitude * 0.5 + Math.random() * targetAmplitude * 0.5) * Math.sin((i / barCount) * Math.PI);
          const x = i * barWidth;
          const y = (height - barHeight) / 2;

          ctx.fillStyle = 'rgba(20, 184, 166, 0.8)';
          ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        }
      }

      time += 0.1;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [rms, isActive, style]);

  if (style === 'none') return null;

  return (
    <div className="w-full h-10 md:h-16 flex items-center justify-center rounded-xl bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300/50 dark:border-slate-700/50 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={400}
        height={64}
        className="w-full h-full"
      />
    </div>
  );
};

export default AudioVisualizer;
