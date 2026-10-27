import { ChatMessage, StudyModule } from '../types';

export interface HealthStatus {
  status: 'online' | 'offline';
  name?: string;
  tagline?: string;
  version?: string;
  model?: string;
  hasApiKey?: boolean;
  error?: string;
}

export class LuxionApiService {
  private customBaseUrl: string = '';

  public setCustomBaseUrl(url: string) {
    this.customBaseUrl = url.trim().replace(/\/+$/, '');
  }

  private getUrl(endpoint: string): string {
    if (this.customBaseUrl) {
      return `${this.customBaseUrl}${endpoint}`;
    }
    return endpoint;
  }

  public async checkHealth(): Promise<HealthStatus> {
    try {
      const endpoint = this.getUrl('/api/health');
      const res = await fetch(endpoint, { method: 'GET' });
      if (!res.ok) {
        return { status: 'offline', error: `HTTP ${res.status}: ${res.statusText}` };
      }
      const data = await res.json();
      return {
        status: 'online',
        name: data.name,
        tagline: data.tagline,
        version: data.version,
        model: data.model,
        hasApiKey: data.hasApiKey,
      };
    } catch (err: any) {
      return { status: 'offline', error: err.message || 'Cannot reach server' };
    }
  }

  public async sendChat(
    messages: { role: string; content: string }[],
    options?: { customInstruction?: string; signal?: AbortSignal }
  ): Promise<{ role: string; content: string; model: string }> {
    const endpoint = this.getUrl('/api/chat');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        customInstruction: options?.customInstruction,
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status} error` }));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  }

  public async analyzeFile(payload: {
    fileName: string;
    fileType: string;
    fileContent?: string;
    base64Data?: string;
    prompt?: string;
    task?: 'summary' | 'insights' | 'bugs' | 'general';
  }): Promise<{ analysis: string; fileName: string }> {
    const endpoint = this.getUrl('/api/analyze-file');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status} error` }));
      throw new Error(err.error || `Failed to analyze file`);
    }

    return await res.json();
  }

  public async generateStudyModule(payload: {
    topic: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    subject: string;
  }): Promise<StudyModule> {
    const endpoint = this.getUrl('/api/study');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status} error` }));
      throw new Error(err.error || `Study generation failed`);
    }

    return await res.json();
  }

  public async analyzeCode(payload: {
    code: string;
    language: string;
    action: 'explain' | 'debug' | 'improve' | 'test';
    userQuestion?: string;
  }): Promise<{ result: string; language: string; action: string }> {
    const endpoint = this.getUrl('/api/coding');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status} error` }));
      throw new Error(err.error || `Coding analysis failed`);
    }

    return await res.json();
  }
}

export const api = new LuxionApiService();
