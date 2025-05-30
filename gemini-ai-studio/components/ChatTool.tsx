
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeChat, sendMessageInChat } from '../services/geminiService';
import { ChatMessage } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Spinner from './common/Spinner';
import Alert from './common/Alert';
import ToolHeader from './common/ToolHeader';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import { Chat } from '@google/genai'; // Import Chat type

const ChatTool: React.FC = () => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [useStreaming, setUseStreaming] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const newChat = initializeChat();
      setChatSession(newChat);
      setMessages([
        { id: 'initial', role: 'model', text: "Hello! I'm your AI assistant. How can I help you today?", timestamp: new Date() }
      ]);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim() || !chatSession) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      role: 'user',
      text: currentMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);
    setError(null);

    const modelMessageId = Date.now().toString() + '-model';
    // Add a temporary loading message for the model's response
    if (useStreaming) {
         setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', timestamp: new Date(), isLoading: true }]);
    }


    try {
      let accumulatedStreamedText = "";
      await sendMessageInChat(
        chatSession,
        currentMessage,
        useStreaming,
        (chunk) => { // onStreamChunk
          accumulatedStreamedText += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, text: accumulatedStreamedText, isLoading: true } : msg
          ));
        },
        () => { // onStreamEnd
          setIsLoading(false);
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, text: accumulatedStreamedText, isLoading: false } : msg
          ));
        },
        (err) => { // onStreamError
          setError(err.message || "An error occurred during streaming.");
          setIsLoading(false);
           setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, text: "Error receiving response.", isLoading: false } : msg
          ));
        }
      );
      
      if (!useStreaming) {
        const responseText = await sendMessageInChat(chatSession, userMessage.text, false);
        const modelResponse: ChatMessage = {
            id: modelMessageId,
            role: 'model',
            text: responseText,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, modelResponse]);
        setIsLoading(false);
      }

    } catch (err) {
      setError((err as Error).message || "Failed to send message.");
      setIsLoading(false);
      // Remove or update loading message on error if not streaming
       if (!useStreaming) {
           setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: "Error: Could not get response.", timestamp: new Date() }]);
       } else {
            setMessages(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, text: "Error: Could not get response.", isLoading: false } : msg
            ));
       }
    }
  }, [currentMessage, chatSession, useStreaming]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]"> {/* Adjust height as needed */}
      <ToolHeader 
        title="AI Chat"
        description="Engage in dynamic conversations with the AI. Supports one-shot and streaming responses for a more interactive experience."
        icon={<ChatBubbleLeftRightIcon className="w-8 h-8" />}
      />

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}

      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-800 rounded-md mb-4 shadow">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl px-4 py-2 rounded-lg shadow ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
              {msg.isLoading && <Spinner size="sm" color="text-gray-400 mt-1" />}
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-auto p-1 bg-gray-800 rounded-md shadow">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-grow bg-gray-700 border-gray-600"
            disabled={isLoading || !chatSession}
          />
          <Button onClick={handleSendMessage} isLoading={isLoading} disabled={isLoading || !currentMessage.trim() || !chatSession}>
            Send
          </Button>
        </div>
         <div className="flex items-center mt-2 mb-1 ml-1">
            <input
              id="chat-streaming-checkbox"
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 bg-gray-700"
              disabled={isLoading}
            />
            <label htmlFor="chat-streaming-checkbox" className="ml-2 block text-sm text-gray-300">
              Use Streaming
            </label>
          </div>
      </div>
    </div>
  );
};

export default ChatTool;
