
// Support multiple provider env names so functions can use custom provider settings
const API_KEY = Deno.env.get('AI_API_KEY') || Deno.env.get('OPENAI_API_KEY');
const API_URL = Deno.env.get('AI_API_URL') || 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = Deno.env.get('AI_MODEL') || 'gpt-4o-mini';
if (!API_KEY) {
  console.error('Missing AI_API_KEY or OPENAI_API_KEY in environment. Set AI_API_KEY for the function.');
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Call OpenAI API with structured JSON output
 */
export async function openAIChatCompletion(
  messages: OpenAIMessage[],
  options?: {
    model?: string;
    temperature?: number;
    responseFormat?: 'json_object' | 'text';
  }
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options?.model || DEFAULT_MODEL,
      messages,
      temperature: options?.temperature || 0.7,
      ...(options?.responseFormat === 'json_object' && {
        response_format: { type: 'json_object' },
      }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} ${error}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  return data.choices[0]?.message?.content || '';
}

/**
 * Call OpenAI Vision API to analyze image
 */
export async function openAIVision(
  imageUrl: string,
  prompt: string,
  options?: {
    model?: string;
    responseFormat?: 'json_object' | 'text';
  }
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options?.model || DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      temperature: 0.7,
      ...(options?.responseFormat === 'json_object' && {
        response_format: { type: 'json_object' },
      }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI Vision API error: ${response.status} ${error}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  return data.choices[0]?.message?.content || '';
}

/**
 * Safely parse JSON response, with fallback to extracting JSON from text
 */
export function safeParseJSON<T = any>(text: string): T | null {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON object from text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Extract JSON from text with multiple fallback strategies
 */
export function extractJSON<T = any>(text: string): T | null {
  // Strategy 1: Direct JSON parse
  const parsed = safeParseJSON<T>(text);
  if (parsed) return parsed;

  // Strategy 2: Extract code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const parsed = safeParseJSON<T>(codeBlockMatch[1]);
    if (parsed) return parsed;
  }

  // Strategy 3: Find any JSON-like structure
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    const parsed = safeParseJSON<T>(jsonMatch[0]);
    if (parsed) return parsed;
  }

  return null;
}
