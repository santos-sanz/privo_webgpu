import React from 'react';
import { 
  MicrophoneIcon, 
  ChatBubbleLeftRightIcon, 
  LanguageIcon, 
  CpuChipIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'chat', label: 'Local LLM Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'speech', label: 'Voice to Text', icon: MicrophoneIcon },
    { id: 'translate', label: 'Translator', icon: LanguageIcon },
    { id: 'models', label: 'Model Manager', icon: CpuChipIcon },
  ];

  return (
    <div className="w-20 md:w-64 h-full bg-surface border-r border-gray-700 flex flex-col shrink-0">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-gray-700">
        <Square3Stack3DIcon className="w-8 h-8 text-primary" />
        <span className="ml-3 font-bold text-xl hidden md:block tracking-wide">
          Neural<span className="text-primary">Local</span>
        </span>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-2 px-2 md:px-4">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                flex items-center justify-center md:justify-start px-3 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}
              `}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="ml-3 font-medium hidden md:block">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 text-xs text-gray-500 text-center md:text-left border-t border-gray-700">
        <p className="hidden md:block">Running via WebGPU</p>
        <p className="hidden md:block opacity-60 mt-1">v1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;
