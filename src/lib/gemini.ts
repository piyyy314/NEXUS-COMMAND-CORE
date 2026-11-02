// Client-side AI module proxy
// All Gemini operations, models, and secret keys are routed to the Express backend (/api/*)
// completely removing client-side @google/genai dependencies.

export const MODELS = {
  GENERAL: 'gemini-3.8-flash',
  COMPLEX: 'gemini-3.1-pro-preview',
  FAST: 'gemini-3.1-flash-lite',
  IMAGE: 'gemini-3.1-flash-image',
  TTS: 'gemini-3.8-flash-lite-tts',
};

// Check if error is quota exhaustion
export const isQuotaError = (error: any): boolean => {
  if (!error) return false;
  if (error?.status === 429 || error?.code === 429) return true;
  const message = (error?.message || '').toLowerCase();
  let errorStr = '';
  try {
    errorStr = JSON.stringify(error).toLowerCase();
  } catch {
    errorStr = '';
  }
  return (
    errorStr.includes('resource_exhausted') ||
    errorStr.includes('quota') ||
    errorStr.includes('429') ||
    message.includes('quota') ||
    message.includes('resource_exhausted') ||
    message.includes('rate-limit') ||
    message.includes('429')
  );
};

// User-friendly error formatting
export const handleAiError = (error: any): string => {
  if (isQuotaError(error)) {
    return 'COMMAND OVERLOAD: AI Quota Exceeded (limit: 25M tokens/day on gemini-3.8-flash). Nexus has engaged high-efficiency fallback channels. If issues persist, please wait a minute or connect a billing project in Settings > Secrets.';
  }

  const message = error?.message || '';
  const errorStr = (typeof error === 'string' ? error : JSON.stringify(error) || '').toLowerCase();

  // Try extracting error message from nested JSON error string (e.g. from Google API)
  if (message.startsWith('{') && message.includes('"message"')) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.error?.message) {
        if (isQuotaError(parsed.error)) {
          return 'COMMAND OVERLOAD: AI Quota Exceeded. Nexus has engaged high-efficiency fallback channels.';
        }
        return `NEURAL ALERT: ${parsed.error.message}`;
      }
    } catch {
      // ignore JSON parse fallback
    }
  }

  if (errorStr.includes('api_key') || message.toLowerCase().includes('api key')) {
    return 'ACCESS DENIED: Invalid or missing API key. Check Nexus Command configuration in Settings > Secrets.';
  }

  if (errorStr.includes('timeout') || message.toLowerCase().includes('timeout') || errorStr.includes('fetch failed')) {
    return 'UPLINK DELAY: Satellite telemetry link timed out. Nexus fallback channels active.';
  }

  return message || 'NEURAL LINK FAILURE: An unexpected error interrupted the operation.';
};

// Create a conversational session that proxies messages to /api/chat/send
export const createChat = (modelName: string = MODELS.GENERAL) => {
  let history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  return {
    model: modelName,
    sendMessage: async ({ message }: { message: string }) => {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          model: modelName,
          history,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Chat network request failed.' }));
        throw new Error(err.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.history) {
        history = data.history;
      }
      return {
        text: data.text || '',
      };
    },
  };
};

// Search grounding via server proxy
export const searchGrounding = async (query: string) => {
  const res = await fetch('/api/recon/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const data = await res.json().catch(() => ({ error: 'Search recon request failed.' }));
  if (!res.ok && !data.text) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }

  return data;
};

// Geographical recon via server proxy
export const mapRecon = async (query: string, latitude?: number, longitude?: number) => {
  const res = await fetch('/api/recon/map', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, latitude, longitude }),
  });

  const data = await res.json().catch(() => ({ error: 'Map recon request failed.' }));
  if (!res.ok && !data.text) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }

  return data;
};

// Target identity synthesis (image) via server proxy
export const createTargetIdentity = async (prompt: string): Promise<string> => {
  const res = await fetch('/api/image/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Target identity synthesis failed.' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  const data = await res.json();
  if (!data.imageUrl) throw new Error('No image generated.');
  return data.imageUrl;
};

// Speech synthesis (TTS) via server proxy
export const synthesizeSpeech = async (text: string): Promise<string> => {
  const res = await fetch('/api/tts/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Speech synthesis request failed.' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  const { base64Audio, mimeType = 'audio/wav' } = await res.json();
  if (!base64Audio) throw new Error('No audio returned');

  const binary = atob(base64Audio);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
};

// Unary network security scan via server proxy
export const analyzeNetworkTarget = async (ip: string): Promise<string> => {
  const res = await fetch('/api/network/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Scan request failed.' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  const data = await res.json();
  return data.text || '';
};

// Streaming network security scan via SSE (/api/network/scan-stream)
export async function* analyzeNetworkTargetStream(ip: string): AsyncGenerator<{ text: string }> {
  const response = await fetch('/api/network/scan-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Scan stream request failed.' }));
    throw new Error(err.error || `HTTP error ${response.status}`);
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported in this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.replace(/^data:\s*/, '');
      if (dataStr === '[DONE]') {
        return;
      }
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        if (parsed.text) {
          yield { text: parsed.text };
        }
      } catch (e: any) {
        if (e.message && dataStr.includes('"error"')) {
          throw e;
        }
      }
    }
  }

  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (trimmed.startsWith('data:')) {
      const dataStr = trimmed.replace(/^data:\s*/, '');
      if (dataStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.text) yield { text: parsed.text };
        } catch {
          // ignore trailing partial
        }
      }
    }
  }
}

// Static code auditor via server proxy
export const auditSourceCode = async (code: string): Promise<string> => {
  const res = await fetch('/api/audit/source', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Code audit request failed.' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  const data = await res.json();
  return data.text || '';
};

// Social engineering phishing pretext via server proxy
export const generatePhishingCampaign = async (topic: string, targetPersona: string): Promise<string> => {
  const res = await fetch('/api/phishing/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, targetPersona }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Phishing campaign generation failed.' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  const data = await res.json();
  return data.text || '';
};

// Malware heuristic analyzer via server proxy
export const analyzeMalware = async (content: string): Promise<string> => {
  const res = await fetch('/api/malware/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Malware analysis request failed.' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  const data = await res.json();
  return data.text || '';
};

// Forensic metadata extractor via server proxy
export const extractMetadata = async (content: string): Promise<string> => {
  const res = await fetch('/api/metadata/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Metadata extraction failed.' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  const data = await res.json();
  return data.text || '';
};

// SIGINT / EW telemetry forensic analyzer via server proxy
export const analyzeSigintData = async (type: 'gps' | 'ew' | 'eavesdropping', logContent: string): Promise<string> => {
  const res = await fetch('/api/sigint/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, logContent }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Signals intelligence analysis failed.' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }

  const data = await res.json();
  return data.text || '';
};
