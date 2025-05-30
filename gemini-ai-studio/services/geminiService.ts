
import { GoogleGenAI, Chat, GenerateContentResponse, Part, GenerateContentStreamResult, HarmCategory, HarmBlockThreshold, GroundingAttribution } from "@google/genai";
import { TEXT_MODEL_NAME, IMAGE_MODEL_NAME } from '../constants';
import { GroundingSource } from "../types";

const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI | null = null;
let activeChat: Chat | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error("Gemini API Key not found. Please set the API_KEY environment variable.");
}

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export const generateText = async (
  prompt: string,
  useStreaming: boolean,
  onStreamChunk?: (chunk: string) => void,
  onStreamEnd?: () => void,
  onStreamError?: (error: Error) => void
): Promise<string> => {
  if (!ai) throw new Error("Gemini API client not initialized. Check API_KEY.");

  if (useStreaming) {
    try {
      const streamResult: GenerateContentStreamResult = await ai.models.generateContentStream({
        model: TEXT_MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        safetySettings,
      });
      
      let fullText = "";
      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          if (onStreamChunk) onStreamChunk(chunkText);
        }
      }
      if (streamResult.response) { // Access the aggregated response after stream is done
         const finalResponse = await streamResult.response;
         // console.log("Stream final response:", finalResponse.text); // You can log or use this
      }

      if (onStreamEnd) onStreamEnd();
      return fullText; // Return aggregated text
    } catch (error) {
      console.error("Streaming Error:", error);
      if (onStreamError) onStreamError(error as Error);
      throw error;
    }
  } else {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
    });
    return response.text;
  }
};


export const initializeChat = (): Chat => {
  if (!ai) throw new Error("Gemini API client not initialized. Check API_KEY.");
  activeChat = ai.chats.create({
    model: TEXT_MODEL_NAME,
    history: [], // Start with empty history or provide existing
    safetySettings,
    // config: { systemInstruction: "You are a helpful AI assistant."} // Optional system instruction
  });
  return activeChat;
};

export const sendMessageInChat = async (
  chatInstance: Chat, // Use the passed chatInstance
  message: string,
  useStreaming: boolean,
  onStreamChunk?: (chunk: string) => void,
  onStreamEnd?: () => void,
  onStreamError?: (error: Error) => void
): Promise<string> => {
  if (!ai) throw new Error("Gemini API client not initialized. Check API_KEY.");
  if (!chatInstance) throw new Error("Chat not initialized. Call initializeChat first.");

  const content: Part[] = [{ text: message }];

  if (useStreaming) {
    try {
      const streamResult: GenerateContentStreamResult = await chatInstance.sendMessageStream({ parts: content });
      let fullText = "";
      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          if (onStreamChunk) onStreamChunk(chunkText);
        }
      }
      if (streamResult.response) {
        // const finalResponse = await streamResult.response;
        // console.log("Chat Stream final response:", finalResponse.text);
      }
      if (onStreamEnd) onStreamEnd();
      return fullText;
    } catch (error) {
      console.error("Chat Streaming Error:", error);
      if (onStreamError) onStreamError(error as Error);
      throw error;
    }
  } else {
    const response: GenerateContentResponse = await chatInstance.sendMessage({ parts: content });
    return response.text;
  }
};


export const generateImages = async (
  prompt: string,
  numberOfImages: number = 1
): Promise<{ images: { base64: string }[], error?: string }> => {
  if (!ai) return { images: [], error: "Gemini API client not initialized. Check API_KEY." };

  try {
    const response = await ai.models.generateImages({
      model: IMAGE_MODEL_NAME,
      prompt: prompt,
      config: { 
        numberOfImages: Math.max(1, Math.min(numberOfImages, 4)), // API typically supports 1-4
        outputMimeType: 'image/png' // or image/jpeg
      },
    });
    
    const base64Images = response.generatedImages.map(img => ({
      base64: img.image.imageBytes // This is already a base64 string
    }));
    
    return { images: base64Images };

  } catch (error) {
    console.error("Image Generation Error:", error);
    return { images: [], error: (error as Error).message || "Failed to generate images." };
  }
};

export const generateTextWithSearch = async (
  query: string
): Promise<{ text: string; sources: GroundingSource[]; error?: string }> => {
  if (!ai) return { text: "", sources: [], error: "Gemini API client not initialized. Check API_KEY." };
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: query }] }],
      config: {
        tools: [{ googleSearch: {} }],
      },
      safetySettings,
    });

    const text = response.text;
    let sources: GroundingSource[] = [];

    // The prompt says: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    // The SDK might use `groundingAttributions`. Let's try to support both or prefer SDK.
    // Actual SDK path for grounding: response.candidates[0].groundingMetadata.groundingAttributions
    const attributions = response.candidates?.[0]?.groundingMetadata?.groundingAttributions;
    if (attributions && Array.isArray(attributions)) {
       sources = attributions.reduce<GroundingSource[]>((acc, attr: GroundingAttribution) => {
        if (attr.web && attr.web.uri && attr.web.title) {
          acc.push({ uri: attr.web.uri, title: attr.web.title });
        }
        return acc;
      }, []);
    }


    return { text, sources };
  } catch (error) {
    console.error("Search Grounding Error:", error);
    return { text: "", sources: [], error: (error as Error).message || "Failed to generate text with search." };
  }
};

export const generateTextFromImageAndPrompt = async (
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<{ text: string; error?: string }> => {
  if (!ai) return { text: "", error: "Gemini API client not initialized. Check API_KEY." };

  try {
    const imagePart: Part = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };
    const textPart: Part = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL_NAME, // Vision capabilities are usually in general models
      contents: [{ role: "user", parts: [imagePart, textPart] }],
      safetySettings,
    });
    
    return { text: response.text };
  } catch (error) {
    console.error("Vision API Error:", error);
    return { text: "", error: (error as Error).message || "Failed to process image and prompt." };
  }
};

// Helper to convert file to base64 - used by VisionTool component
export const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:mime/type;base64,ActualBase64String"
      const [meta, data] = result.split(',');
      if (!meta || !data) {
        reject(new Error("Invalid file format for base64 conversion"));
        return;
      }
      const mimeType = meta.substring(meta.indexOf(':') + 1, meta.indexOf(';'));
      resolve({ base64: data, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};

