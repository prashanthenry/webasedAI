
import React, { useState, useCallback } from 'react';
import { generateText } from '../services/geminiService';
import Button from './common/Button';
import TextArea from './common/TextArea';
import Spinner from './common/Spinner';
import Alert from './common/Alert';
import ToolHeader from './common/ToolHeader';
import SparklesIcon from './icons/SparklesIcon';

const TextInputTool: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [useStreaming, setUseStreaming] = useState<boolean>(true);

  const handleGenerateText = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Prompt cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedText('');

    try {
      await generateText(
        prompt,
        useStreaming,
        (chunk) => { // onStreamChunk
          setGeneratedText((prev) => prev + chunk);
        },
        () => { // onStreamEnd
          setIsLoading(false);
        },
        (err) => { // onStreamError
          setError(err.message || "An error occurred during streaming.");
          setIsLoading(false);
        }
      );
      // If not streaming, generateText promise resolves with full text
      // but we set isLoading=false only onStreamEnd or error for streaming
      // For non-streaming, it's not explicitly set here, so we must ensure generateText itself handles it or we do it here
      if(!useStreaming) {
          const fullText = await generateText(prompt, false);
          setGeneratedText(fullText);
          setIsLoading(false);
      }

    } catch (err) {
      // This catch is for non-streaming errors or initial setup errors for streaming
      setError((err as Error).message || "Failed to generate text.");
      setIsLoading(false);
    }
  }, [prompt, useStreaming]);

  return (
    <div className="space-y-6">
      <ToolHeader 
        title="Text Generation"
        description="Generate creative text, summaries, translations, and more based on your prompts. Supports one-shot and streaming responses."
        icon={<SparklesIcon className="w-8 h-8" />}
      />

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}

      <form onSubmit={(e) => { e.preventDefault(); handleGenerateText(); }} className="space-y-4">
        <TextArea
          label="Your Prompt"
          id="text-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Write a short story about a robot exploring Mars."
          rows={5}
          className="bg-gray-700 border-gray-600 text-white"
          disabled={isLoading}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="streaming-checkbox"
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 bg-gray-700"
              disabled={isLoading}
            />
            <label htmlFor="streaming-checkbox" className="ml-2 block text-sm text-gray-300">
              Use Streaming
            </label>
          </div>

          <Button type="submit" isLoading={isLoading} disabled={isLoading || !prompt.trim()}>
            Generate Text
          </Button>
        </div>
      </form>

      {generatedText && (
        <div className="mt-6 p-4 bg-gray-800 rounded-md shadow">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Generated Text:</h3>
          <pre className="text-gray-300 whitespace-pre-wrap break-words text-sm leading-relaxed">{generatedText}</pre>
        </div>
      )}
    </div>
  );
};

export default TextInputTool;
