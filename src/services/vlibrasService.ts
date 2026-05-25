// ─────────────────────────────────────────────────────────────────────────────
// VLibras Service — adaptado ao modelo do Traduz Libras Simultâneo
//
// Mudanças em relação à versão anterior:
//  • Expõe callbacks onTranslating / onQueueChange / onIdle para que a UI
//    possa mostrar qual texto está sendo traduzido (em destaque) e a fila.
//  • Remove a estimativa de tempo baseada em caracteres; usa agora um
//    MutationObserver para detectar quando a animação do VLibras termina
//    (classe vpw-stopped no [vp-controls]), com fallback de timeout.
//  • Método setCallbacks() permite registrar/atualizar os callbacks a qualquer
//    momento (útil porque o React pode montar/remontar componentes).
// ─────────────────────────────────────────────────────────────────────────────

export type VLibrasCallbacks = {
  /** Chamado quando um texto começa a ser traduzido */
  onTranslating?: (text: string) => void;
  /** Chamado toda vez que a fila de espera muda (já exclui o item atual) */
  onQueueChange?: (queue: string[]) => void;
  /** Chamado quando a fila esvazia e não há tradução em andamento */
  onIdle?: () => void;
};

class VLibrasService {
  private queue: string[] = [];
  private isProcessing = false;
  private callbacks: VLibrasCallbacks = {};

  // ── API pública ────────────────────────────────────────────────────────────

  /** Registra (ou atualiza) os callbacks de estado */
  public setCallbacks(callbacks: VLibrasCallbacks) {
    this.callbacks = callbacks;
  }

  /** Enfileira um texto para ser traduzido */
  public translate(text: string) {
    if (!text || !text.trim()) return;

    this.queue.push(text.trim());
    this.callbacks.onQueueChange?.([...this.queue]);

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /** Limpa a fila e interrompe qualquer tradução em andamento */
  public clearQueue() {
    this.queue = [];
    this.callbacks.onQueueChange?.([]);
    this.callbacks.onIdle?.();
  }

  // ── Processamento da fila ──────────────────────────────────────────────────

  private async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const text = this.queue.shift()!;

      // Notifica UI: texto atual + fila restante
      this.callbacks.onTranslating?.(text);
      this.callbacks.onQueueChange?.([...this.queue]);

      // Envia ao VLibras e aguarda a animação terminar
      await this.sendToVLibras(text);
    }

    this.isProcessing = false;
    this.callbacks.onIdle?.();
  }

  // ── Envio ao VLibras ───────────────────────────────────────────────────────

  private sendToVLibras(text: string): Promise<void> {
    return new Promise((resolve) => {
      // ── Tentativa 1: API interna do VLibras ──────────────────────────────
      const w = window as any;
      if (w.vp && typeof w.vp.translate === 'function') {
        try {
          w.vp.translate(text);
          this.waitForAnimationEnd(text, resolve);
          return;
        } catch (e) {
          console.warn('[VLibras] API interna falhou, usando fallback DOM', e);
        }
      }

      // ── Tentativa 2: Manipulação do DOM (fallback) ───────────────────────
      const tryOpenTranslator = () => {
        const translator = document.querySelector('[vp-translator-screen]');
        if (translator && !translator.classList.contains('vp-enabled')) {
          const moreBtn = document.querySelector(
            '.vpw-more-options-button'
          ) as HTMLElement | null;
          if (moreBtn) {
            moreBtn.click();
            setTimeout(() => {
              const translatorBtn = document.querySelector(
                '.vp-translator-button'
              ) as HTMLElement | null;
              translatorBtn?.click();
            }, 300);
          }
        }
      };

      tryOpenTranslator();

      // Aguarda a interface estar pronta antes de digitar
      setTimeout(() => {
        const textarea = document.querySelector(
          '[vp-translator-screen] .vp-user-textarea'
        ) as HTMLTextAreaElement | null;
        const btn = document.querySelector(
          '[vp-translator-screen] .vp-play-gloss-button'
        ) as HTMLButtonElement | null;

        if (!textarea || !btn) {
          // Elementos não encontrados — resolve para não travar a fila
          console.warn('[VLibras] Elementos do tradutor não encontrados');
          resolve();
          return;
        }

        // Limpa o campo
        textarea.value = '';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        // Digita o texto caractere a caractere (necessário para o Vue reativo do VLibras)
        let i = 0;
        const typeWriter = () => {
          if (i < text.length) {
            textarea.value += text.charAt(i);
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            i++;
            setTimeout(typeWriter, 25);
          } else {
            // Aguarda o VLibras processar o texto e clica em Traduzir
            setTimeout(() => {
              btn.click();
              // Aguarda a animação terminar
              this.waitForAnimationEnd(text, resolve);
            }, 600);
          }
        };

        typeWriter();
      }, 500);
    });
  }

  // ── Detecção do fim da animação ────────────────────────────────────────────

  /**
   * Tenta detectar o fim da animação pelo VLibras usando MutationObserver
   * na classe do elemento [vp-controls]. Quando a classe `vpw-playing`
   * desaparece (ou `vpw-stopped` aparece), considera que terminou.
   *
   * Fallback: timeout baseado no tamanho do texto (mín 3 s, máx 20 s).
   */
  private waitForAnimationEnd(text: string, resolve: () => void) {
    // Timeout de segurança: ~200 ms/caractere, mín 3 s, máx 20 s
    const fallbackMs = Math.min(Math.max(3000, text.length * 200), 20000);

    const controls = document.querySelector('[vp-controls]');
    let resolved = false;

    const done = () => {
      if (resolved) return;
      resolved = true;
      observer?.disconnect();
      clearTimeout(timeoutId);
      // Pequena pausa antes de iniciar próxima tradução
      setTimeout(resolve, 400);
    };

    // MutationObserver — monitora mudanças de classe no [vp-controls]
    let observer: MutationObserver | null = null;
    if (controls) {
      observer = new MutationObserver(() => {
        const cl = controls.classList;
        // vpw-stopped = animação terminou/reiniciou; ausência de vpw-playing também
        if (cl.contains('vpw-stopped') || !cl.contains('vpw-playing')) {
          // Espera um tick para confirmar (evita falso-positivo no início)
          setTimeout(() => {
            if (
              controls.classList.contains('vpw-stopped') ||
              !controls.classList.contains('vpw-playing')
            ) {
              done();
            }
          }, 300);
        }
      });
      observer.observe(controls, { attributes: true, attributeFilter: ['class'] });
    }

    // Fallback de timeout
    const timeoutId = setTimeout(done, fallbackMs);
  }
}

export const vlibrasService = new VLibrasService();
