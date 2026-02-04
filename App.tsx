import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GeminiLiveService } from './services/geminiService';
import { ConnectionState, TranscriptLine } from './types';
import AudioVisualizer from './components/AudioVisualizer';
import TranscriptDisplay from './components/TranscriptDisplay';

const App: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  
  // Initialize transcripts from localStorage
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>(() => {
    try {
      const saved = localStorage.getItem('sussurro-transcripts');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (e) {
      console.warn('Failed to restore transcripts', e);
    }
    return [];
  });

  const [currentText, setCurrentText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const serviceRef = useRef<GeminiLiveService | null>(null);

  // Apply theme class to html element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Persist transcripts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sussurro-transcripts', JSON.stringify(transcripts));
  }, [transcripts]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const clearHistory = () => {
    if ((transcripts.length > 0 || currentText) && window.confirm('Tem certeza que deseja limpar o histórico de conversas?')) {
      setTranscripts([]);
      setCurrentText('');
      localStorage.removeItem('sussurro-transcripts');
    }
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
        // Filter out hallucinated tags or empty strings
        // Removes <noise>, [sound], etc.
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
                source: 'user'
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
      // Apply same filtering on stop
      const cleanText = currentText.replace(/<[^>]*>|\[[^\]]*\]/g, '').trim();
      
      if (cleanText) {
        setTranscripts(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: cleanText,
            isFinal: true,
            timestamp: new Date(),
            source: 'user'
          }
        ]);
      }
      setCurrentText('');
    }
  }, [currentText]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-900 dark:selection:text-cyan-200 transition-colors duration-300">
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/20 dark:bg-cyan-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto h-screen flex flex-col p-4 md:p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/10 dark:shadow-cyan-900/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
               <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-400">
                Sussurro
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">Transcrição Ao Vivo</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Clear History Button */}
             <button
                onClick={clearHistory}
                disabled={transcripts.length === 0 && !currentText}
                className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 transition-colors ${
                  transcripts.length === 0 && !currentText
                    ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
                title="Limpar histórico"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
             </button>

             {/* Theme Toggle */}
             <button 
               onClick={toggleTheme}
               className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
               title={theme === 'dark' ? "Mudar para tema claro" : "Mudar para tema escuro"}
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
             </button>

             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${connectionState === ConnectionState.CONNECTED ? 'bg-cyan-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
               <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                 {connectionState === ConnectionState.CONNECTED ? 'Conectado' : 
                  connectionState === ConnectionState.CONNECTING ? 'Conectando...' : 'Desconectado'}
               </span>
             </div>
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
           <div className="p-6 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md transition-colors duration-300 relative z-[10000]">
              <div className="mb-6">
                <AudioVisualizer 
                  isActive={connectionState === ConnectionState.CONNECTED}
                  volume={volume}
                  color={theme === 'dark' ? "#22d3ee" : "#06b6d4"} // Cyan-400 for dark, Cyan-500 for light
                />
              </div>
              
              <div className="flex justify-center items-center gap-6">
                 {connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR ? (
                   <button 
                     onClick={startTranscription}
                     className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
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
        </main>
      </div>
    </div>
  );
};

export default App;