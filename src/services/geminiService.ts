import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";

const MODEL_NAME = "gemini-3-flash-preview";
const TTS_MODEL_NAME = "gemini-2.5-flash-preview-tts";

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getAIInstance() {
  const apiKey = API_KEYS[currentKeyIndex] || process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
}

async function executeWithFallback<T>(operation: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  let lastError: any;
  const initialIndex = currentKeyIndex;

  for (let i = 0; i < API_KEYS.length; i++) {
    const ai = getAIInstance();
    try {
      return await operation(ai);
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message?.toLowerCase() || "";
      
      // Check if it's a quota or rate limit error
      if (errorMessage.includes("quota") || errorMessage.includes("429") || errorMessage.includes("rate limit")) {
        console.warn(`API Key ${currentKeyIndex + 1} reached limit. Switching to next key...`);
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        
        // If we've circled back to the initial index, we've tried all keys
        if (currentKeyIndex === initialIndex) {
          break;
        }
        continue;
      }
      
      // For other errors, we might not want to switch keys immediately, but let's try anyway if requested
      throw error;
    }
  }
  
  throw lastError || new Error("All Gemini API keys failed or reached quota.");
}

export interface SummaryResult {
  title: string;
  summary: string;
  keySections: { title: string; content: string }[];
  links: { url: string; category: string; title: string }[];
  mainTopics: string[];
  hasProgrammingContent: boolean;
  extractedCodeSnippets: { language: string; code: string; description: string }[];
}

export async function summarizeUrl(url: string, language: string = 'English', dataSharing: boolean = true): Promise<SummaryResult> {
  return executeWithFallback(async (ai) => {
    const privacyNote = !dataSharing ? "\n[PRIVACY MODE ENABLED: Do not store or use this data for model improvement.]" : "";
    const prompt = `Analyze the web page at ${url}. ${privacyNote}
    Provide a structured response in JSON format in ${language} with the following fields:
    1. "title": A concise, descriptive title for the page or content.
    2. "summary": A concise 2-3 paragraph summary of the page content.
    3. "keySections": An array of objects with "title" and "content" for the main parts of the page.
    4. "links": An array of important hyperlinks found on the page, each with "url", "title", and a "category" (e.g., Navigation, Resource, Social, Article).
    5. "mainTopics": A list of 5-7 key topics or keywords.
    6. "hasProgrammingContent": A boolean indicating if the page contains significant programming, coding, or technical software development content.
    7. "extractedCodeSnippets": An array of objects with "language", "code", and "description" for any code examples found on the page.
    
    Ensure the response is valid JSON. The JSON keys must be in English as specified, but the values must be in ${language}.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: "application/json",
      },
    });

    try {
      return JSON.parse(response.text || '{}') as SummaryResult;
    } catch (e) {
      console.error("Failed to parse AI response", e);
      throw new Error("Failed to generate structured summary.");
    }
  });
}

export async function summarizeDocument(fileBase64: string, mimeType: string, language: string = 'English', dataSharing: boolean = true): Promise<SummaryResult> {
  return executeWithFallback(async (ai) => {
    const privacyNote = !dataSharing ? "\n[PRIVACY MODE ENABLED: Do not store or use this data for model improvement.]" : "";
    const prompt = `Analyze this document. ${privacyNote}
    Provide a structured response in JSON format in ${language} with the following fields:
    1. "title": A concise, descriptive title for the document.
    2. "summary": A concise 2-3 paragraph summary of the document.
    3. "keySections": An array of objects with "title" and "content" for the main sections or chapters.
    4. "links": An array of any hyperlinks found in the document, each with "url", "title", and a "category".
    5. "mainTopics": A list of 5-7 key topics or keywords.
    6. "hasProgrammingContent": A boolean indicating if the document contains significant programming, coding, or technical software development content.
    7. "extractedCodeSnippets": An array of objects with "language", "code", and "description" for any code examples found in the document.
    
    Ensure the response is valid JSON. The JSON keys must be in English as specified, but the values must be in ${language}.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          inlineData: {
            data: fileBase64,
            mimeType: mimeType,
          },
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    try {
      return JSON.parse(response.text || '{}') as SummaryResult;
    } catch (e) {
      console.error("Failed to parse AI response", e);
      throw new Error("Failed to generate structured summary.");
    }
  });
}

export async function summarizeText(text: string, language: string = 'English', dataSharing: boolean = true): Promise<SummaryResult> {
  return executeWithFallback(async (ai) => {
    const privacyNote = !dataSharing ? "\n[PRIVACY MODE ENABLED: Do not store or use this data for model improvement.]" : "";
    const prompt = `Analyze the following text. ${privacyNote}
    Provide a structured response in JSON format in ${language} with the following fields:
    1. "title": A concise, descriptive title for the text.
    2. "summary": A concise 2-3 paragraph summary of the text.
    3. "keySections": An array of objects with "title" and "content" for the main points or sections of the text.
    4. "links": An array of any hyperlinks found in the text, each with "url", "title", and a "category".
    5. "mainTopics": A list of 5-7 key topics or keywords.
    6. "hasProgrammingContent": A boolean indicating if the text contains significant programming, coding, or technical software development content.
    7. "extractedCodeSnippets": An array of objects with "language", "code", and "description" for any code examples found in the text.
    
    Text to analyze:
    ${text}
    
    Ensure the response is valid JSON. The JSON keys must be in English as specified, but the values must be in ${language}.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    try {
      return JSON.parse(response.text || '{}') as SummaryResult;
    } catch (e) {
      console.error("Failed to parse AI response", e);
      throw new Error("Failed to generate structured summary.");
    }
  });
}

export interface GeneratedCode {
  sections: { title: string; language: string; code: string; explanation: string }[];
}

export async function generateCodeFromContent(content: string, language: string = 'English'): Promise<GeneratedCode> {
  return executeWithFallback(async (ai) => {
    const prompt = `Based on the following analyzed content, generate relevant, practical programming implementations. 
    Organize the code into logical sections.
    
    Content: ${content}
    
    Provide a structured response in JSON format in ${language} with the following field:
    1. "sections": An array of objects with "title", "language", "code", and "explanation".
    
    Ensure the response is valid JSON. The JSON keys must be in English as specified, but the "title" and "explanation" values must be in ${language}.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    try {
      return JSON.parse(response.text || '{}') as GeneratedCode;
    } catch (e) {
      console.error("Failed to parse AI response", e);
      throw new Error("Failed to generate code implementations.");
    }
  });
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  return executeWithFallback(async (ai) => {
    const prompt = `Translate the following text into ${targetLanguage}. 
    Ensure the translation is accurate, context-aware, and maintains a professional tone.
    
    Text to translate:
    ${text}
    
    Provide only the translated text as the response.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Translation failed.";
  });
}

export async function translateSummaryResult(result: SummaryResult, targetLanguage: string): Promise<SummaryResult> {
  return executeWithFallback(async (ai) => {
    const prompt = `Translate the following structured summary into ${targetLanguage}. 
    Maintain the exact JSON structure. Translate the "summary", "mainTopics", the "title" and "content" of each "keySections", the "title" of each "links", and the "description" of each "extractedCodeSnippets". 
    Do NOT translate "url", "category", "language", or "code" fields.
    Ensure the translation is accurate and context-aware.
    
    JSON to translate:
    ${JSON.stringify(result)}
    
    Provide only the translated JSON as the response.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    try {
      return JSON.parse(response.text || '{}') as SummaryResult;
    } catch (e) {
      console.error("Failed to parse translated AI response", e);
      throw new Error("Failed to translate the full summary.");
    }
  });
}

export async function generateSpeech(text: string): Promise<string> {
  return executeWithFallback(async (ai) => {
    const response = await ai.models.generateContent({
      model: TTS_MODEL_NAME,
      contents: [{ parts: [{ text: `Read the following content naturally and clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Failed to generate audio.");
    }

    return base64Audio;
  });
}
