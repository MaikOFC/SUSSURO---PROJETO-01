import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Trash2, ShieldCheck, ShieldAlert, Activity, History, Moon, Sun, Download } from 'lucide-react';
import { VisualizerStyle, Theme, TranscriptLine } from '../types';

interface SettingsPageProps {
  isCacheEnabled: boolean;
  onToggleCache: (enabled: boolean) => void;
  visualizerStyle: VisualizerStyle;
  onVisualizerStyleChange: (style: VisualizerStyle) => void;
  theme: Theme;
  onToggleTheme: () => void;
  transcripts: TranscriptLine[];
  onClearHistory: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  isCacheEnabled,
  onToggleCache,
  visualizerStyle,
  onVisualizerStyleChange,
  theme,
  onToggleTheme,
  transcripts,
  onClearHistory,
}) => {
  const navigate = useNavigate();
  const [viewingHistory, setViewingHistory] = React.useState(false);

  const clearAppCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      alert('Cache do aplicativo limpo com sucesso!');
      window.location.reload();
    }
  };

  const handleDownload = () => {
    const text = transcripts.map(t => `[${new Date(t.timestamp).toLocaleString()}] ${t.source === 'user' ? 'Você' : 'Modelo'}: ${t.text}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sussurro-historico-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (viewingHistory) {
    return (
      <div className="h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto p-4 md:p-8">
          <header className="flex items-center space-x-4 mb-8">
            <button
              onClick={() => setViewingHistory(false)}
              data-vlib-ignore="true"
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <h1 className="text-2xl font-bold">Histórico de Transcrições</h1>
          </header>

          <div className="space-y-4 mb-24">
            {transcripts.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Nenhuma conversa salva ainda.</p>
              </div>
            ) : (
              transcripts.map((line) => (
                <div 
                  key={line.id} 
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-500">
                      {line.source === 'user' ? 'Você' : 'Modelo'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(line.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{line.text}</p>
                </div>
              ))
            )}
          </div>

          {transcripts.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-20">
              <div className="max-w-2xl mx-auto flex gap-4">
                <button
                  onClick={onClearHistory}
              data-vlib-ignore="true"
                  className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors font-bold text-sm"
                >
                  <Trash2 size={18} />
                  <span>Limpar Tudo</span>
                </button>
                <button
                  onClick={handleDownload}
              data-vlib-ignore="true"
                  className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-colors font-bold text-sm shadow-lg shadow-teal-500/20"
                >
                  <Download size={18} />
                  <span>Exportar TXT</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto p-4 md:p-8">
        <header className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/')}
              data-vlib-ignore="true"
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors group"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-teal-500/10 rounded-lg">
              <Database className="w-5 h-5 text-teal-500" />
            </div>
            <h1 className="text-2xl font-bold">Configurações</h1>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Sessão Visual */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <Sun className="w-4 h-4" /> Personalização
            </h2>
            
            <div className="space-y-6">
              {/* Tema */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Tema</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Alternar entre modo claro e escuro.</p>
                </div>
                <button
                  onClick={onToggleTheme}
              data-vlib-ignore="true"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    theme === 'dark' ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Estilo do Visualizador */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Estilo do Visualizador</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Como as ondas sonoras são exibidas.</p>
                  </div>
                  <Activity className="w-5 h-5 text-teal-500" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(['wave', 'bars', 'none'] as VisualizerStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => onVisualizerStyleChange(style)}
              data-vlib-ignore="true"
                      className={`py-3 px-2 rounded-xl text-sm font-medium border transition-all ${
                        visualizerStyle === style
                          ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-500/50'
                      }`}
                    >
                      {style === 'wave' ? 'Onda' : style === 'bars' ? 'Barras' : 'Nenhum'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Dados e Cache */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <Database className="w-4 h-4" /> Dados e Armazenamento
            </h2>

            <div className="space-y-6">
              {/* Histórico Ativo */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Salvar Histórico</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Manter transcrições salvas localmente.</p>
                </div>
                <button
                  onClick={() => onToggleCache(!isCacheEnabled)}
              data-vlib-ignore="true"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    isCacheEnabled ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isCacheEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Botão de Histórico */}
              <button
                onClick={() => setViewingHistory(true)}
              data-vlib-ignore="true"
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <History className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-lg block">Ver Histórico Completo</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">Ver e exportar mensagens passadas.</span>
                  </div>
                </div>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Limpar memória */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-red-500">
                  <Trash2 className="w-5 h-5" />
                  <h3 className="font-semibold text-lg">Ações Destrutivas</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Isso irá desregistrar o Service Worker e limpar todos os arquivos offline.</p>
                <button
                  onClick={clearAppCache}
              data-vlib-ignore="true"
                  className="w-full flex items-center justify-center space-x-2 p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors font-bold"
                >
                  <span>Limpar Cache e Reiniciar App</span>
                </button>
              </div>
            </div>
          </section>

          <footer className="text-center py-8">
            <p className="text-sm text-slate-500">Sussurro v6.0 • Código Aberto</p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
