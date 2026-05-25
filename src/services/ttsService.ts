export class TTSService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    const voices = this.synth.getVoices();
    // Preferência por vozes em Português do Brasil
    this.voice = voices.find(v => v.lang === 'pt-BR' || v.lang === 'pt_BR') || voices[0];
  }

  public speak(text: string) {
    if (this.synth.speaking) {
      this.synth.cancel();
    }

    if (text !== '') {
      const utterThis = new SpeechSynthesisUtterance(text);
      if (this.voice) {
        utterThis.voice = this.voice;
      }
      utterThis.pitch = 1;
      utterThis.rate = 1;
      this.synth.speak(utterThis);
    }
  }

  public stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
  }
}

export const ttsService = new TTSService();
