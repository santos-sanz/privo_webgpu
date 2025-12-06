import { AIModel, ModelType } from './types';

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'Xenova/whisper-tiny.en',
    name: 'Whisper Tiny (English)',
    type: ModelType.ASR,
    repo: 'Xenova/whisper-tiny.en',
    description: 'Fast, lightweight speech-to-text model optimized for English.',
    size: '~40MB',
    loaded: false,
  },
  {
    id: 'Xenova/LaMini-Flan-T5-248M',
    name: 'LaMini T5 (Small LLM)',
    type: ModelType.TEXT_GENERATION,
    repo: 'Xenova/LaMini-Flan-T5-248M',
    description: 'A small instruction-tuned model capable of general tasks.',
    size: '~900MB',
    loaded: false,
  },
  {
    id: 'Xenova/nllb-200-distilled-600M',
    name: 'NLLB 200 (Translator)',
    type: ModelType.TRANSLATION,
    repo: 'Xenova/nllb-200-distilled-600M',
    description: 'No Language Left Behind. High quality translation.',
    size: '~1.2GB',
    loaded: false,
  },
  {
    id: 'Xenova/gpt2',
    name: 'GPT-2 Small',
    type: ModelType.TEXT_GENERATION,
    repo: 'Xenova/gpt2',
    description: 'Classic small language model. Very fast, basic capabilities.',
    size: '~500MB',
    loaded: false,
  }
];

export const LANGUAGES = [
  { code: 'eng_Latn', name: 'English' },
  { code: 'spa_Latn', name: 'Spanish' },
  { code: 'fra_Latn', name: 'French' },
  { code: 'deu_Latn', name: 'German' },
  { code: 'ita_Latn', name: 'Italian' },
  { code: 'jpn_Jpan', name: 'Japanese' },
  { code: 'zho_Hans', name: 'Chinese (Simplified)' },
];
