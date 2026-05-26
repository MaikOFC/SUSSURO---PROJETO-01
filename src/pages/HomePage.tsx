import React from 'react';
import { ConnectionStatus, TranscriptLine, Theme, VisualizerStyle } from '../types';
import AudioVisualizer from '../components/AudioVisualizer';
import TranscriptDisplay from '../components/TranscriptDisplay';
import VLibrasQueue from '../components/VLibrasQueue';
import HistoryModal from '../components/HistoryModal';
import { SpeakingHeadIcon } from '../components/SpeakingHeadIcon';
import { Mic, Square, Settings, RefreshCw, Volume2, VolumeX, Keyboard, AlertCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HomePageProps {
  activeTab: 'voice' | 'text';
  setActiveTab: (tab: 'voice' | 'text') => void;
  textInput: string;
  setTextInput: (text: string) => void;
  isTTSEnabled: boolean;
  setIsTTSEnabled: (enabled: boolean) => void;
  transcripts: TranscriptLine[];
  currentTranscription: string;
  status: ConnectionStatus;
  error: string | null;
  rms: number;
  updateAvailable: boolean;
  vlibrasCurrentText: string | null;
  vlibrasQueue: string[];
  visualizerStyle: VisualizerStyle;
  handleRefresh: () => void;
  handleStart: () => void;
  handleStop: () => void;
  handleSendText: () => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  clearHistory: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  activeTab,
  setActiveTab,
  textInput,
  setTextInput,
  isTTSEnabled,
  setIsTTSEnabled,
  transcripts,
  currentTranscription,
  status,
  error,
  rms,
  updateAvailable,
  vlibrasCurrentText,
  vlibrasQueue,
  visualizerStyle,
  handleRefresh,
  handleStart,
  handleStop,
  handleSendText,
  isHistoryOpen,
  setIsHistoryOpen,
  clearHistory,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col-reverse md:flex-row w-full h-screen overflow-hidden font-sans transition-colors duration-300 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[40%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] mix-blend-screen" />
      </div>

      {/* ── Lado Esquerdo (Desktop) / Inferior (Mobile) — Conteúdo do App ── */}
      <div className="relative z-10 w-full md:w-[50vw] h-[50vh] md:h-full flex flex-col p-4 md:p-8 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto flex flex-col min-h-full">

          {/* Header */}
          <header className="flex items-center justify-between mb-3 md:mb-6">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white flex items-center justify-center shadow-lg shadow-teal-500/20 overflow-hidden shrink-0">
                <img
                  src={`/logo.png?v=${Date.now()}`}
                  alt="Logo Sussurro"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML =
                      '<span class="text-teal-500 font-bold text-xs md:text-sm">S</span>';
                  }}
                />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold tracking-tight leading-tight">Sussurro</h1>
                <p className="text-xs md:text-sm opacity-60 leading-tight">O barulho do silêncio</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                id="btn-sussurro-refresh"
                onClick={handleRefresh}
                data-vlib-ignore="true"
                className={`p-1.5 md:p-2 rounded-lg transition-all transform active:scale-95 ${
                  updateAvailable 
                    ? 'bg-amber-500 text-white animate-pulse shadow-lg shadow-amber-500/40 border border-amber-400' 
                    : 'hover:bg-slate-800/10 dark:hover:bg-slate-800 text-slate-500'
                }`}
                title={updateAvailable ? 'Nova versão disponível! Clique para atualizar.' : 'Recarregar App'}
              >
                <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${updateAvailable ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              </button>
              <button
                id="btn-sussurro-toggle-mode"
                onClick={() => setActiveTab(activeTab === 'voice' ? 'text' : 'voice')}
                data-vlib-ignore="true"
                className={`p-1.5 md:p-2 rounded-lg transition-colors ${activeTab === 'text' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'hover:bg-slate-800/10 dark:hover:bg-slate-800'}`}
                title={activeTab === 'voice' ? 'Digitar Texto' : 'Captação de Áudio'}
              >
                {activeTab === 'voice' ? <SpeakingHeadIcon className="w-4 h-4 md:w-5 md:h-5" /> : <Keyboard className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
              <button
                id="btn-sussurro-settings"
                onClick={() => navigate('/settings')}
                data-vlib-ignore="true"
                className="p-1.5 md:p-2 rounded-lg hover:bg-slate-800/10 dark:hover:bg-slate-800 transition-colors"
                title="Configurações"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-h-0 space-y-3 md:space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-3 text-red-500">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Transcription Area & Views */}
            {activeTab === 'voice' ? (
              <TranscriptDisplay
                transcripts={transcripts}
                currentTranscription={currentTranscription}
                isListening={status === ConnectionStatus.CONNECTED}
              />
            ) : (
              <div className="flex-1 flex flex-col min-h-0 bg-slate-200/50 dark:bg-slate-900/40 rounded-xl border border-slate-300/50 dark:border-slate-700/50 overflow-hidden">
                <TranscriptDisplay
                  transcripts={transcripts}
                  currentTranscription=""
                  isListening={false}
                />
                <div className="p-3 bg-white/50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => setIsTTSEnabled(!isTTSEnabled)}
                    data-vlib-ignore="true"
                    className={`p-2 rounded-lg transition-colors ${isTTSEnabled ? 'text-teal-500 bg-teal-500/10' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}
                    title={isTTSEnabled ? 'Voz Ativada' : 'Voz Desativada'}
                  >
                    {isTTSEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                    data-vlib-ignore="true"
                    placeholder="Digite para converter em voz e Libras..."
                    className="flex-1 bg-transparent px-3 py-2 outline-none text-sm placeholder:text-slate-500"
                  />
                  <button
                    onClick={handleSendText}
                    data-vlib-ignore="true"
                    disabled={!textInput.trim()}
                    className="p-2 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors flex shrink-0 items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ✅ Fila VLibras — texto atual em destaque + itens aguardando */}
            <VLibrasQueue
              currentTranslating={vlibrasCurrentText}
              queue={vlibrasQueue}
            />

            {/* Controls & Visualizer */}
            {activeTab === 'voice' && (
              <div className="space-y-2 md:space-y-4">
                <AudioVisualizer 
                  rms={rms} 
                  isActive={status === ConnectionStatus.CONNECTED} 
                  style={visualizerStyle}
                />

                <div className="flex justify-center pb-2">
                  {status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR ? (
                    <button
                      id="btn-sussurro-action"
                      onClick={handleStart}
                      data-vlib-ignore="true"
                      className="group relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/30 transition-all hover:scale-105 active:scale-95"
                    >
                      <Mic className="w-5 h-5 md:w-7 md:h-7" />
                      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-xs px-2 py-1 rounded text-white whitespace-nowrap">
                        Iniciar Transcrição
                      </span>
                    </button>
                  ) : status === ConnectionStatus.CONNECTING ? (
                    <button
                      id="btn-sussurro-action"
                      disabled
                      className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-500 text-white opacity-50 cursor-not-allowed animate-pulse"
                    >
                      <Mic className="w-5 h-5 md:w-7 md:h-7" />
                    </button>
                  ) : (
                    <button
                      id="btn-sussurro-action"
                      onClick={handleStop}
                      data-vlib-ignore="true"
                      className="group relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95 animate-pulse"
                    >
                      <Square className="w-4 h-4 md:w-6 md:h-6 fill-current" />
                      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-xs px-2 py-1 rounded text-white whitespace-nowrap">
                        Parar Transcrição
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Lado Direito (Desktop) / Superior (Mobile) — Área VLibras ── */}
      <div className="relative z-0 w-full md:w-[50vw] h-[50vh] md:h-full flex flex-col items-center justify-center bg-slate-100/50 dark:bg-slate-900/50">
        <div className="text-center opacity-50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center">
            <span className="text-2xl">🤟</span>
          </div>
          <p className="text-sm font-medium">Área reservada para o VLibras</p>
          <p className="text-xs mt-2">O widget aparecerá aqui quando ativado</p>
        </div>
      </div>

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        transcripts={transcripts}
        onClear={clearHistory}
      />
    </div>
  );
};

export default HomePage;
