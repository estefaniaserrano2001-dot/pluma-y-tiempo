import { AssistantScope } from '../types';

export interface GrammarSuggestion {
  id: string;
  type: string;
  severity: 'error' | 'advertencia' | 'sugerencia';
  originalSnippet: string;
  suggestedCorrection: string;
  explanation: string;
}

export interface GrammarAnalysisResponse {
  suggestions: GrammarSuggestion[];
  overallScore: number;
  summary: string;
  error?: string;
}

export interface CrutchFinding {
  id: string;
  expression: string;
  count: number;
  category: string;
  snippets: string[];
  distribution: string;
  alternatives: string[];
  stylisticAdvice: string;
}

export interface CrutchAnalysisResponse {
  findings: CrutchFinding[];
  diagnosis: string;
  error?: string;
}

export interface ContinuityIssue {
  id: string;
  type: string;
  severity: string;
  fragment: string;
  relatedEntity: string;
  explanation: string;
  suggestion: string;
}

export interface ContinuityAnalysisResponse {
  issues: ContinuityIssue[];
  overallConsistencyVerdict: string;
  error?: string;
}

export interface TranscriptionResponse {
  transcription: string;
  timestamp: string;
  error?: string;
}

class AIService {
  async checkHealth(): Promise<{ status: string; hasApiKey: boolean }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return { status: 'error', hasApiKey: false };
    }
  }

  async analyzeGrammar(
    text: string,
    chapterTitle: string,
    scope?: AssistantScope
  ): Promise<GrammarAnalysisResponse> {
    const res = await fetch('/api/gemini/analyze-grammar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, chapterTitle, scope }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Fallo en la comunicación con el asistente lingüístico.');
    }
    return await res.json();
  }

  async detectCrutches(text: string, customExpressions: string[] = []): Promise<CrutchAnalysisResponse> {
    const res = await fetch('/api/gemini/detect-crutches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, customExpressions }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Fallo en la detección de muletillas.');
    }
    return await res.json();
  }

  async analyzeContinuity(payload: {
    text: string;
    chapterTitle: string;
    characters: any[];
    details: any[];
    timelineEvents: any[];
  }): Promise<ContinuityAnalysisResponse> {
    const res = await fetch('/api/gemini/analyze-continuity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Fallo en el análisis de continuidad narrativa.');
    }
    return await res.json();
  }

  async transcribeAudio(fileBlob: Blob, instructions?: string): Promise<TranscriptionResponse> {
    // Convert Blob to base64
    const base64Audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileBlob);
    });

    const res = await fetch('/api/gemini/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Audio,
        mimeType: fileBlob.type || 'audio/mp3',
        instructions,
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Fallo al transcribir la grabación.');
    }
    return await res.json();
  }
}

export const aiService = new AIService();
