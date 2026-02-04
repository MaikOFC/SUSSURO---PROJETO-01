import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob } from '../utils/audioUtils';

interface GeminiServiceCallbacks {
  onOpen: () => void;
  onClose: () => void;
  onError: (error: Error) => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onAudioData: (base64Data: string) => void;
  onVolume: (volume: number) => void;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private callbacks: GeminiServiceCallbacks;

  constructor(callbacks: GeminiServiceCallbacks) {
    this.callbacks = callbacks;
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async connect() {
    try {
      // Enhanced audio constraints for better speech recognition
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            this.callbacks.onOpen();
            this.startAudioStreaming(sessionPromise);
          },
          onmessage: (message: LiveServerMessage) => {
            this.handleMessage(message);
          },
          onclose: () => {
            this.callbacks.onClose();
            this.stopAudioStreaming();
          },
          onerror: (err: any) => {
            this.callbacks.onError(new Error(err.message || 'Unknown error'));
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: { 
            parts: [{ 
              text: 'Você é um transcritor profissional focado EXCLUSIVAMENTE em Português do Brasil (pt-BR). \n\nREGRAS ABSOLUTAS:\n1. Apenas transcreva o que for falado em Português. \n2. PROIBIDO TRADUZIR: Se o áudio estiver em inglês, espanhol ou qualquer outro idioma, IGNORE COMPLETAMENTE (não gere texto).\n3. Se houver ruído, música ou fala ininteligível, NÃO GERE SAÍDA.\n4. Não use tags de sistema como <noise>, [som], etc.\n5. A saída deve ser apenas o texto falado em Português, com pontuação correta.' 
            }] 
          },
          inputAudioTranscription: {},
        },
      });

      this.session = await sessionPromise;
    } catch (error) {
      console.error('Connection failed:', error);
      this.callbacks.onError(error instanceof Error ? error : new Error('Connection failed'));
    }
  }

  private startAudioStreaming(sessionPromise: Promise<any>) {
    if (!this.audioContext || !this.stream) return;

    this.inputSource = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate Volume (RMS)
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      this.callbacks.onVolume(Math.min(1, rms * 5)); // Boost factor for visibility

      const pcmBlob = createPcmBlob(inputData);
      
      sessionPromise.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  private stopAudioStreaming() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private handleMessage(message: LiveServerMessage) {
    const inputTranscription = message.serverContent?.inputTranscription;
    if (inputTranscription) {
      this.callbacks.onTranscript(inputTranscription.text, !!message.serverContent?.turnComplete);
    }

    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      this.callbacks.onAudioData(audioData);
    }
  }

  disconnect() {
    if (this.session) {
      try {
        // live.connect returns a promise that resolves to session.
        // session.close() is the method.
        this.session.close();
      } catch (e) {
        console.warn('Error closing session:', e);
      }
      this.session = null;
    }
    this.stopAudioStreaming();
  }
}