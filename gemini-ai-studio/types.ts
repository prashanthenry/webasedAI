
export enum AiTool {
  TEXT_GENERATION = 'Text Generation',
  CHAT = 'Chat',
  IMAGE_GENERATION = 'Image Generation',
  SEARCH_GROUNDING = 'Search Grounding',
  VISION = 'Vision',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

// For @google/genai specific types, we'll import them directly in services or components
// This file is for app-specific shared types.
