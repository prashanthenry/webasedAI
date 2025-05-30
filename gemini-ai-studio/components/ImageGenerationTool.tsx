
import React, { useState, useCallback } from 'react';
import { generateImages } from '../services/geminiService';
import Button from './common/Button';
import Input from './common/Input';
import Spinner from './common/Spinner';
import Alert from './common/Alert';
import ToolHeader from './common/ToolHeader';
import PhotoIcon from './icons/PhotoIcon';

const ImageGenerationTool: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [generatedImages, setGeneratedImages] = useState<{ base64: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImages = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Prompt cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const result = await generateImages(prompt, numberOfImages);
      if (result.error) {
        setError(result.error);
      } else {
        setGeneratedImages(result.images);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to generate images.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, numberOfImages]);

  return (
    <div className="space-y-6">
      <ToolHeader 
        title="Image Generation"
        description="Create unique images from your text descriptions using advanced AI models."
        icon={<PhotoIcon className="w-8 h-8" />}
      />

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}

      <form onSubmit={(e) => { e.preventDefault(); handleGenerateImages(); }} className="space-y-4 p-6 bg-gray-800 rounded-lg shadow">
        <TextArea
          label="Image Prompt"
          id="image-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A futuristic cityscape at sunset, synthwave style"
          rows={3}
          className="bg-gray-700 border-gray-600"
          disabled={isLoading}
        />
        <div>
          <Input
            label="Number of Images (1-4)"
            id="num-images"
            type="number"
            value={numberOfImages}
            onChange={(e) => setNumberOfImages(Math.max(1, Math.min(parseInt(e.target.value,10) || 1, 4)))}
            min="1"
            max="4" // Typical API limit
            className="bg-gray-700 border-gray-600 w-32"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" isLoading={isLoading} disabled={isLoading || !prompt.trim()}>
          Generate Images
        </Button>
      </form>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {generatedImages.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-200 mb-4">Generated Images:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {generatedImages.map((img, index) => (
              <div key={index} className="bg-gray-800 p-2 rounded-lg shadow">
                <img
                  src={`data:image/png;base64,${img.base64}`}
                  alt={`Generated image ${index + 1} for prompt: ${prompt}`}
                  className="w-full h-auto rounded object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Need to add TextArea to imports if not already there
import TextArea from './common/TextArea'; 
export default ImageGenerationTool;
