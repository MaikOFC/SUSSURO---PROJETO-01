import React from 'react';
import { TranscriptLine } from '../types';
import { X, Trash2, Download } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcripts: TranscriptLine[];
  onClear: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, transcripts, onClear }) => {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 top-1/2 md:top-0 md:right-1/2 z-[100] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-full flex flex-col shadow-2xl mb-20 md:mb-0">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-slate-100">Histórico de Transcrições</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-full hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {transcripts.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              Nenhum histórico disponível.
            </div>
          ) : (
            transcripts.map((line) => (
              <div key={line.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-teal-400">
                    {line.source === 'user' ? 'Você' : 'Modelo'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(line.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{line.text}</p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={onClear}
            disabled={transcripts.length === 0}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            <span>Limpar Histórico</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={transcripts.length === 0}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span>Exportar TXT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
