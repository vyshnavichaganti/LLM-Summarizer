export interface SummaryResult {
  title: string;
  summary: string;
  keySections: { title: string; content: string }[];
  links: { url: string; category: string; title: string }[];
  mainTopics: string[];
  hasProgrammingContent: boolean;
  extractedCodeSnippets: { language: string; code: string; description: string }[];
}

export interface GeneratedCode {
  sections: { title: string; language: string; code: string; explanation: string }[];
}

async function callApi<T>(endpoint: string, body: any): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  return response.json();
}

export async function summarizeUrl(url: string, language: string = 'English', dataSharing: boolean = true): Promise<SummaryResult> {
  return callApi<SummaryResult>('/api/summarize-url', { url, language, dataSharing });
}

export async function summarizeDocument(fileBase64: string, mimeType: string, language: string = 'English', dataSharing: boolean = true): Promise<SummaryResult> {
  return callApi<SummaryResult>('/api/summarize-doc', { fileBase64, mimeType, language, dataSharing });
}

export async function summarizeText(text: string, language: string = 'English', dataSharing: boolean = true): Promise<SummaryResult> {
  return callApi<SummaryResult>('/api/summarize-text', { text, language, dataSharing });
}

export async function generateCodeFromContent(content: string, language: string = 'English'): Promise<GeneratedCode> {
  return callApi<GeneratedCode>('/api/generate-code', { content, language });
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const result = await callApi<{ text: string }>('/api/translate', { text, targetLanguage });
  return result.text;
}

export async function translateSummaryResult(result: SummaryResult, targetLanguage: string): Promise<SummaryResult> {
  return callApi<SummaryResult>('/api/translate-summary', { result, targetLanguage });
}

export async function generateSpeech(text: string): Promise<string> {
  const result = await callApi<{ audio: string }>('/api/generate-speech', { text });
  return result.audio;
}
