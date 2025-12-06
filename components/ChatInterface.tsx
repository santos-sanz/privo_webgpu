import React, { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { ChatMessage, AIModel } from '../types';
import { aiWorker } from '../services/workerService';

interface ChatInterfaceProps {
  model: AIModel;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ model }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: `Hello! I am running locally using ${model.name}. How can I help you?`, timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleWorkerMessage = (msg: any) => {
      if (msg.type === 'output') {
        if (msg.data.partial) {
             // Not implemented perfectly for this demo, usually partial replaces the last token.
             // Transformers.js stream callback often sends chunks.
             // We will handle 'final' mostly for stability in this demo, 
             // but if we were streaming, we'd append to the last assistant message.
        } else if (msg.data.final) {
             setMessages(prev => {
                // Replace the temporary loading message or append
                const newHistory = [...prev];
                const lastMsg = newHistory[newHistory.length - 1];
                if (lastMsg.role === 'assistant') {
                    // Update the last message
                    // Clean up the output if it repeats the prompt (common in raw GPT2)
                    let cleanText = msg.data.final;
                    // Simple cleanup logic: remove user prompt if included
                    const lastUserMsg = prev[prev.length - 2];
                    if (lastUserMsg && cleanText.startsWith(lastUserMsg.content)) {
                        cleanText = cleanText.substring(lastUserMsg.content.length);
                    }
                    lastMsg.content = cleanText.trim();
                }
                return newHistory;
             });
             setIsGenerating(false);
        }
      } else if (msg.type === 'error') {
        setIsGenerating(false);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Error: ${msg.data}`,
            timestamp: Date.now()
        }]);
      }
    };

    const unsubscribe = aiWorker.subscribe(handleWorkerMessage);
    return () => unsubscribe();
  }, []);

  const sendMessage = () => {
    if (!input.trim() || isGenerating) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    // Add placeholder for assistant
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Thinking...', timestamp: Date.now() }]);

    aiWorker.postMessage({
      type: 'chat',
      model: model.repo,
      messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[80%] rounded-2xl px-5 py-3 shadow-sm
              ${msg.role === 'user' 
                ? 'bg-primary text-white rounded-br-none' 
                : 'bg-surface text-gray-200 rounded-bl-none border border-gray-700'}
            `}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-surface border-t border-gray-700">
        <div className="flex items-center gap-2 bg-background p-2 rounded-xl border border-gray-700 focus-within:border-primary transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500"
            disabled={isGenerating}
          />
          <button
            onClick={sendMessage}
            disabled={isGenerating || !input.trim()}
            className={`p-2 rounded-lg ${isGenerating || !input.trim() ? 'text-gray-600' : 'text-primary hover:bg-gray-800'}`}
          >
            {isGenerating ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <PaperAirplaneIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
