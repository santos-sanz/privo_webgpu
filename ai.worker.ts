/* eslint-disable no-restricted-globals */
import { pipeline, env, TextStreamer } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Configure transformers.js to use WebGPU if available, fallback to WASM
env.allowLocalModels = false;
env.useBrowserCache = true;

// Singleton pipelines
const pipelines = {};

// Helper to report status
const reportStatus = (status, message) => {
  self.postMessage({ type: 'status', data: { status, message } });
};

// Helper to report progress
const reportProgress = (modelId, progress) => {
    self.postMessage({ type: 'download_progress', data: { modelId, progress } });
}

// Load a model pipeline
async function loadModel(task, model) {
  if (pipelines[model]) return pipelines[model];

  reportStatus('loading', `Loading ${model}...`);
  
  try {
    const pipe = await pipeline(task, model, {
      progress_callback: (data) => {
        if (data.status === 'progress') {
            reportProgress(model, data.progress);
        }
      }
    });
    pipelines[model] = pipe;
    reportStatus('ready', `${model} loaded successfully.`);
    self.postMessage({ type: 'init_done', data: { model } });
    return pipe;
  } catch (err) {
    reportStatus('error', `Failed to load ${model}: ${err.message}`);
    throw err;
  }
}

self.addEventListener('message', async (event) => {
  const { type, model, audio, text, src_lang, tgt_lang, messages } = event.data;

  try {
    if (type === 'load') {
      let task = 'text-generation';
      if (model.includes('whisper')) task = 'automatic-speech-recognition';
      else if (model.includes('nllb') || model.includes('t5')) task = 'translation';
      
      await loadModel(task, model);
    }

    if (type === 'transcribe') {
      const pipe = await loadModel('automatic-speech-recognition', model);
      const output = await pipe(audio);
      self.postMessage({ type: 'output', data: { text: output.text } });
    }

    if (type === 'translate') {
      const pipe = await loadModel('translation', model);
      
      let result;
      if (model.includes('nllb')) {
          result = await pipe(text, { src_lang: src_lang, tgt_lang: tgt_lang });
      } else {
          result = await pipe(text);
      }

      const translation = Array.isArray(result) ? result[0].translation_text : result.translation_text;
      self.postMessage({ type: 'output', data: { text: translation } });
    }

    if (type === 'chat') {
        const pipe = await loadModel('text-generation', model);
        
        // Basic chat formatting
        const lastMessage = messages[messages.length - 1].content;
        
        // Custom streamer to send partial updates back to UI
        const streamer = new TextStreamer(pipe.tokenizer, {
            skip_prompt: true,
            skip_special_tokens: true,
            callback_function: (text) => {
                self.postMessage({ type: 'output', data: { partial: text } });
            }
        });

        const output = await pipe(lastMessage, {
            max_new_tokens: 150,
            temperature: 0.7,
            do_sample: true,
            top_k: 50,
            streamer: streamer 
        });
        
        self.postMessage({ type: 'output', data: { final: output[0].generated_text } });
    }

  } catch (error) {
    self.postMessage({ type: 'error', data: error.message });
  }
});