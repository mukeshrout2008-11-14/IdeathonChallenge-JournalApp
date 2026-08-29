import { AssistantMode, JournalMessage } from '../types';

export interface ReflectResponse {
  reply: string;
  modelUsed: string;
  timestamp: number;
}

export interface SynthesizeResponse {
  title: string;
  summary: string;
  tags: string[];
  mood?: string;
  modelUsed?: string;
}

/**
 * Calls backend Express Gemini endpoint with fallback support.
 */
export async function sendReflectionPrompt(
  messages: JournalMessage[],
  mode: AssistantMode = 'reflection',
  contextPrompt: string = ''
): Promise<ReflectResponse> {
  const response = await fetch('/api/gemini/reflect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      mode,
      contextPrompt,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Generates an automatic title, summary synopsis, mood, and tags.
 */
export async function synthesizeEntry(content: string): Promise<SynthesizeResponse> {
  const response = await fetch('/api/gemini/synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate automatic synthesis.');
  }

  return await response.json();
}
