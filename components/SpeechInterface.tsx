import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';
import { aiWorker } from '../services/workerService';
import { AIModel } from '../types';

interface SpeechInterfaceProps {
  model: AIModel;
}

const SpeechInterface: React.FC<SpeechInterfaceProps> = ({ model }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const handleMessage = (msg: any) => {
      if (msg.type === 'output' && msg.data.text) {
        setTranscription(prev => (prev ? prev + ' ' + msg.data.text : msg.data.text));
        setIsProcessing(false);
      }
    };
    const unsub = aiWorker.subscribe(handleMessage);
    return () => unsub();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsProcessing(true);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = []; // reset
        
        // Convert Blob to Float32Array for Transformers.js
        const arrayBuffer = await blob.arrayBuffer();
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const audioData = audioBuffer.getChannelData(0); // Mono

        aiWorker.postMessage({
          type: 'transcribe',
          model: model.repo,
          audio: audioData
        });
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks to release mic
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Live Transcription</h2>
        <p className="text-gray-400">Using {model.name}. Speak clearly into your microphone.</p>
      </div>

      <div className="w-full max-w-3xl flex-1 bg-surface border border-gray-700 rounded-2xl p-6 shadow-inner overflow-y-auto relative">
        {transcription ? (
          <p className="text-lg leading-relaxed text-gray-200">{transcription}</p>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-600 italic">
            Transcription will appear here...
          </div>
        )}
        
        {isProcessing && (
           <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
             <div className="text-primary font-bold animate-pulse">Processing Audio...</div>
           </div>
        )}
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105
          ${isRecording ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30 animate-pulse' : 'bg-primary hover:bg-primary/90 shadow-primary/30'}
        `}
      >
        {isRecording ? (
          <StopIcon className="w-10 h-10 text-white" />
        ) : (
          <MicrophoneIcon className="w-10 h-10 text-white" />
        )}
      </button>
      <div className="text-sm text-gray-500">
        {isRecording ? 'Listening... Press to stop.' : 'Press microphone to start recording.'}
      </div>
    </div>
  );
};

export default SpeechInterface;
