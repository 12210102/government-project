import type { AIAnalysisResult } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export async function analyzeSource(sourceText: string, sourceType: string): Promise<AIAnalysisResult> {
  const apiUrl = `${supabaseUrl}/functions/v1/rca-analyze`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'analyze', sourceText, sourceType }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: `Request failed (${response.status})` }));
    throw new Error(errorBody.error || `Request failed (${response.status})`);
  }

  const body = await response.json();
  if (body.error) {
    throw new Error(body.error);
  }

  const data = body.data as AIAnalysisResult;
  if (!data) {
    throw new Error('No analysis data returned from AI service.');
  }

  return data;
}
