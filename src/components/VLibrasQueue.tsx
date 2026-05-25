// ─────────────────────────────────────────────────────────────────────────────
// VLibrasQueue — exibe o texto que está sendo traduzido agora (em destaque)
// e a fila de textos aguardando tradução.
//
// Inspirado no painel de tradução simultânea do Traduz Libras, onde:
//  • O texto atual aparece destacado (card colorido + ícone animado)
//  • Os próximos ficam numa lista abaixo, em ordem de chegada
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Languages, Clock, ChevronRight } from 'lucide-react';

interface VLibrasQueueProps {
  /** Texto que o VLibras está traduzindo agora (null = ocioso) */
  currentTranslating: string | null;
  /** Textos aguardando na fila (já exclui o currentTranslating) */
  queue: string[];
}

const VLibrasQueue: React.FC<VLibrasQueueProps> = ({
  currentTranslating,
  queue,
}) => {
  const hasActivity = currentTranslating !== null || queue.length > 0;

  if (!hasActivity) return null;

  return (
    <div className="w-full space-y-2 mt-2">
      {/* ── Label da seção ──────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider px-1">
        <Languages className="w-3.5 h-3.5" />
        <span>Fila VLibras</span>
      </div>

      {/* ── Texto ATUAL (em destaque) ────────────────────────────── */}
      {currentTranslating && (
        <div
          className="
            relative overflow-hidden
            p-3 rounded-xl
            bg-teal-500 dark:bg-teal-600
            text-white
            shadow-md shadow-teal-500/30
            border border-teal-400/40
          "
          aria-label="Traduzindo agora"
        >
          {/* Barra de progresso animada (decorativa) */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-white/40 w-full">
            <div className="h-full bg-white animate-[progress_3s_ease-in-out_infinite]" />
          </div>

          <div className="flex items-start gap-2">
            {/* Ícone de "traduzindo" pulsante */}
            <span className="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80 mb-0.5">
                Traduzindo agora
              </p>
              <p className="text-sm font-medium leading-snug break-words">
                {currentTranslating}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── FILA de espera ──────────────────────────────────────── */}
      {queue.length > 0 && (
        <div className="space-y-1.5">
          {queue.map((text, idx) => (
            <div
              key={idx}
              className="
                flex items-start gap-2
                p-2.5 rounded-xl
                bg-slate-100/80 dark:bg-slate-800/60
                border border-slate-200/60 dark:border-slate-700/40
                text-slate-600 dark:text-slate-300
              "
            >
              {/* Número na fila */}
              <div className="shrink-0 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-3">
                  {idx + 1}
                </span>
              </div>

              <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-slate-400 dark:text-slate-500" />

              <p className="text-xs leading-snug break-words flex-1">
                {text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VLibrasQueue;
