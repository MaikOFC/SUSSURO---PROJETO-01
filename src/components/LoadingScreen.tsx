import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Iniciando sussurro...' }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed bottom-0 left-0 w-full h-[50vh] md:top-0 md:h-full md:w-[50vw] z-[1000000] flex flex-col items-center justify-center bg-slate-950 text-white border-t md:border-t-0 md:border-r border-slate-800"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-teal-500/20 blur-[120px] mix-blend-screen animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-2">
        {/* Animated Logo Container */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-white flex items-center justify-center shadow-2xl shadow-teal-500/30 mb-4 md:mb-6 overflow-hidden"
        >
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<span class="text-teal-500 font-bold text-3xl">S</span>';
            }}
          />
        </motion.div>

        {/* Text & Progress */}
        <div className="space-y-3 text-center">
          <h2 className="text-xl md:text-2xl font-bold tracking-tighter">Sussurro</h2>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-40 md:w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-teal-500"
                animate={{ 
                  x: [-192, 192] 
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "linear"
                }}
              />
            </div>
            <p className="text-[10px] md:text-xs font-medium text-slate-400 uppercase tracking-[0.2em]">{message}</p>
          </div>
        </div>

        {/* Tip (using margin-top on short screens, absolute on taller screens to prevent content collision) */}
        <div className="mt-6 md:absolute md:bottom-8 text-slate-500 text-[10px] md:text-xs font-medium max-w-[280px] md:max-w-xs text-center">
          <p>Preparando o widget de Libras. Isso pode levar alguns segundos dependendo da sua conexão.</p>
        </div>
      </div>
    </motion.div>
  );
};
