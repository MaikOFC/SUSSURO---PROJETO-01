import React from 'react';

export const SpeakingHeadIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12.5 2C9 2 6 5 6 9v3s0 1.5 1 2c1 1 1.5 2.5 1.5 2.5s.5 2.5.5 3h6v-2.5c1.5-.5 2.5-1.5 3-2.5.3-.8.7-1.5 1-2 .5-.5 1-1.5 1-2.5 0-1-.5-2-1.5-2.5C18.5 6 16.5 2 12.5 2z" fill="currentColor" stroke="none" />
      <path d="M18 9c1.5 1.5 1.5 4 0 5.5" />
      <path d="M20 7c2.5 2.5 2.5 6.5 0 9.5" />
    </svg>
  );
};
