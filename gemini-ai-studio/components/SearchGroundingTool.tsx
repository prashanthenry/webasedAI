
import React, { useState, useCallback } from 'react';
import { generateTextWithSearch } from '../services/geminiService';
import { GroundingSource } from '../types';
import Button from './common/Button';
import TextArea from './common/TextArea'; // Using TextArea for potentially longer queries
import Spinner from './common/Spinner';
import Alert from './common/Alert';
import ToolHeader from './common/ToolHeader';
import MagnifyingGlassIcon from './icons/MagnifyingGlassIcon';

const SearchGroundingTool: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [resultText, setResultText] = useState<string>('');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError("Query cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResultText('');
    setSources([]);

    try {
      const result = await generateTextWithSearch(query);
      if (result.error) {
        setError(result.error);
      } else {
        setResultText(result.text);
        setSources(result.sources || []);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to perform search-grounded generation.");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  return (
    <div className="space-y-6">
      <ToolHeader 
        title="Search Grounded Generation"
        description="Get AI-generated answers grounded in up-to-date information from Google Search. Ideal for queries about recent events or facts."
        icon={<MagnifyingGlassIcon className="w-8 h-8" />}
      />

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}

      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-4 p-6 bg-gray-800 rounded-lg shadow">
        <TextArea
          label="Your Query"
          id="search-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., What were the key highlights of the latest tech conference?"
          rows={3}
          className="bg-gray-700 border-gray-600"
          disabled={isLoading}
        />
        <Button type="submit" isLoading={isLoading} disabled={isLoading || !query.trim()}>
          Generate with Search
        </Button>
      </form>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {resultText && (
        <div className="mt-6 p-4 bg-gray-800 rounded-md shadow">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Generated Answer:</h3>
          <pre className="text-gray-300 whitespace-pre-wrap break-words text-sm leading-relaxed">{resultText}</pre>
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-6 p-4 bg-gray-800 rounded-md shadow">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">Sources:</h3>
          <ul className="space-y-2">
            {sources.map((source, index) => (
              <li key={index} className="text-sm">
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline break-all"
                  title={source.uri}
                >
                  {source.title || source.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchGroundingTool;
