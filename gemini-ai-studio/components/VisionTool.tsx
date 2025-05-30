
import React, { useState, useCallback } from 'react';
import { generateTextFromImageAndPrompt, fileToBase64 } from '../services/geminiService';
import Button from './common/Button';
import TextArea from './common/TextArea';
import Input from './common/Input';
import Spinner from './common/Spinner';
import Alert from './common/Alert';
import ToolHeader from './common/ToolHeader';
import EyeIcon from './icons/EyeIcon';

const VisionTool: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // Example: Limit file size to 4MB
        setError("Image size should not exceed 4MB.");
        setPreviewUrl(null);
        setImageFile(null);
        setImageBase64(null);
        setImageMimeType(null);
        return;
      }
      setError(null);
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      try {
        const { base64, mimeType } = await fileToBase64(file);
        setImageBase64(base64);
        setImageMimeType(mimeType);
      } catch (err) {
        setError("Failed to process image file.");
        setPreviewUrl(null);
        setImageBase64(null);
        setImageMimeType(null);
      }
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() && !imageBase64) { // Prompt can be optional if image is main query
      setError("Please provide an image and/or a prompt.");
      return;
    }
    if (!imageBase64 || !imageMimeType) {
      setError("Please upload an image.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedText('');

    try {
      const result = await generateTextFromImageAndPrompt(imageBase64, imageMimeType, prompt);
      if (result.error) {
        setError(result.error);
      } else {
        setGeneratedText(result.text);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to generate text from image.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, imageBase64, imageMimeType]);

  return (
    <div className="space-y-6">
       <ToolHeader 
        title="Vision AI (Image & Text)"
        description="Analyze images and generate text based on visual content combined with your textual prompts. Upload an image and ask questions or give instructions."
        icon={<EyeIcon className="w-8 h-8" />}
      />

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}

      <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="space-y-4 p-6 bg-gray-800 rounded-lg shadow">
        <div>
          <Input
            label="Upload Image (PNG, JPEG, WEBP, max 4MB)"
            id="image-upload"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageChange}
            className="bg-gray-700 border-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            disabled={isLoading}
          />
        </div>

        {previewUrl && (
          <div className="mt-4">
            <img src={previewUrl} alt="Image preview" className="max-w-xs max-h-64 rounded-md object-contain border border-gray-600" />
          </div>
        )}

        <TextArea
          label="Your Prompt (optional if image is self-explanatory)"
          id="vision-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., What objects are in this image? Describe the scene."
          rows={3}
          className="bg-gray-700 border-gray-600"
          disabled={isLoading}
        />
        
        <Button type="submit" isLoading={isLoading} disabled={isLoading || !imageBase64}>
          Analyze and Generate
        </Button>
      </form>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {generatedText && (
        <div className="mt-6 p-4 bg-gray-800 rounded-md shadow">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Generated Description / Answer:</h3>
          <pre className="text-gray-300 whitespace-pre-wrap break-words text-sm leading-relaxed">{generatedText}</pre>
        </div>
      )}
    </div>
  );
};

export default VisionTool;
