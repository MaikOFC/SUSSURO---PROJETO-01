import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Esse componente controla a visibilidade do widget VLibras.
 * Ele esconde o widget quando o usuário está na página de configurações.
 */
export const VLibrasControl: React.FC = () => {
  const location = useLocation();
  const isSettings = location.pathname === '/settings';

  useEffect(() => {
    const toggleVLibras = () => {
      const vw = document.querySelector('div[vw]') as HTMLElement | null;
      const vpw = document.querySelector('[vw-plugin-wrapper]') as HTMLElement | null;
      
      if (isSettings) {
        // Hiding everything related to VLibras
        if (vw) {
          vw.style.setProperty('display', 'none', 'important');
          vw.style.setProperty('visibility', 'hidden', 'important');
          vw.style.setProperty('opacity', '0', 'important');
          vw.style.setProperty('pointer-events', 'none', 'important');
        }
        if (vpw) {
          vpw.style.setProperty('display', 'none', 'important');
        }
      } else {
        // Restoring VLibras
        if (vw) {
          vw.style.setProperty('display', 'block', 'important');
          vw.style.setProperty('visibility', 'visible', 'important');
          vw.style.setProperty('opacity', '1', 'important');
          vw.style.setProperty('pointer-events', 'auto', 'important');
        }
        if (vpw) {
          vpw.style.setProperty('display', 'block', 'important');
        }
      }
    };

    // Initial run
    toggleVLibras();

    // Check frequently for a few seconds since VLibras re-renders itself a lot
    const interval = setInterval(toggleVLibras, 500);
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isSettings]);

  return null;
};
