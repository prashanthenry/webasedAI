
import React from 'react';
import { AiTool } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import PhotoIcon from './icons/PhotoIcon';
import MagnifyingGlassIcon from './icons/MagnifyingGlassIcon';
import EyeIcon from './icons/EyeIcon';


interface NavbarProps {
  selectedTool: AiTool;
  onSelectTool: (tool: AiTool) => void;
}

const toolIcons: Record<AiTool, React.ReactElement> = {
  [AiTool.TEXT_GENERATION]: <SparklesIcon className="w-5 h-5 mr-3" />,
  [AiTool.CHAT]: <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3" />,
  [AiTool.IMAGE_GENERATION]: <PhotoIcon className="w-5 h-5 mr-3" />,
  [AiTool.SEARCH_GROUNDING]: <MagnifyingGlassIcon className="w-5 h-5 mr-3" />,
  [AiTool.VISION]: <EyeIcon className="w-5 h-5 mr-3" />,
};

const Navbar: React.FC<NavbarProps> = ({ selectedTool, onSelectTool }) => {
  const tools = Object.values(AiTool);

  return (
    <nav className="w-64 bg-gray-800 p-4 space-y-2 shadow-lg flex-shrink-0 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold text-gray-200 mb-6 px-2">Gemini Studio</h2>
      {tools.map((tool) => (
        <button
          key={tool}
          onClick={() => onSelectTool(tool)}
          className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors duration-150 ease-in-out
            ${selectedTool === tool 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
        >
          {toolIcons[tool]}
          {tool}
        </button>
      ))}
      <div className="pt-8 mt-auto text-center">
        <p className="text-xs text-gray-500">&copy; 2024 AI Tool Suite</p>
      </div>
    </nav>
  );
};

export default Navbar;
