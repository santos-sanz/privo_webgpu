import React, { useState, useEffect } from 'react';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { aiWorker } from '../services/workerService';
import { AIModel } from '../types';
import { LANGUAGES } from '../constants';

interface TranslatorInterfaceProps {
  model: AIModel;
}

const TranslatorInterface: React.FC<TranslatorInterfaceProps> = ({ model }) => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [sourceLang, setSourceLang] = useState('eng_Latn');
  const [targetLang, setTargetLang] = useState('spa_Latn');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const handler = (msg: any) => {
      if (msg.type === 'output' && msg.data.text) {
        setOutputText(msg.data.text);
        setIsTranslating(false);
      }
    };
    const unsub = aiWorker.subscribe(handler);
    return () => unsub();
  }, []);

  const handleTranslate = () => {
    if (!inputText) return;
    setIsTranslating(true);
    aiWorker.postMessage({
      type: 'translate',
      model: model.repo,
      text: inputText,
      src_lang: sourceLang,
      tgt_lang: targetLang
    });
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-5xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-6 text-white">Neural Translate</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 mb-4">
        <select 
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          className="bg-surface border border-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>

        <div className="flex items-center justify-center">
            <ArrowsRightLeftIcon className="w-6 h-6 text-gray-500" />
        </div>

        <select 
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-surface border border-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to translate..."
          className="w-full h-full p-4 bg-surface border border-gray-700 rounded-2xl resize-none focus:border-primary focus:outline-none text-white text-lg placeholder-gray-500"
        />
        
        <div className="relative w-full h-full">
          <textarea
            readOnly
            value={outputText}
            placeholder="Translation will appear here..."
            className="w-full h-full p-4 bg-gray-900/50 border border-gray-700 rounded-2xl resize-none focus:outline-none text-white text-lg placeholder-gray-600"
          />
          {isTranslating && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
              <span className="text-primary font-medium animate-pulse">Translating...</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleTranslate}
          disabled={isTranslating || !inputText}
          className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
        >
          Translate
        </button>
      </div>
    </div>
  );
};

export default TranslatorInterface;