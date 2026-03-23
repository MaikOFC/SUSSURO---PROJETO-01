import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { GeminiLiveService } from './services/geminiService';
import { ConnectionState, TranscriptLine } from './types';
import AudioVisualizer from './components/AudioVisualizer';
import TranscriptDisplay from './components/TranscriptDisplay';
import { storageUtils } from './utils/storageUtils';

// --- Components ---

const HistoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  transcripts: TranscriptLine[];
}> = ({ isOpen, onClose, transcripts }) => {
  if (!isOpen) return null;

  // Group transcripts by date
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: TranscriptLine[] } = {};
    
    // Sort by newest first
    const sorted = [...transcripts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    sorted.forEach(t => {
      const dateKey = t.timestamp.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });
    return groups;
  }, [transcripts]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Histórico de Transcrições
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {Object.keys(groupedHistory).length === 0 ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
              <p>Nenhum histórico encontrado.</p>
            </div>
          ) : (
            Object.entries(groupedHistory).map(([date, items]) => (
              <div key={date} className="space-y-3">
                <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 py-2 z-10 border-b border-slate-100 dark:border-slate-800/50 backdrop-blur-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-500">
                    {date}
                  </h3>
                </div>
                <div className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                  {items.map((item) => (
                    <div key={item.id} className="text-sm text-slate-700 dark:text-slate-300 py-1">
                      <span className="text-xs font-mono text-slate-400 mr-2 opacity-75">
                        {item.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-center text-slate-500">
          O histórico é salvo localmente no seu dispositivo.
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  
  // Initialize state from storage
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>(() => storageUtils.getTranscripts());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => storageUtils.getTheme());
  const [inputMode, setInputMode] = useState<'voice' | 'text'>(() => storageUtils.getInputMode());
  
  const [currentText, setCurrentText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Manual text input
  const [manualText, setManualText] = useState('');
  
  const serviceRef = useRef<GeminiLiveService | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply theme class and persist
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storageUtils.saveTheme(theme);
  }, [theme]);

  // Persist transcripts whenever they change
  useEffect(() => {
    storageUtils.saveTranscripts(transcripts);
  }, [transcripts]);

  // Persist input mode
  useEffect(() => {
    storageUtils.saveInputMode(inputMode);
  }, [inputMode]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    setIsMenuOpen(false);
  };

  const clearHistory = () => {
    if ((transcripts.length > 0 || currentText) && window.confirm('Atenção: Isso apagará permanentemente todo o histórico de conversas. Deseja continuar?')) {
      setTranscripts([]);
      setCurrentText('');
      storageUtils.clearTranscripts();
    }
    setIsMenuOpen(false);
  };

  const startTranscription = async () => {
    setError(null);
    setConnectionState(ConnectionState.CONNECTING);
    
    const service = new GeminiLiveService({
      onOpen: () => {
        setConnectionState(ConnectionState.CONNECTED);
      },
      onClose: () => {
        setConnectionState(ConnectionState.DISCONNECTED);
        setCurrentText('');
        setVolume(0);
      },
      onError: (err) => {
        console.error(err);
        setError(err.message);
        setConnectionState(ConnectionState.ERROR);
      },
      onTranscript: (text, isFinal) => {
        const cleanText = text.replace(/<[^>]*>|\[[^\]]*\]/g, '').trim();

        if (!cleanText) return;

        if (isFinal) {
           const finalText = cleanText || currentText;
           if (finalText.trim()) {
             setTranscripts(prev => [
              ...prev,
              {
                id: Date.now().toString(),
                text: finalText,
                isFinal: true,
                timestamp: new Date(),
                source: 'user',
                inputType: 'voice'
              }
            ]);
           }
          setCurrentText('');
        } else {
          setCurrentText(cleanText);
        }
      },
      onAudioData: (data) => {
        // Ignore model output audio for transcription app
      },
      onVolume: (vol) => {
        setVolume(vol);
      }
    });

    serviceRef.current = service;
    await service.connect();
  };

  const stopTranscription = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
      serviceRef.current = null;
    }
    setConnectionState(ConnectionState.DISCONNECTED);
    setVolume(0);
    
    if (currentText.trim()) {
      const cleanText = currentText.replace(/<[^>]*>|\[[^\]]*\]/g, '').trim();
      if (cleanText) {
        setTranscripts(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: cleanText,
            isFinal: true,
            timestamp: new Date(),
            source: 'user',
            inputType: 'voice'
          }
        ]);
      }
      setCurrentText('');
    }
  }, [currentText]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    setTranscripts(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text: manualText.trim(),
        isFinal: true,
        timestamp: new Date(),
        source: 'user',
        inputType: 'text'
      }
    ]);
    setManualText('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-teal-500/30 selection:text-teal-900 dark:selection:text-teal-200 transition-colors duration-300">
      
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-400/20 dark:bg-teal-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto h-screen flex flex-col p-4 md:p-6">
        {/* Header - Simplified */}
        <header className="flex items-center justify-end mb-2 pt-2">
          <div className="relative" ref={menuRef}>
            {/* 3-Dot Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[100] animate-fade-in origin-top-right">
                
                {/* Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors border-b border-slate-100 dark:border-slate-800/50"
                >
                  {theme === 'dark' ? (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                     </svg>
                   ) : (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                     </svg>
                   )}
                  <span className="text-sm font-medium">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                </button>

                {/* History Button */}
                <button 
                  onClick={() => { setIsHistoryOpen(true); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors border-b border-slate-100 dark:border-slate-800/50"
                >
                  <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">Histórico Diário</span>
                </button>

                {/* Clear Trash Button */}
                <button 
                  onClick={clearHistory}
                  disabled={transcripts.length === 0}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    transcripts.length === 0 
                      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                      : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-sm font-medium">Limpar Tudo</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-white/70 dark:bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-2xl overflow-hidden relative transition-colors duration-300">
           {error && (
            <div className="absolute top-4 left-4 right-4 z-50 bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg flex items-center gap-3">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <span className="text-sm">{error}</span>
               <button onClick={() => setError(null)} className="ml-auto hover:text-red-800 dark:hover:text-white">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
            </div>
           )}

           <TranscriptDisplay transcripts={transcripts} currentText={currentText} />

           {/* Controls Area */}
           <div className="p-4 md:p-6 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md transition-colors duration-300 relative z-[10000]">
              
              {/* Tab Switcher */}
              <div className="flex justify-center mb-6">
                 <div className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl flex gap-1 border border-slate-200 dark:border-slate-700/50">
                    <button 
                      onClick={() => setInputMode('voice')}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                        inputMode === 'voice' 
                        ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Voz
                    </button>
                    <button 
                      onClick={() => setInputMode('text')}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                        inputMode === 'text' 
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Texto
                    </button>
                 </div>
              </div>

              {/* Voice Controls */}
              {inputMode === 'voice' && (
                <div className="animate-fade-in">
                  <div className="mb-6">
                    <AudioVisualizer 
                      isActive={connectionState === ConnectionState.CONNECTED}
                      volume={volume}
                      color={theme === 'dark' ? "#2dd4bf" : "#14b8a6"} // Teal-400 for dark, Teal-500 for light
                    />
                  </div>
                  
                  <div className="flex justify-center items-center gap-6">
                     {connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR ? (
                       <button 
                         onClick={startTranscription}
                         className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
                       >
                         <div className="absolute inset-0 rounded-full border border-white/20 animate-ping-slow pointer-events-none opacity-0 group-hover:opacity-100" />
                         <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                         </svg>
                       </button>
                     ) : (
                       <button 
                         onClick={stopTranscription}
                         className="group flex items-center justify-center w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
                       >
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                         </svg>
                       </button>
                     )}
                  </div>
                  <p className="text-center mt-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {connectionState === ConnectionState.CONNECTED 
                      ? "Ouvindo... Fale agora." 
                      : "Toque no microfone para iniciar."}
                  </p>
                </div>
              )}

              {/* Text Input Controls */}
              {inputMode === 'text' && (
                <form onSubmit={handleManualSubmit} className="flex gap-2 animate-fade-in items-end">
                   <div className="flex-1 relative">
                     <textarea
                       value={manualText}
                       onChange={(e) => setManualText(e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           handleManualSubmit(e);
                         }
                       }}
                       placeholder="Digite sua mensagem aqui..."
                       className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none h-20 md:h-24 shadow-inner"
                     />
                     <div className="absolute bottom-2 right-2 text-[10px] text-slate-400">
                        Enter para enviar
                     </div>
                   </div>
                   <button 
                     type="submit"
                     disabled={!manualText.trim()}
                     className="h-20 md:h-24 w-16 md:w-20 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:bg-slate-300 disabled:dark:bg-slate-800 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/30 transition-all duration-300 flex flex-col items-center justify-center gap-1 active:scale-95"
                   >
                     <svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                     </svg>
                     <span className="text-[10px] font-bold">Enviar</span>
                   </button>
                </form>
              )}
           </div>
        </main>
      </div>

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        transcripts={transcripts} 
      />

    </div>
  );
};

export default App;