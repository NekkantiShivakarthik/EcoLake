import { supabase } from '@/lib/supabase';
import { useState } from 'react';

type AssistantMode = 'general' | 'report_description';

interface ReportDescriptionInput {
  rawDescription: string;
  lakeName?: string;
  category?: string;
  severity?: number;
  locationHint?: string;
}

interface AskAssistantInput {
  message: string;
  mode?: AssistantMode;
  context?: {
    lakeName?: string;
    category?: string;
    severity?: number;
    locationHint?: string;
  };
}

interface AssistantSuccess {
  success: true;
  reply: string;
}

interface AssistantFailure {
  success: false;
  error: string;
}

type AssistantResult = AssistantSuccess | AssistantFailure;

function buildReportPrompt(input: ReportDescriptionInput): string {
  const trimmedDescription = input.rawDescription.trim();

  if (!trimmedDescription) {
    return [
      'Create a pollution report description using the provided context.',
      'Include likely visible signs and a clear call to action for cleanup.',
    ].join(' ');
  }

  return [
    'Improve this pollution report description for NGO review.',
    'Keep facts intact and make it clear and structured:',
    trimmedDescription,
  ].join('\n\n');
}

export function useAiAssistant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askAssistant = async (input: AskAssistantInput): Promise<AssistantResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('eco-assistant-chat', {
        body: {
          message: input.message,
          mode: input.mode ?? 'general',
          context: input.context,
        },
      });

      if (invokeError) {
        const message = invokeError.message || 'Failed to call AI assistant';
        setError(message);
        return { success: false, error: message };
      }

      const reply = data?.reply;
      if (!reply || typeof reply !== 'string') {
        const message = data?.error || 'Invalid AI response';
        setError(message);
        return { success: false, error: message };
      }

      return { success: true, reply: reply.trim() };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected AI error';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const generateReportDescription = async (
    input: ReportDescriptionInput,
  ): Promise<AssistantResult> => {
    return askAssistant({
      mode: 'report_description',
      message: buildReportPrompt(input),
      context: {
        lakeName: input.lakeName,
        category: input.category,
        severity: input.severity,
        locationHint: input.locationHint,
      },
    });
  };

  return {
    loading,
    error,
    askAssistant,
    generateReportDescription,
  };
}
