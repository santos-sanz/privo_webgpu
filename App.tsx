import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import SpeechInterface from './components/SpeechInterface';
import TranslatorInterface from './components/TranslatorInterface';
import { AVAILABLE_MODELS } from './constants';
import { AIModel, ModelType } from './types';
import { aiWorker } from './services/workerService';
import { CloudArrowDownIcon, CheckCircleIcon, ExclamationTriangleIcon, PlusIcon } from '@heroicons/react/24/solid';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [models, setModels] = useState<AIModel[]>(AVAILABLE_MODELS);
  const [loadingModelId, setLoadingModelId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Custom Model State
  const [customRepo, setCustomRepo] = useState('');
  
  // Selected models for each task
  const [selectedLLM, setSelectedLLM] = useState<string>(AVAILABLE_MODELS.find(m => m.type === ModelType.TEXT_GENERATION)?.id || '');
  const [selectedASR, setSelectedASR] = useState<string>(AVAILABLE_MODELS.find(m => m.type === ModelType.ASR)?.id || '');
  const [selectedTrans, setSelectedTrans] = useState<string>(AVAILABLE_MODELS.find(m => m.type === ModelType.TRANSLATION)?.id || '');

  useEffect(() => {
    const handleMessage = (msg: any) => {
      if (msg.type === 'status') {
        setStatusMessage(msg.data.message);
      } else if (msg.type === 'download_progress') {
        setDownloadProgress(msg.data.progress);
        setLoadingModelId(msg.data.modelId);
      } else if (msg.type === 'init_done') {
        setModels(prev => prev.map(m => m.repo === msg.data.model ? { ...m, loaded: true } : m));
        setLoadingModelId(null);
        setDownloadProgress(0);
        setStatusMessage('');
      } else if (msg.type === 'error') {
        alert(`Error: ${msg.data}`);
        setLoadingModelId(null);
      }
    };

    const unsubscribe = aiWorker.subscribe(handleMessage);
    return () => unsubscribe();
  }, []);

  const loadModel = (model: AIModel) => {
    if (loadingModelId) return;
    setLoadingModelId(model.repo);
    aiWorker.postMessage({ type: 'load', model: model.repo });
  };

  const handleAddCustomModel = () => {
    if (!customRepo.trim()) return;
    
    const repoId = customRepo.trim();
    if (models.some(m => m.repo === repoId)) {
        alert("Model already in the list!");
        return;
    }

    const newModel: AIModel = {
      id: repoId,
      name: repoId.split('/').pop() || repoId,
      type: ModelType.TEXT_GENERATION, // Defaulting to LLM/Text Gen
      repo: repoId,
      description: 'Custom added model from Hugging Face',
      size: 'Unknown',
      loaded: false,
    };

    setModels(prev => [...prev, newModel]);
    setCustomRepo('');
    
    // Automatically select it for chat if it's an LLM
    setSelectedLLM(newModel.id);
  };

  const getActiveModel = () => {
    if (activeTab === 'chat') return models.find(m => m.id === selectedLLM);
    if (activeTab === 'speech') return models.find(m => m.id === selectedASR);
    if (activeTab === 'translate') return models.find(m => m.id === selectedTrans);
    return null;
  };

  const currentModel = getActiveModel();

  // WebGPU Check
  const [hasWebGPU, setHasWebGPU] = useState<boolean | null>(null);
  useEffect(() => {
      if ('gpu' in navigator) {
          // @ts-ignore
          navigator.gpu.requestAdapter().then(adapter => {
              setHasWebGPU(!!adapter);
          }).catch(() => setHasWebGPU(false));
      } else {
          setHasWebGPU(false);
      }
  }, []);

  const renderContent = () => {
    if (activeTab === 'models') {
      return (
        <div className="p-8 max-w-6xl mx-auto w-full pb-20">
          <h2 className="text-3xl font-bold mb-8 text-white">Model Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {models.map(model => (
              <div key={model.id} className="bg-surface border border-gray-700 rounded-2xl p-6 flex flex-col justify-between hover:border-gray-500 transition-colors shadow-lg">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white truncate pr-2" title={model.name}>{model.name}</h3>
                    <span className="shrink-0 text-xs font-mono bg-gray-900 px-2 py-1 rounded text-gray-400">{model.size}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{model.description}</p>
                  <div className="flex items-center gap-2 mb-4">
                     <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                         model.type === ModelType.ASR ? 'bg-blue-900 text-blue-300' :
                         model.type === ModelType.TRANSLATION ? 'bg-purple-900 text-purple-300' :
                         'bg-orange-900 text-orange-300'
                     }`}>
                        {model.type.replace('_', ' ')}
                     </span>
                     <div className="text-xs text-gray-500 font-mono truncate">{model.repo}</div>
                  </div>
                </div>
                
                <div>
                  {model.loaded ? (
                    <button disabled className="w-full flex items-center justify-center gap-2 bg-green-900/20 text-green-400 py-2 rounded-lg border border-green-900/30 cursor-default">
                      <CheckCircleIcon className="w-5 h-5" />
                      Loaded & Ready
                    </button>
                  ) : (
                    loadingModelId === model.repo ? (
                       <div className="w-full bg-gray-900 rounded-lg h-10 relative overflow-hidden flex items-center justify-center border border-gray-700">
                          <div 
                            className="absolute left-0 top-0 h-full bg-primary/20 transition-all duration-300" 
                            style={{width: `${downloadProgress}%`}}
                          />
                          <span className="relative z-10 text-xs text-white font-mono animate-pulse">
                            Downloading: {Math.round(downloadProgress)}%
                          </span>
                       </div>
                    ) : (
                        <button 
                            onClick={() => loadModel(model)}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-2 rounded-lg transition-all shadow-md shadow-primary/20"
                        >
                            <CloudArrowDownIcon className="w-5 h-5" />
                            Download & Load
                        </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-8 bg-surface/50 rounded-2xl border border-dashed border-gray-700 text-center max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-3">Add Custom LLM from Hugging Face</h3>
            <p className="text-gray-400 text-sm mb-6">
              Enter the Hugging Face repository ID of a <strong>Transformers.js compatible</strong> model (ONNX).
              <br/>
              <span className="opacity-60">Examples: </span>
              <code className="bg-gray-800 px-1 py-0.5 rounded text-accent mx-1 text-xs">Xenova/phi-2</code> 
              <span className="opacity-60">or</span>
              <code className="bg-gray-800 px-1 py-0.5 rounded text-accent mx-1 text-xs">Xenova/Qwen1.5-0.5B-Chat</code>
            </p>
            <div className="flex gap-3 max-w-lg mx-auto relative">
               <input 
                 type="text" 
                 value={customRepo}
                 onChange={(e) => setCustomRepo(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleAddCustomModel()}
                 placeholder="e.g. Xenova/phi-2" 
                 className="flex-1 bg-background border border-gray-700 rounded-xl px-5 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-gray-600" 
               />
               <button 
                 onClick={handleAddCustomModel}
                 disabled={!customRepo.trim()}
                 className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
               >
                 <PlusIcon className="w-5 h-5" />
                 Add Model
               </button>
            </div>
            <p className="text-xs text-gray-600 mt-4">
                Note: The model must have ONNX weights available in the repo. Large models may crash the browser tab.
            </p>
          </div>
        </div>
      );
    }

    // Checking if necessary models are loaded for other tabs
    if (!currentModel) return <div className="p-10 text-white">No model selected for this task. Go to Models tab.</div>;

    if (!currentModel.loaded) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-6 text-center p-8">
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center animate-pulse">
                <CloudArrowDownIcon className="w-12 h-12 text-primary" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Model Required</h2>
                <p className="text-gray-400 max-w-md">
                    To use this feature, you need to download the 
                    <span className="text-primary font-mono mx-1 bg-surface px-1 rounded">{currentModel.name}</span> 
                    model locally.
                </p>
            </div>
            
            {loadingModelId === currentModel.repo ? (
                <div className="w-64">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Downloading...</span>
                        <span>{Math.round(downloadProgress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{width: `${downloadProgress}%`}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center h-4">{statusMessage}</p>
                </div>
            ) : (
                <button 
                    onClick={() => loadModel(currentModel)}
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <CloudArrowDownIcon className="w-5 h-5" />
                    Download Model ({currentModel.size})
                </button>
            )}
        </div>
      );
    }

    if (activeTab === 'chat') return <ChatInterface model={currentModel} />;
    if (activeTab === 'speech') return <SpeechInterface model={currentModel} />;
    if (activeTab === 'translate') return <TranslatorInterface model={currentModel} />;
    
    return null;
  };

  return (
    <div className="flex h-screen w-screen bg-background text-white font-sans selection:bg-primary/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Status Bar */}
        <header className="h-16 border-b border-gray-700 flex items-center justify-between px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-lg capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            {loadingModelId && (
                <div className="text-accent animate-pulse flex items-center gap-1">
                    <CloudArrowDownIcon className="w-3 h-3" />
                    Downloading...
                </div>
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${hasWebGPU ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-yellow-900/20 text-yellow-500 border-yellow-900/50'}`}>
              {hasWebGPU ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <ExclamationTriangleIcon className="w-3.5 h-3.5" />}
              {hasWebGPU ? 'WebGPU Ready' : 'WebGPU Unavailable'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto relative scroll-smooth">
           {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;