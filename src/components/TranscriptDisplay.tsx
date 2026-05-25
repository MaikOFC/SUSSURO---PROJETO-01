import React, { useEffect, useRef, useState } from 'react';
import { TranscriptLine } from '../types';
import { Copy, Check } from 'lucide-react';

interface TranscriptDisplayProps {
  transcripts: TranscriptLine[];
  currentTranscription: string;
  isListening: boolean;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcripts,
  currentTranscription,
  isListening,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcripts, currentTranscription]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full overflow-y-auto p-4 space-y-4 rounded-xl bg-slate-200/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-300/50 dark:border-slate-700/50 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
    >
      {transcripts.length === 0 && !currentTranscription && !isListening && (
        <div className="h-full flex flex-col items-center justify-center text-black dark:text-slate-400 space-y-2">
          <p>Nenhuma conversa ainda.</p>
          <p className="text-sm">Clique no microfone para começar.</p>
        </div>
      )}

      {transcripts.map((line) => (
        <div
          key={line.id}
          className={`group relative p-4 rounded-2xl max-w-[85%] animate-fade-in ${
            line.source === 'user'
              ? 'bg-teal-100/80 dark:bg-teal-900/40 border-teal-200/50 dark:border-teal-700/30 text-black dark:text-teal-50 ml-auto rounded-tr-sm'
              : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/50 text-black dark:text-slate-200 mr-auto rounded-tl-sm'
          }`}
        >
          <p className="leading-relaxed whitespace-pre-wrap">{line.text}</p>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleCopy(line.text, line.id)}
              className="p-1.5 rounded-md bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Copiar texto"
            >
              {copiedId === line.id ? <Check size={14} className="text-teal-600 dark:text-teal-400" /> : <Copy size={14} />}
            </button>
          </div>
          <span className="text-[10px] opacity-50 block mt-2 text-right">
            {new Date(line.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}

      {currentTranscription && (
        <div className="p-4 rounded-2xl max-w-[85%] bg-teal-50/80 dark:bg-teal-900/20 border border-teal-100/50 dark:border-teal-700/20 text-black/80 dark:text-teal-100/70 ml-auto rounded-tr-sm animate-pulse">
          <p className="leading-relaxed">{currentTranscription}</p>
          <span className="text-[10px] opacity-50 block mt-2 text-right">Ouvindo...</span>
        </div>
      )}

      {isListening && !currentTranscription && (
        <div className="p-4 rounded-2xl max-w-[85%] bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100/30 dark:border-teal-700/10 text-black/60 dark:text-teal-100/50 ml-auto rounded-tr-sm">
          <div className="flex space-x-1 items-center h-5">
            <div className="w-1.5 h-1.5 bg-teal-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-teal-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-teal-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay;
