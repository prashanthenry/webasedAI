
import React from 'react';

interface ToolHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ToolHeader: React.FC<ToolHeaderProps> = ({ title, description, icon }) => {
  return (
    <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center mb-3">
        <span className="text-blue-400 mr-3">{icon}</span>
        <h1 className="text-3xl font-bold text-gray-100">{title}</h1>
      </div>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

export default ToolHeader;
