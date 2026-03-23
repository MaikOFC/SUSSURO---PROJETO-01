import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { TranscriptLine } from '../types';

interface TranscriptDisplayProps {
  transcripts: TranscriptLine[];
  currentText: string;
}

// Sub-component for the Typewriter effect
const TypewriterText: React.FC<{ 
  text: string; 
  timestamp: Date;
  onUpdate: () => void;
}> = ({ text, timestamp, onUpdate }) => {
  // Determine if the message is "new" (less than 2 seconds old).
  // This prevents the entire history from re-typing when the page is refreshed.
  const isNew = React.useMemo(() => {
    return (new Date().getTime() - new Date(timestamp).getTime()) < 2000;
  }, [timestamp]);

  const [displayedText, setDisplayedText] = useState(isNew ? '' : text);
  const [isTyping, setIsTyping] = useState(isNew);

  useEffect(() => {
    if (!isNew) return;

    let index = 0;
    setIsTyping(true);
    setDisplayedText('');

    const intervalId = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => text.slice(0, index + 1));
        index++;
        onUpdate(); // Trigger scroll on every character
      } else {
        setIsTyping(false);
        clearInterval(intervalId);
      }
    }, 25); // Typing speed in ms

    return () => clearInterval(intervalId);
  }, [text, isNew, onUpdate]);

  return (
    <span>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-2 h-5 ml-0.5 align-middle bg-teal-500 dark:bg-teal-400 animate-pulse rounded-sm" />
      )}
    </span>
  );
};

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ transcripts, currentText }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // Scroll when new items are added
  useEffect(() => {
    scrollToBottom();
  }, [transcripts.length, currentText]);

  const handleSelectText = (id: string) => {
    const element = document.getElementById(`transcript-text-${id}`);
    if (element) {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-sm md:text-base scrollbar-thin scrollbar-thumb-teal-500/20 scrollbar-track-transparent">
      {transcripts.length === 0 && !currentText && (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 opacity-60">
          <svg className="w-16 h-16 mb-4 text-teal-700 dark:text-teal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <p className="text-center font-sans font-medium">Pressione o microfone para começar.</p>
        </div>
      )}

      {transcripts.map((item) => (
        <div 
          key={item.id} 
          className="group relative p-4 rounded-lg animate-fade-in transition-all duration-300 bg-white dark:bg-slate-800/40 border-l-4 border-teal-500 dark:border-teal-400 shadow-sm dark:shadow-none text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
        >
          <div className="flex justify-between items-center mb-1">
             <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Você</span>
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleSelectText(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-teal-500"
                  title="Selecionar para Libras"
                  aria-label="Selecionar texto para tradução em Libras"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </button>
                <span className="text-xs text-slate-400 dark:text-slate-500">{item.timestamp.toLocaleTimeString()}</span>
             </div>
          </div>
          <p 
            id={`transcript-text-${item.id}`}
            onClick={() => handleSelectText(item.id)}
            className="leading-relaxed cursor-pointer selection:bg-teal-200 dark:selection:bg-teal-900 selection:text-teal-900 dark:selection:text-teal-100"
          >
            <TypewriterText 
              text={item.text} 
              timestamp={item.timestamp}
              onUpdate={scrollToBottom}
            />
          </p>
        </div>
      ))}

      {currentText && (
         <div className="p-4 rounded-lg bg-teal-50 dark:bg-slate-800/20 border-l-4 border-teal-500 text-teal-900 dark:text-teal-100 animate-pulse">
            <div className="flex justify-between items-center mb-1">
             <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Ouvindo...</span>
          </div>
          <p className="leading-relaxed">{currentText}</p>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
};

export default TranscriptDisplay;