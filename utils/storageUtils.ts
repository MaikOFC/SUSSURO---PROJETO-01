import { TranscriptLine } from '../types';

const KEYS = {
  TRANSCRIPTS: 'sussurro-transcripts',
  THEME: 'sussurro-theme',
  INPUT_MODE: 'sussurro-input-mode',
};

export const storageUtils = {
  // Transcripts
  getTranscripts: (): TranscriptLine[] => {
    try {
      const item = localStorage.getItem(KEYS.TRANSCRIPTS);
      if (item) {
        const parsed = JSON.parse(item);
        return parsed.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
          // Ensure compatibility with older saved data
          inputType: t.inputType || 'voice'
        }));
      }
    } catch (e) {
      console.warn('Falha ao carregar transcrições:', e);
    }
    return [];
  },

  saveTranscripts: (transcripts: TranscriptLine[]) => {
    try {
      localStorage.setItem(KEYS.TRANSCRIPTS, JSON.stringify(transcripts));
    } catch (e) {
      console.error('Falha ao salvar transcrições (possivelmente limite de armazenamento):', e);
    }
  },

  clearTranscripts: () => {
    localStorage.removeItem(KEYS.TRANSCRIPTS);
  },

  // Theme
  getTheme: (): 'dark' | 'light' => {
    const saved = localStorage.getItem(KEYS.THEME);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Default to dark
    return 'dark';
  },

  saveTheme: (theme: 'dark' | 'light') => {
    localStorage.setItem(KEYS.THEME, theme);
  },

  // Input Mode
  getInputMode: (): 'voice' | 'text' => {
    const saved = localStorage.getItem(KEYS.INPUT_MODE);
    if (saved === 'text') return 'text';
    return 'voice';
  },

  saveInputMode: (mode: 'voice' | 'text') => {
    localStorage.setItem(KEYS.INPUT_MODE, mode);
  }
};