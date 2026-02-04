export interface TranscriptLine {
  id: string;
  text: string;
  isFinal: boolean;
  timestamp: Date;
  source: 'user' | 'model';
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface AudioStreamConfig {
  sampleRate: number;
}
