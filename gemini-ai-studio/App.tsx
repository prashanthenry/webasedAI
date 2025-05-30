
import React, { useState, useEffect } from 'react';
import { AiTool } from './types';
import Navbar from './components/Navbar';
import TextInputTool from './components/TextInputTool';
import ChatTool from './components/ChatTool';
import ImageGenerationTool from './components/ImageGenerationTool';
import SearchGroundingTool from './components/SearchGroundingTool';
import VisionTool from './components/VisionTool';
import ApiKeyChecker from './components/common/ApiKeyChecker';

const App: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<AiTool>(AiTool.TEXT_GENERATION);
  const [apiKeyIsSet, setApiKeyIsSet] = useState<boolean | null>(null); // null initially, then true/false

  useEffect(() => {
    // Vite exposes env vars via import.meta.env, CRA via process.env
    // Standard Node.js is process.env
    // Assuming process.env for this context as per instructions
    const key = process.env.API_KEY;
    if (key && key.trim() !== '') {
      setApiKeyIsSet(true);
    } else {
      setApiKeyIsSet(false);
    }
  }, []);

  if (apiKeyIsSet === null) {
    // Still checking for API key
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  if (!apiKeyIsSet) {
    return <ApiKeyChecker />;
  }

  const renderTool = () => {
    switch (selectedTool) {
      case AiTool.TEXT_GENERATION:
        return <TextInputTool />;
      case AiTool.CHAT:
        return <ChatTool />;
      case AiTool.IMAGE_GENERATION:
        return <ImageGenerationTool />;
      case AiTool.SEARCH_GROUNDING:
        return <SearchGroundingTool />;
      case AiTool.VISION:
        return <VisionTool />;
      default:
        return <TextInputTool />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      <Navbar selectedTool={selectedTool} onSelectTool={setSelectedTool} />
      <main className="flex-1 p-6 sm:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {renderTool()}
        </div>
      </main>
    </div>
  );
};

export default App;
