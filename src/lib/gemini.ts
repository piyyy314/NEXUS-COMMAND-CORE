import { GoogleGenAI, Type, Modality } from "@google/genai";

// Initialize the API client
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Models conforming to Google GenAI specifications
export const MODELS = {
  GENERAL: 'gemini-3.8-flash',
  COMPLEX: 'gemini-3.1-pro-preview',
  FAST: 'gemini-3.1-flash-lite',
  IMAGE: 'gemini-3.1-flash-image',
  TTS: 'gemini-3.8-flash-lite-tts'
};

// Check if error is quota exhaustion
export const isQuotaError = (error: any): boolean => {
  const errorStr = JSON.stringify(error).toLowerCase();
  const message = (error?.message || '').toLowerCase();
  return (
    errorStr.includes("resource_exhausted") ||
    errorStr.includes("quota") ||
    message.includes("quota") ||
    message.includes("resource_exhausted") ||
    error?.status === 429
  );
};

// Safe wrapper that automatically falls back to fast/lite model upon quota exhaustion
export const safeGenerateContent = async (params: Parameters<typeof ai.models.generateContent>[0]) => {
  try {
    return await ai.models.generateContent(params);
  } catch (error: any) {
    if (isQuotaError(error) && params.model !== MODELS.FAST) {
      console.warn(`[Quota Fallback] Model ${params.model} quota exhausted. Transitioning to lightweight model ${MODELS.FAST}...`);
      return await ai.models.generateContent({
        ...params,
        model: MODELS.FAST,
      });
    }
    throw error;
  }
};

// Safe streaming wrapper with quota fallback
export const safeGenerateContentStream = async (params: Parameters<typeof ai.models.generateContentStream>[0]) => {
  try {
    return await ai.models.generateContentStream(params);
  } catch (error: any) {
    if (isQuotaError(error) && params.model !== MODELS.FAST) {
      console.warn(`[Quota Fallback] Stream model ${params.model} quota exhausted. Transitioning to ${MODELS.FAST}...`);
      return await ai.models.generateContentStream({
        ...params,
        model: MODELS.FAST,
      });
    }
    throw error;
  }
};

// Create a persistent chat for the Chatbot component
export const createChat = (modelName: string = MODELS.GENERAL) => {
  return ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: "You are the central AI intelligence of the Fortress Command ethical hacking framework. Provide concise, tactical, and strictly ethical cybersecurity insights."
    }
  });
};

export const searchGrounding = async (query: string) => {
  const response = await safeGenerateContent({
    model: MODELS.GENERAL,
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are a cyber operations intelligence module. Use search to gather accurate, up-to-date information regarding the user's query."
    }
  });
  return response;
};

export const mapRecon = async (query: string, latitude?: number, longitude?: number) => {
  const config: any = {
    tools: [{ googleMaps: {} }],
    systemInstruction: "You are performing geographical recon for operations. Provide precise location intelligence."
  };
  
  if (latitude !== undefined && longitude !== undefined) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude,
          longitude
        }
      }
    };
  }

  const response = await safeGenerateContent({
    model: MODELS.GENERAL,
    contents: query,
    config,
  });
  return response;
};

export const createTargetIdentity = async (prompt: string) => {
  const response = await safeGenerateContent({
    model: MODELS.IMAGE,
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || "image/png";
      return `data:${mime};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated.");
};

export const synthesizeSpeech = async (text: string) => {
  const response = await safeGenerateContent({
    model: MODELS.TTS,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Charon' },
        }
      }
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio returned");

  // Create a Blob from base64
  const binary = atob(base64Audio);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "audio/wav" });
  return URL.createObjectURL(blob);
};

export const analyzeNetworkTarget = async (ip: string) => {
  const response = await safeGenerateContent({
    model: MODELS.GENERAL,
    contents: `Simulate a detailed technical network security scan for the following IP address: ${ip}.
    Provide a report in Markdown format including:
    1. Host Status (UP/DOWN)
    2. Open Ports and Services (e.g., 22/SSH, 80/HTTP, 443/HTTPS)
    3. Service Versions (fictional but realistic)
    4. Potential Vulnerabilities (CVE references or general issues)
    5. Tactical Recommendations.
    Keep the tone professional and tactical.`,
    config: {
      systemInstruction: "You are an automated network vulnerability scanner. Generate realistic, tactical security reports for target IPs."
    }
  });
  return response.text;
};

export const analyzeNetworkTargetStream = async (ip: string) => {
  return await safeGenerateContentStream({
    model: MODELS.GENERAL,
    contents: `Simulate a detailed technical network security scan for the following IP address: ${ip}.
    Provide a report where each finding starts with a specific tag for parsing:
    - For open ports: ## [PORT] [Port Number]/[Protocol]
    - For services: ## [SERVICE] [Service Name] ([Version])
    - For vulnerabilities: ## [VULN] [CVE-ID if any] [Vulnerability Name]
    - For host status: ## [STATUS] [Host Status]
    - For recommendations: ## [RECO] [Recommendation]
    
    Structure the report like this:
    1. Host Status ([STATUS])
    2. Open Ports ([PORT])
    3. Services ([SERVICE])
    4. Vulnerabilities ([VULN])
    5. Recommendations ([RECO])
    
    As you scan, reveal these findings immediately. Keep the tone professional and tactical.`,
    config: {
      systemInstruction: "You are an automated network vulnerability scanner. Generate realistic, tactical security reports for target IPs using specific [TAG] headers for structured discovery."
    }
  });
};

export const auditSourceCode = async (code: string) => {
  const response = await safeGenerateContent({
    model: MODELS.GENERAL,
    contents: `Analyze the following source code for security vulnerabilities, logic flaws, and potential attack vectors.
    ---
    ${code}
    ---
    Provide a detailed report in Markdown including:
    1. Identified Vulnerabilities (with severity)
    2. Potential Impact
    3. Remediation Steps
    4. Best Practice Recommendations.
    Maintain a highly technical and professional security auditor persona.`,
    config: {
      systemInstruction: "You are an elite application security auditor. Perform deep static analysis on code snippets."
    }
  });
  return response.text;
};

export const generatePhishingCampaign = async (topic: string, targetPersona: string) => {
  const response = await safeGenerateContent({
    model: MODELS.GENERAL,
    contents: `Generate a sophisticated spear-phishing pretext and email template based on the following:
    Topic/Bait: ${topic}
    Target Persona: ${targetPersona}
    
    Provide:
    1. Pretext Scenario (Why this works)
    2. Email Subject Line
    3. Email Body (Professional and convincing)
    4. Suggested Call to Action (The "hook")
    5. Recommended Delivery Method.
    
    Maintain a strictly educational/simulated tone. Be highly creative in the social engineering aspects.`,
    config: {
      systemInstruction: "You are a social engineering simulation expert. Generate realistic phishing templates for training and audit purposes."
    }
  });
  return response.text;
};

export const analyzeMalware = async (content: string) => {
  const response = await safeGenerateContent({
    model: MODELS.GENERAL,
    contents: `Perform a behavioral and heuristic analysis on the following code snippet or execution chain for indicators of compromise (IoCs) and malicious intent.
    ---
    ${content}
    ---
    Provide a tactical assessment report in Markdown:
    1. Threat Level (Low/Med/High/Critical)
    2. Malicious Intent Signature (What the code is trying to do)
    3. Potential Impact on Target System
    4. Suggested Mitigation/Defensive Countermeasures.
    Maintain a technical and forensic persona.`,
    config: {
      systemInstruction: "You are an AI-driven malware sandbox analyzer. Detect malicious patterns in code and provide tactical defensive intelligence."
    }
  });
  return response.text;
};

export const extractMetadata = async (content: string) => {
  const response = await safeGenerateContent({
    model: MODELS.GENERAL,
    contents: `Perform a forensic metadata extraction on the provided text, log, or header block. Identify hidden artifacts, origin signatures, and underlying system data.
    ---
    ${content}
    ---
    Provide a forensic report in Markdown:
    1. Direct Extracted Metadata (Key: Value pairs)
    2. Hidden Artifacts & Origin Signatures
    3. Potential Geolocation or System Identity Markers
    4. Privacy/OpSec Risk Assessment.
    Be thorough and technical.`,
    config: {
      systemInstruction: "You are a forensic metadata extraction engine. Uncover hidden artifacts and identifying information from raw data blocks."
    }
  });
  return response.text;
};

export const handleAiError = (error: any): string => {
  if (isQuotaError(error)) {
    return "COMMAND OVERLOAD: AI Quota Exceeded (limit: 25M tokens/day on gemini-3.8-flash). Nexus has engaged high-efficiency fallback channels. If issues persist, please wait a minute or connect a billing project in Settings > Secrets.";
  }
  
  const errorStr = JSON.stringify(error).toLowerCase();
  const message = error?.message?.toLowerCase() || "";
  
  if (errorStr.includes("api_key") || message.includes("api key")) {
    return "ACCESS DENIED: Invalid or missing API key. Check Nexus Command configuration in Settings > Secrets.";
  }

  return error?.message || "NEURAL LINK FAILURE: An unexpected error interrupted the operation.";
};

export const analyzeSigintData = async (type: 'gps' | 'ew' | 'eavesdropping', logContent: string) => {
  const systemInstruction = "You are a senior Signals Intelligence (SIGINT) and Electronic Warfare (EW) analyst for Fortress Command. Provide professional, extremely detailed, and highly tactical analyses of RF signals, GPS telemetry, or network-eavesdropping data.";
  
  let prompt = "";
  if (type === 'gps') {
    prompt = `Perform a deep forensic analysis on the following GPS/NMEA telemetry log or positioning report:
    ---
    ${logContent}
    ---
    Determine if GPS Spoofing, ephemeris replay, or signal manipulation is taking place.
    Your report MUST include:
    1. Threat Verdict (Spoofing Detected / No Anomaly / Jamming suspected)
    2. Discrepancy Analysis (Comparison of coordinates, altitudes, speed, and positioning system discrepancies)
    3. NMEA Sentence Assessment (Look for telltale indicators: HDOP, VDOP, duplicate satellite IDs, SNR, sudden positioning jumps)
    4. Suggested Mitigation & OpSec Guidelines (e.g., GPSTest verification, auxiliary IMU sensors, Faraday bag deployment, offline/inertial navigation).
    Provide response in elegant, clean Markdown. Keep the tone highly professional, precise, and tactical.`;
  } else if (type === 'ew') {
    prompt = `Analyze the following Electronic Warfare (EW) or RF Jamming spectral scan report / signal log:
    ---
    ${logContent}
    ---
    Evaluate whether active jamming (noise, comb pattern, continuous wave) or other interference is occurring.
    Your report MUST include:
    1. RF Threat Level (No Jamming / Broadband Noise Jamming / Spot Jamming / Sweep Jamming)
    2. Spectrum Fingerprint (Evaluation of band power spikes, noise floors, comb patterns, and signal structures)
    3. Impact Assessment (LTE/Cellular, Wi-Fi 2.4/5GHz, GNSS, Bluetooth)
    4. Tactical Countermeasures (SDR GQRX/SDR# monitoring, transitioning to wired networks, directional antennas, Faraday shield bags, localized RF sweeps).
    Provide response in elegant, clean Markdown. Keep the tone highly professional, precise, and tactical.`;
  } else {
    prompt = `Analyze the following Eavesdropping & Process Netstat/Lsof / RF Sweeper log or process list:
    ---
    ${logContent}
    ---
    Analyze it for signs of physical RF bugs, covert burst transmissions, or digital spyware establishing unauthorized outbound connections.
    Your report MUST include:
    1. Eavesdropping Threat Level (High / Med / Low)
    2. Digital Outbound Link Analysis (Suspicious established network connections, remote IPs, and host processes)
    3. Physical/RF Sweeper Signature (Analyzing any RF power level spikes, burst transmission patterns, or transmitter signals)
    4. Actionable Remediation (Kill processes, block outbound ports/IPs, physical sweep with HackRF/RF bugs detector, transition to Faraday containment).
    Provide response in elegant, clean Markdown. Keep the tone highly professional, precise, and tactical.`;
  }

  const response = await safeGenerateContent({
    model: MODELS.GENERAL,
    contents: prompt,
    config: { systemInstruction }
  });
  return response.text;
};
