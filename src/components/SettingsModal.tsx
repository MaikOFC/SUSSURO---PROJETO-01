import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, Trash2, ShieldCheck, ShieldAlert, Activity, History, Moon, Sun, Palette } from 'lucide-react';
import { VisualizerStyle, Theme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCacheEnabled: boolean;
  onToggleCache: (enabled: boolean) => void;
  visualizerStyle: VisualizerStyle;
  onVisualizerStyleChange: (style: VisualizerStyle) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenHistory: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isCacheEnabled,
  onToggleCache,
  visualizerStyle,
  onVisualizerStyleChange,
  theme,
  onToggleTheme,
  onOpenHistory,
}) => {
  const clearAppCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      alert('Cache do aplicativo limpo com sucesso!');
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 top-1/2 md:top-0 md:right-1/2 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="w-full max-w-[280px] max-h-full flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 pointer-events-auto"
          >
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-teal-500/10 rounded-md">
                  <Database className="w-3.5 h-3.5 text-teal-500" />
                </div>
                <h2 className="text-base font-bold">Configurações</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {/* Tema */}
              <div className="flex items-center justify-between">
                <div className="space-y-0">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-semibold text-[13px]">Tema</h3>
                    {theme === 'dark' ? 
                      <Moon className="w-3 h-3 text-teal-500" /> : 
                      <Sun className="w-3 h-3 text-amber-500" />
                    }
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Aparência do aplicativo.
                  </p>
                </div>
                <button
                  onClick={onToggleTheme}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${
                    theme === 'dark' ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                      theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Botão de Histórico */}
              <button
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-teal-500" />
                  <div className="text-left">
                    <span className="text-[13px] font-semibold block">Ver Histórico</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Abra as transcrições salvas.</span>
                  </div>
                </div>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Toggle Cache de Histórico */}
              <div className="flex items-center justify-between">
                <div className="space-y-0">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-semibold text-[13px]">Salvar Histórico</h3>
                    {isCacheEnabled ? 
                      <ShieldCheck className="w-3 h-3 text-teal-500" /> : 
                      <ShieldAlert className="w-3 h-3 text-amber-500" />
                    }
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Armazena transcrições.
                  </p>
                </div>
                <button
                  onClick={() => onToggleCache(!isCacheEnabled)}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${
                    isCacheEnabled ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                      isCacheEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Estilo do Visualizador */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-500" />
                  <h3 className="font-semibold text-[13px]">Estilo do Visualizador</h3>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['wave', 'bars', 'none'] as VisualizerStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => onVisualizerStyleChange(style)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-medium border transition-all ${
                        visualizerStyle === style
                          ? 'bg-teal-500 border-teal-500 text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-500/50'
                      }`}
                    >
                      {style === 'wave' ? 'Onda' : style === 'bars' ? 'Barras' : 'Nenhum'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Limpar Cache do App */}
              <div className="space-y-2">
                <div className="space-y-0">
                  <h3 className="font-semibold text-[13px]">Memória do App</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Limpa arquivos e cache.
                  </p>
                </div>
                <button
                  onClick={clearAppCache}
                  className="w-full flex items-center justify-center space-x-1.5 p-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors text-xs font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar e Reiniciar</span>
                </button>
              </div>
            </div>

            <div className="p-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 shrink-0 rounded-b-xl">
              <p className="text-[9px] text-center text-slate-500">
                Sussurro v6.0 • Privacidade
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
