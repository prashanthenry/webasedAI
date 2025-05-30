
import React from 'react';

const ApiKeyChecker: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white p-4">
      <div className="p-8 bg-gray-800 rounded-lg shadow-xl text-center max-w-md w-full">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-red-500 mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <h1 className="text-2xl font-bold mb-4 text-red-400">API Key Not Configured</h1>
        <p className="mb-2 text-gray-300">The Google Gemini API key is missing.</p>
        <p className="text-gray-300">
          Please ensure the <code className="bg-gray-700 px-2 py-1 rounded text-yellow-400 text-sm">API_KEY</code> environment variable is set in your environment.
        </p>
        <p className="mt-6 text-sm text-gray-500">
          This application requires a valid API key to interact with Google's Gemini API.
          Refer to the Gemini API documentation for instructions on obtaining and setting up your API key.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyChecker;
