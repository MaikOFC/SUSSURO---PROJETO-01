export type TranscriptionCallback = (text: string, isFinal: boolean) => void;
export type ErrorCallback = (error: Error) => void;
export type VolumeCallback = (rms: number) => void;

function estaEmPortugues(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed === '.') return false;
  const outrosAlfabetos = /[\u0400-\u04FF\u0900-\u097F\u0600-\u06FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/;
  if (outrosAlfabetos.test(trimmed)) return false;
  const apenasLetras = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (apenasLetras.length < 2) return false;
  return true;
}

function limparTexto(text: string): string {
  return text
    .trim()
    .replace(/^\.*$/, '')
    .replace(/\s+/g, ' ')
    .replace(/^[.,;:!?]+\s*/, '')
    .trim();
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

class SpeechService {
  private recognition: any = null;
  private volumeInterval: number | null = null;
  private restartTimeout: number | null = null;
  private isRunning = false;
  private isSpeaking = false;
  private mobile = false;

  // ── Controle anti-duplicação ──────────────────────────────────────
  // Guarda os últimos textos finais enviados para bloquear repetições
  private ultimosTextos: Set<string> = new Set();
  private limparUltimosTimeout: number | null = null;

  private onTranscriptionCallback?: TranscriptionCallback;
  private onErrorCallback?: ErrorCallback;
  private onVolumeChange?: VolumeCallback;

  constructor() {}

  async connect(
    onTranscription: TranscriptionCallback,
    onError: ErrorCallback,
    onVolumeChange?: VolumeCallback
  ): Promise<void> {
    this.onTranscriptionCallback = onTranscription;
    this.onErrorCallback = onError;
    this.onVolumeChange = onVolumeChange;
    this.mobile = isMobile();
    this.ultimosTextos.clear();

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error(
        'Este navegador não suporta reconhecimento de voz. Use Chrome ou Edge.'
      );
    }

    this.isRunning = true;
    this.iniciarReconhecimento(SpeechRecognition);

    if (onVolumeChange) {
      this.volumeInterval = window.setInterval(() => {
        onVolumeChange(this.isSpeaking ? 0.1 + Math.random() * 0.3 : 0);
      }, 50);
    }
  }

  private jaEnviado(texto: string): boolean {
    // Normaliza para comparação (minúsculas, sem pontuação no fim)
    const normalizado = texto.toLowerCase().replace(/[.,!?]+$/, '').trim();
    if (this.ultimosTextos.has(normalizado)) return true;

    // Registra e agenda limpeza após 4 segundos
    this.ultimosTextos.add(normalizado);
    if (this.limparUltimosTimeout) clearTimeout(this.limparUltimosTimeout);
    this.limparUltimosTimeout = window.setTimeout(() => {
      this.ultimosTextos.clear();
    }, 4000);

    return false;
  }

  private iniciarReconhecimento(SpeechRecognition: any) {
    if (!this.isRunning) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'pt-BR';
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.continuous = !this.mobile;

    this.recognition.onsoundstart = () => { this.isSpeaking = true; };
    this.recognition.onsoundend = () => { this.isSpeaking = false; };

    this.recognition.onresult = (event: any) => {
      this.isSpeaking = true;
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (interimText) {
        const texto = limparTexto(interimText);
        if (estaEmPortugues(texto)) {
          this.onTranscriptionCallback?.(texto, false);
        }
      }

      if (finalText) {
        const texto = limparTexto(finalText);
        // ── Bloqueia duplicatas antes de enviar ──
        if (texto.length > 1 && estaEmPortugues(texto) && !this.jaEnviado(texto)) {
          this.onTranscriptionCallback?.(texto, true);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      if (event.error === 'not-allowed') {
        this.onErrorCallback?.(new Error('Permissão de microfone negada.'));
        return;
      }
      this.agendarReinicio();
    };

    this.recognition.onend = () => {
      this.isSpeaking = false;
      if (this.isRunning) {
        this.agendarReinicio();
      }
    };

    try {
      this.recognition.start();
    } catch {
      this.agendarReinicio();
    }
  }

  private agendarReinicio() {
    if (!this.isRunning) return;
    if (this.restartTimeout) return;

    const delay = this.mobile ? 300 : 100;

    this.restartTimeout = window.setTimeout(() => {
      this.restartTimeout = null;
      if (this.isRunning) {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        this.iniciarReconhecimento(SpeechRecognition);
      }
    }, delay);
  }

  async disconnect() {
    this.isRunning = false;
    this.isSpeaking = false;

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.limparUltimosTimeout) {
      clearTimeout(this.limparUltimosTimeout);
      this.limparUltimosTimeout = null;
    }
    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }
    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.onerror = null;
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }

    this.ultimosTextos.clear();
    this.onVolumeChange?.(0);
  }
}

export const speechService = new SpeechService();
