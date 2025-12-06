export enum ModelType {
  ASR = 'ASR', // Automatic Speech Recognition
  TRANSLATION = 'TRANSLATION',
  TEXT_GENERATION = 'TEXT_GENERATION',
}

export interface AIModel {
  id: string;
  name: string;
  type: ModelType;
  repo: string;
  description: string;
  size: string; // Approximate size
  loaded: boolean;
}

// Worker Message Types
export interface WorkerMessage {
  type: 'status' | 'output' | 'error' | 'init_done' | 'download_progress';
  data?: any;
}

export interface WorkerCommand {
  type: 'load' | 'transcribe' | 'translate' | 'chat';
  model?: string;
  text?: string;
  audio?: Float32Array;
  src_lang?: string;
  tgt_lang?: string;
  messages?: Array<{role: string, content: string}>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
