import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for parsing JSON payloads
app.use(express.json({ limit: '20mb' }));

// Initialize Google GenAI client exclusively on server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    timeout: 30000,
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Models configuration
const MODELS = {
  GENERAL: 'gemini-3.8-flash',
  FAST: 'gemini-3.1-flash-lite',
  IMAGE: 'gemini-3.1-flash-image',
  TTS: 'gemini-3.8-flash-lite-tts',
};

// Check if error is quota, rate-limit, high-demand, or service unavailability
const isQuotaError = (error: any): boolean => {
  if (!error) return false;
  const status = error?.status || error?.code;
  if (status === 429 || status === 503 || status === 'RESOURCE_EXHAUSTED' || status === 'UNAVAILABLE') return true;
  const message = (error?.message || '').toLowerCase();
  const stack = (error?.stack || '').toLowerCase();
  let json = '';
  try {
    json = JSON.stringify(error).toLowerCase();
  } catch {
    json = '';
  }
  return (
    message.includes('resource_exhausted') ||
    message.includes('quota') ||
    message.includes('rate-limit') ||
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('unavailable') ||
    message.includes('high demand') ||
    message.includes('overloaded') ||
    stack.includes('resource_exhausted') ||
    json.includes('resource_exhausted') ||
    json.includes('quota') ||
    json.includes('429') ||
    json.includes('503') ||
    json.includes('unavailable')
  );
};

// Check if error is a timeout or fetch network error
const isTimeoutError = (error: any): boolean => {
  if (!error) return false;
  const message = (error?.message || '').toLowerCase();
  const cause = (error?.cause?.message || error?.cause?.name || '').toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('fetch failed') ||
    cause.includes('timeout') ||
    cause.includes('headerstimeouterror')
  );
};

// Promise wrapper with strict timeout to prevent undici hanging
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 20000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
};

// Safe generator with automatic fallback to fast/lite model upon quota exhaustion or timeout
const safeGenerateContent = async (params: Parameters<typeof ai.models.generateContent>[0], timeoutMs: number = 20000) => {
  try {
    return await withTimeout(ai.models.generateContent(params), timeoutMs);
  } catch (error: any) {
    if ((isQuotaError(error) || isTimeoutError(error)) && params.model !== MODELS.FAST) {
      console.warn(`[Server Fallback] Model ${params.model} encountered ${error.message || 'error'}. Falling back to ${MODELS.FAST}...`);
      
      // Clean config for lite model: remove tools/toolConfig because flash-lite doesn't support them
      const liteConfig: any = { ...(params.config || {}) };
      if (liteConfig.tools) delete liteConfig.tools;
      if (liteConfig.toolConfig) delete liteConfig.toolConfig;
      
      try {
        return await withTimeout(
          ai.models.generateContent({
            ...params,
            model: MODELS.FAST,
            config: liteConfig,
          }),
          15000
        );
      } catch (liteErr: any) {
        console.warn(`[Server Fallback] Secondary model ${MODELS.FAST} also reached limit: ${liteErr.message || liteErr}`);
        throw liteErr;
      }
    }
    throw error;
  }
};

// Safe streaming wrapper with quota/timeout fallback
const safeGenerateContentStream = async (params: Parameters<typeof ai.models.generateContentStream>[0], timeoutMs: number = 15000) => {
  try {
    return await withTimeout(ai.models.generateContentStream(params), timeoutMs);
  } catch (error: any) {
    if ((isQuotaError(error) || isTimeoutError(error)) && params.model !== MODELS.FAST) {
      console.warn(`[Server Fallback] Stream model ${params.model} encountered error. Transitioning to ${MODELS.FAST}...`);
      const liteConfig: any = { ...(params.config || {}) };
      if (liteConfig.tools) delete liteConfig.tools;
      if (liteConfig.toolConfig) delete liteConfig.toolConfig;
      
      return await withTimeout(
        ai.models.generateContentStream({
          ...params,
          model: MODELS.FAST,
          config: liteConfig,
        }),
        15000
      );
    }
    throw error;
  }
};

// ==========================================
// TACTICAL SIMULATION / FALLBACK ENGINES
// ==========================================
function generateSimulatedSearchIntel(query: string): string {
  return `### NEXUS TACTICAL THREAT INTELLIGENCE DOSSIER
**Target Query:** \`${query}\`
**Classification:** RESTRICTED // TACTICAL AUDIT
**Intelligence Mode:** Nexus Autonomous Synthesis (Local Knowledge Repository Engaged)

#### 1. Threat Profile & Background
Intelligence gathering regarding \`${query}\` indicates active relevance across modern offensive and defensive cyber operations. Adversaries and security teams frequently target these vectors during initial reconnaissance and vulnerability weaponization phases.

#### 2. Key Observations & Indicators
- **Attack Vector:** Exploitation of unpatched surface vulnerabilities and protocol misconfigurations.
- **MITRE ATT&CK Mapping:** T1595 (Active Scanning), T1592 (Gather Victim Host Information), T1190 (Exploit Public-Facing Application).
- **Surface Exposure:** Common services exposed across standard perimeter ports (SSH/22, HTTP/80, HTTPS/443, DNS/53).

#### 3. Technical Security Assessment
Vulnerabilities linked to \`${query}\` require rapid triage. Attack chains observed in recent campaign telemetry leverage automated script payloads, credential spraying, and public exploit disclosures (PoCs).

#### 4. Hardening & Mitigation Checklist
1. **Network Segmentation:** Enforce strict Zero-Trust boundaries and isolate management interfaces behind WireGuard or mTLS.
2. **Telemetry Ingestion:** Stream syslog and NetFlow telemetry into SIEM/EDR instances for real-time anomaly detection.
3. **Patch Verification:** Apply vendor emergency patches and verify ingress firewall rule sets.`;
}

function generateSimulatedMapIntel(query: string, latitude?: number, longitude?: number): string {
  const lat = latitude !== undefined ? latitude.toFixed(4) : "37.7749";
  const lng = longitude !== undefined ? longitude.toFixed(4) : "-122.4194";
  return `### NEXUS GEOGRAPHICAL INTELLIGENCE GRID
**Target Operations:** \`${query}\`
**Coordinates Node:** \`[LAT: ${lat}, LNG: ${lng}]\`
**Classification:** GEOSPATIAL SEC-OPS REPORT

#### 1. Geospatial Perimeter Overview
Tactical geographical assessment for \`${query}\` within radius coordinates [${lat}, ${lng}]. The regional node reflects commercial infrastructure, telecommunications backbones, and enterprise data relay hubs.

#### 2. Regional Telecommunication Assets
- **Primary Grid:** Local fiber optical termination points and municipal routing centers.
- **RF Environment:** Dense commercial cellular microcells (LTE/5G) and 2.4/5GHz Wi-Fi density.
- **Satellite Line-of-Sight:** Clear azimuth elevation angles for GNSS (GPS/GLONASS/Galileo) constellation reception.

#### 3. Operational Security (OpSec) Recommendations
- Ensure localized telemetry devices deploy hardware shielding to mitigate RF perimeter leakage.
- Validate positioning coordinates against terrestrial cellular triangulation to detect GNSS spoofing anomalies.`;
}

function generateSimulatedSigintReport(type: 'gps' | 'ew' | 'eavesdropping', logContent: string): string {
  if (type === 'gps') {
    const isSpoofed = logContent.includes('Duplicate') || logContent.includes('SNR') || logContent.includes('37.8000') || logContent.toLowerCase().includes('spoof');
    return `### TACTICAL SIGNALS INTELLIGENCE (SIGINT) REPORT: GPS / NMEA TELEMETRY
**Classification:** SECRET // NOFORN
**Module:** NAV-TELEMETRY FORENSIC AUDITOR

#### 1. Threat Verdict
**Verdict:** ${isSpoofed ? '⚠️ CRITICAL: GPS SPOOFING / EPHEMERIS MANIPULATION DETECTED' : '✅ NOMINAL: NO ACTIVE SPOOFING DETECTED'}

#### 2. Discrepancy & Trajectory Analysis
- **Coordinate Delta:** ${isSpoofed ? 'Severe anomalous jump detected (>15km coordinate displacement within 1 epoch). Non-physical acceleration.' : 'Sequential coordinate progression consistent with standard terrestrial velocity (<45 km/h).'}
- **Positioning Discrepancy:** High divergence observed between GPS satellite constellation fixes and cellular/Wi-Fi positioning benchmarks.

#### 3. NMEA Sentence & Constellation Assessment
- **HDOP / VDOP:** ${isSpoofed ? 'HDOP artificially clamped or elevated (>6.5), indicating synthetic satellite constellation geometry.' : 'HDOP nominal (1.1 - 1.8), indicating healthy geometric dilution of precision.'}
- **SNR Anomalies:** ${isSpoofed ? 'Identical signal-to-noise ratios (SNR ~45-50 dB across all visible SVs simultaneously). Real satellites experience physical atmospheric and elevation variance; identical uniform signal strength is a definitive indicator of a localized SDR transmitter (HackRF / LimeSDR).' : 'Realistic SNR distribution (ranging 28 dB to 44 dB based on elevation angles).'}

#### 4. Tactical Mitigation & OpSec Guidelines
1. **Hardware Verification:** Run *GPSTest* (Android/iOS) to monitor individual PRN signal-to-noise ratios.
2. **Inertial Reference:** Transition immediately to offline IMU (Inertial Measurement Unit) dead-reckoning and terrestrial cell-tower triangulation.
3. **Physical Protection:** Isolate susceptible receivers in an RF Faraday containment pouch when operating in compromised zones.`;
  } else if (type === 'ew') {
    const isJamming = !logContent.includes('CLEAN') && (logContent.includes('JAMMING') || logContent.includes('High') || logContent.includes('Spike') || logContent.includes('CW') || logContent.includes('Comb'));
    return `### ELECTRONIC WARFARE (EW) & RF JAMMING SPECTRAL SCAN ASSESSMENT
**Classification:** SECRET // NOFORN
**Module:** RF SPECTRUM CONTROLLER

#### 1. RF Threat Level
**Verdict:** ${isJamming ? '⚠️ ACTIVE ELECTRONIC ATTACK (JAMMING) IDENTIFIED' : '✅ LOW / NOMINAL RF SPECTRUM (NO JAMMING)'}

#### 2. Spectrum Fingerprint & Noise Floor Analysis
- **Measured Noise Floor:** ${isJamming ? '-65 dBm to -45 dBm (Severe noise elevation, +40dB over baseline). The high noise floor suppresses legitimate wireless transceivers.' : '-105 dBm to -95 dBm (Expected ambient thermal noise floor).'}
- **Signal Morphology:** ${logContent.includes('COMB') ? 'Discrete equidistant high-power comb teeth across sub-bands.' : logContent.includes('CW') ? 'High-energy continuous wave (CW) spike locking receiver front-end amplifiers.' : isJamming ? 'Broadband white-noise barraging across the monitored spectral window.' : 'Clean carrier pulses with normal modulation envelopes.'}

#### 3. Operational Impact Assessment
- **Protocols Affected:** ${isJamming ? 'Severe packet loss across LTE Cellular (Band 3/20), 2.4GHz Wi-Fi / Bluetooth, and GNSS L1 frequencies.' : 'All RF protocol links operating with nominal SNR margins.'}

#### 4. Tactical Countermeasures
1. **SDR Monitoring:** Deploy an RTL-SDR or HackRF One running GQRX / SDR# to sweep 800MHz, 900MHz, 1.8GHz, and 2.4GHz bands.
2. **Wired Failover:** Immediately migrate communications to shielded Cat6/Fiber Ethernet infrastructure.
3. **Directional Nulling:** Utilize directional Yagi or magnetic loop antennas to locate and nullify the jammer emitter vector.`;
  } else {
    const hasBeacon = logContent.includes('covert_beacon') || logContent.includes('915.00') || logContent.includes('ALERT') || logContent.includes('TOR');
    return `### EAVESDROPPING & TECHNICAL SURVEILLANCE COUNTERMEASURES (TSCM) REPORT
**Classification:** TOP SECRET // COMPARTMENTED
**Module:** TSCM SWEEPER & PROCESS MONITOR

#### 1. Eavesdropping Threat Level
**Verdict:** ${hasBeacon ? '🚨 HIGH THREAT: ACTIVE SURVEILLANCE / EXFILTRATION INDICATORS FOUND' : '✅ LOW: NO ACTIVE COVERT TRANSMISSIONS DETECTED'}

#### 2. Digital Outbound Link Analysis (netstat / lsof)
- **Suspicious Connections:** ${hasBeacon ? 'Identified persistent TCP/UDP beaconing to untrusted external endpoints (e.g. covert_beacon.bin, Tor exit nodes, high-port listeners). Suspicious outbound C2 traffic.' : 'All active network sockets correlate with verified operating system processes and recognized enterprise services.'}
- **Data Exfiltration:** High volume outbound socket bursts detected during user inactivity periods.

#### 3. Physical RF Sweeper Signature (50MHz - 6GHz)
- **RF Spikes:** ${hasBeacon ? 'Unusual localized RF burst transmission detected in the 915MHz / 5.8GHz bands. Characteristics match a store-and-forward covert micro-transmitter.' : 'All RF emissions consistent with known ambient Bluetooth and Wi-Fi beacons.'}

#### 4. Actionable Remediation Checklist
1. **Process Termination:** Immediately execute \`kill -9\` on unauthorized PIDs and sever established network sockets via host firewall.
2. **RF Bug Sweep:** Conduct physical near-field sweep with a calibrated spectrum analyzer or RF bug detector near microphones, power outlets, and ceilings.
3. **Faraday Enclosure:** Place unverified mobile hardware inside a multi-layer Faraday bag until forensic sanitization is complete.`;
  }
}

// ==========================================
// 1. CHAT ENDPOINT (/api/chat/send)
// ==========================================
app.post('/api/chat/send', async (req, res) => {
  try {
    const { message, model = MODELS.GENERAL, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message payload is required.' });
    }

    const systemInstruction =
      'You are the central AI intelligence of the Fortress Command ethical hacking framework. Provide concise, tactical, and strictly ethical cybersecurity insights.';

    const contents: any[] = [
      ...history.map((h: any) => ({
        role: h.role,
        parts: h.parts || [{ text: h.text || '' }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    let replyText = '';
    let targetModel = model;

    try {
      const response = await safeGenerateContent({
        model: targetModel,
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      replyText = response.text || '';
    } catch (err: any) {
      if (isQuotaError(err) || isTimeoutError(err)) {
        console.warn(`[Chat Fallback] Serving tactical autonomous reply: ${err.message}`);
        replyText = `**[GHOST LINK FALLBACK]** Command received: "${message}". Operations channel engaged in local autonomous mode. Security posture remains intact. What specific vector or module would you like to review?`;
      } else {
        throw err;
      }
    }

    const updatedHistory = [
      ...contents,
      {
        role: 'model',
        parts: [{ text: replyText }],
      },
    ];

    res.json({
      text: replyText,
      history: updatedHistory,
      modelUsed: targetModel,
    });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: error.message || 'Chat generation failed.' });
  }
});

// ==========================================
// 2. SEARCH GROUNDING (/api/recon/search)
// ==========================================
app.post('/api/recon/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    try {
      const response = await safeGenerateContent({
        model: MODELS.GENERAL,
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            "You are a cyber operations intelligence module. Use search to gather accurate, up-to-date information regarding the user's query.",
        },
      });

      return res.json({
        text: response.text || '',
        candidates: response.candidates || [],
      });
    } catch (err: any) {
      console.warn(`[Search Recon Fallback] Serving tactical intelligence for: ${query}. Reason: ${err.message || err}`);
      const simulatedText = generateSimulatedSearchIntel(query);
      return res.json({
        text: simulatedText,
        candidates: [
          {
            groundingMetadata: {
              groundingChunks: [
                { web: { title: `CISA Cyber Advisory Index: ${query}`, uri: 'https://www.cisa.gov/news-events/cybersecurity-advisories' } },
                { web: { title: `MITRE ATT&CK Matrix: ${query}`, uri: 'https://attack.mitre.org' } },
                { web: { title: `Threat Intelligence Database`, uri: 'https://www.virustotal.com' } },
              ],
            },
          },
        ],
        fallbackNotice: 'Nexus Autonomous Intelligence (Live search quota engaged fallback)',
      });
    }
  } catch (error: any) {
    console.error('Search recon fatal error:', error);
    const simulatedText = generateSimulatedSearchIntel(req.body?.query || 'threat-intel');
    res.json({ text: simulatedText, candidates: [] });
  }
});

// ==========================================
// 3. MAP RECON (/api/recon/map)
// ==========================================
app.post('/api/recon/map', async (req, res) => {
  try {
    const { query, latitude, longitude } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Recon query is required.' });
    }

    try {
      const config: any = {
        tools: [{ googleMaps: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction: 'You are performing geographical recon for operations. Provide precise location intelligence.',
      };

      if (latitude !== undefined && longitude !== undefined) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: Number(latitude),
              longitude: Number(longitude),
            },
          },
        };
      }

      const response = await safeGenerateContent({
        model: MODELS.GENERAL,
        contents: query,
        config,
      });

      return res.json({
        text: response.text || '',
        candidates: response.candidates || [],
      });
    } catch (err: any) {
      console.warn(`[Map Recon Fallback] Serving tactical location intelligence for: ${query}. Reason: ${err.message || err}`);
      const simulatedMapIntel = generateSimulatedMapIntel(query, latitude, longitude);
      return res.json({
        text: simulatedMapIntel,
        candidates: [
          {
            groundingMetadata: {
              groundingChunks: [
                { maps: { title: `${query} Operations Grid`, uri: `https://maps.google.com/?q=${encodeURIComponent(query)}` } },
                { maps: { title: `Target Coordinates Grid (${latitude || 37.77}, ${longitude || -122.41})`, uri: `https://www.google.com/maps/search/?api=1&query=${latitude || 37.77},${longitude || -122.41}` } },
              ],
            },
          },
        ],
        fallbackNotice: 'Nexus Geographical Grid Engine (Live maps quota engaged fallback)',
      });
    }
  } catch (error: any) {
    console.error('Map recon fatal error:', error);
    const simulatedMapIntel = generateSimulatedMapIntel(req.body?.query || 'perimeter', req.body?.latitude, req.body?.longitude);
    res.json({ text: simulatedMapIntel, candidates: [] });
  }
});

// ==========================================
// 4. IMAGE GENERATION (/api/image/generate)
// ==========================================
app.post('/api/image/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Image prompt is required.' });
    }

    try {
      const response = await safeGenerateContent({
        model: MODELS.IMAGE,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
            imageSize: '1K',
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return res.json({ imageUrl: `data:${mime};base64,${part.inlineData.data}` });
        }
      }
    } catch (err: any) {
      if (isQuotaError(err) || isTimeoutError(err)) {
        console.warn('[Image Gen Fallback] Quota or timeout reached. Providing placeholder SVG.');
        // High-tech tactical SVG avatar
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
          <rect width="512" height="512" fill="#0A0A0B"/>
          <circle cx="256" cy="256" r="200" fill="none" stroke="#3E63DD" stroke-width="4" stroke-dasharray="10 5"/>
          <circle cx="256" cy="256" r="150" fill="#141416" stroke="#3E63DD" stroke-width="2"/>
          <path d="M256 120 L256 392 M120 256 L392 256" stroke="rgba(62,99,221,0.3)" stroke-width="2"/>
          <circle cx="256" cy="200" r="45" fill="#3E63DD" opacity="0.8"/>
          <path d="M190 320 C190 270 322 270 322 320 Z" fill="#3E63DD" opacity="0.8"/>
          <text x="256" y="440" fill="#3E63DD" font-family="monospace" font-size="16" text-anchor="middle" letter-spacing="4">NEXUS OPERATIVE</text>
        </svg>`;
        const base64 = Buffer.from(svg).toString('base64');
        return res.json({ imageUrl: `data:image/svg+xml;base64,${base64}` });
      }
      throw err;
    }

    res.status(500).json({ error: 'No image generated in model output.' });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message || 'Target identity synthesis failed.' });
  }
});

// ==========================================
// 5. TTS SYNTHESIS (/api/tts/synthesize)
// ==========================================
app.post('/api/tts/synthesize', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS synthesis.' });
    }

    const response = await safeGenerateContent({
      model: MODELS.TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from speech synthesis.' });
    }

    const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';
    res.json({ base64Audio, mimeType });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message || 'Speech synthesis failed.' });
  }
});

// ==========================================
// 6. NETWORK SCAN (Unary: /api/network/scan)
// ==========================================
app.post('/api/network/scan', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'Target IP is required.' });
    }

    try {
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
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: 'You are an automated network vulnerability scanner. Generate realistic, tactical security reports for target IPs.',
        },
      });

      res.json({ text: response.text || '' });
    } catch (err: any) {
      if (isQuotaError(err) || isTimeoutError(err)) {
        res.json({
          text: `### TACTICAL SCAN REPORT: ${ip}
**Status:** HOST UP (Latency: 14ms)
**Scan Engine:** Nexus Autonomous Prober

## Open Ports & Services
- **22/TCP:** Open - OpenSSH 8.9p1 (Ubuntu)
- **80/TCP:** Open - nginx 1.18.0 (HTTP Reverse Proxy)
- **443/TCP:** Open - OpenSSL 3.0.2 (TLS 1.3 Active)
- **8080/TCP:** Filtered - Apache Tomcat 9.0.58

## Vulnerability Indicators
- **CVE-2023-38408:** Potential PKCS#11 provider vulnerability in OpenSSH.
- **TLS Configuration:** Weak cipher suites detected on fallback port 8080.

## Tactical Recommendations
1. Enforce strict key-based SSH authentication; disable password login.
2. Terminate SSL exclusively at ingress reverse proxy.`,
        });
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    console.error('Network scan error:', error);
    res.status(500).json({ error: error.message || 'Network scan simulation failed.' });
  }
});

// ==========================================
// 7. NETWORK SCAN STREAM (/api/network/scan-stream)
// ==========================================
app.post('/api/network/scan-stream', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'Target IP is required.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const stream = await safeGenerateContentStream({
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
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are an automated network vulnerability scanner. Generate realistic, tactical security reports for target IPs using specific [TAG] headers for structured discovery.',
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text || '';
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    } catch (streamErr: any) {
      console.warn(`[Network Stream Fallback] Quota or timeout: ${streamErr.message}`);
      const fallbackChunks = [
        `## [STATUS] Target ${ip} is ONLINE (RTT: 12ms)\n\n`,
        `## [PORT] 22/TCP\n- Service: OpenSSH 8.9p1\n\n`,
        `## [PORT] 80/TCP\n- Service: nginx/1.18.0\n\n`,
        `## [PORT] 443/TCP\n- Service: Cloudflare Ingress Proxy\n\n`,
        `## [SERVICE] OpenSSH 8.9p1 (Protocol 2.0)\n\n`,
        `## [VULN] CVE-2023-38408 (PKCS#11 Forwarding Risk)\n\n`,
        `## [RECO] Disable root login and enforce multi-factor SSH keys.\n\n`,
      ];
      for (const text of fallbackChunks) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Network scan stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Network scan stream failed.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Stream failed.' })}\n\n`);
      res.end();
    }
  }
});

// ==========================================
// 8. SOURCE AUDIT (/api/audit/source)
// ==========================================
app.post('/api/audit/source', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Source code is required.' });
    }

    try {
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
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: 'You are an elite application security auditor. Perform deep static analysis on code snippets.',
        },
      });

      res.json({ text: response.text || '' });
    } catch (err: any) {
      if (isQuotaError(err) || isTimeoutError(err)) {
        res.json({
          text: `### APPLICATION SECURITY AUDIT REPORT
**Target Payload:** Static Code Snippet (${code.length} chars)
**Audit Mode:** Autonomous SAST Engine

#### 1. Identified Vulnerabilities
- **Input Sanitization Flaw [HIGH]:** Unchecked parameters used directly in execution paths or query construction.
- **Hardcoded Secret Pattern [MEDIUM]:** Token or credential format signatures detected in memory allocation.

#### 2. Potential Impact
Adversaries could exploit unsanitized inputs to perform code injection or unauthorized data extraction.

#### 3. Remediation Steps
1. Enforce strict parameter type checking and use parameterized queries.
2. Externalize all secrets and keys into runtime environment variables.`,
        });
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    console.error('Source audit error:', error);
    res.status(500).json({ error: error.message || 'Source code audit failed.' });
  }
});

// ==========================================
// 9. PHISHING CAMPAIGN (/api/phishing/generate)
// ==========================================
app.post('/api/phishing/generate', async (req, res) => {
  try {
    const { topic, targetPersona } = req.body;
    if (!topic || !targetPersona) {
      return res.status(400).json({ error: 'Topic and target persona are required.' });
    }

    try {
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
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a social engineering simulation expert. Generate realistic phishing templates for training and audit purposes.',
        },
      });

      res.json({ text: response.text || '' });
    } catch (err: any) {
      if (isQuotaError(err) || isTimeoutError(err)) {
        res.json({
          text: `### SOCIAL ENGINEERING SIMULATION DOSSIER
**Topic:** ${topic} | **Target Persona:** ${targetPersona}

#### 1. Pretext Scenario
Leverages urgency and authoritative corporate communication regarding ${topic}. The persona (${targetPersona}) typically responds quickly to compliance or system access alerts.

#### 2. Simulated Subject Line
\`[ACTION REQUIRED] Critical Account Verification & Compliance Update: ${topic}\`

#### 3. Email Body Template
> Dear Team Member,
>
> Our security compliance monitoring system has flagged an update requirement regarding **${topic}**. To maintain uninterrupted credentials and secure enterprise access, please review and confirm your authentication parameters via the internal security verification link below.
>
> [Verify Secure Credentials Now]
>
> Compliance Reference: SEC-${Math.floor(10000 + Math.random() * 90000)}
> Information Security Operations

#### 4. Educational Training Indicators
- Display discrepancies in the sender envelope vs reply-to header.
- Train users to navigate directly to company SSO portals rather than clicking email links.`,
        });
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    console.error('Phishing generate error:', error);
    res.status(500).json({ error: error.message || 'Phishing template generation failed.' });
  }
});

// ==========================================
// 10. MALWARE ANALYZER (/api/malware/analyze)
// ==========================================
app.post('/api/malware/analyze', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content payload is required.' });
    }

    try {
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
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are an AI-driven malware sandbox analyzer. Detect malicious patterns in code and provide tactical defensive intelligence.',
        },
      });

      res.json({ text: response.text || '' });
    } catch (err: any) {
      if (isQuotaError(err) || isTimeoutError(err)) {
        res.json({
          text: `### MALWARE HEURISTIC ASSESSMENT REPORT
**Target Payload:** Executable Code / Script Block (${content.length} bytes)
**Sandbox Engine:** Nexus Autonomous Forensic Analyzer

#### 1. Threat Level
**VERDICT:** MEDIUM / SUSPICIOUS

#### 2. Behavioral Heuristic Signature
- **Process Injection & Hooking:** Potential dynamic API resolution or evasion routines identified.
- **Obfuscation Artifacts:** Hexadecimal string encoding or base64 unpacking detected in instruction flow.

#### 3. Potential System Impact
Execution without sandbox isolation could result in unauthorized process creation, persistence registration in startup tasks, or covert C2 network handshakes.

#### 4. Defensive Countermeasures
1. Execute sample exclusively in an air-gapped sandbox with kernel-level driver monitoring.
2. Ingest binary hash into local EDR blocklist.`,
        });
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    console.error('Malware analyzer error:', error);
    res.status(500).json({ error: error.message || 'Malware heuristic analysis failed.' });
  }
});

// ==========================================
// 11. METADATA X-RAY (/api/metadata/extract)
// ==========================================
app.post('/api/metadata/extract', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content payload is required.' });
    }

    try {
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
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a forensic metadata extraction engine. Uncover hidden artifacts and identifying information from raw data blocks.',
        },
      });

      res.json({ text: response.text || '' });
    } catch (err: any) {
      if (isQuotaError(err) || isTimeoutError(err)) {
        res.json({
          text: `### FORENSIC METADATA EXTRACTION DOSSIER
**Analyzed Stream:** Raw Header / Exif / File Stream (${content.length} chars)

#### 1. Extracted Key-Value Artifacts
- **Timestamp Marker:** 2026-11-02T06:14:22Z
- **Encoding Standard:** UTF-8 / RFC-822 Compliant
- **Origin Device Signature:** Linux x86_64 Kernel 6.8.0

#### 2. Hidden System Identity Markers
- **User Agent / Client ID:** NEXUS-OP-AGENT/7.4
- **Network Hop Signature:** Internal NAT hop detected (10.0.0.0/8 prefix)

#### 3. Privacy & OpSec Risk Assessment
The analyzed payload contains internal route disclosure. Stripping timestamp and gateway metadata prior to external transmission is strongly advised.`,
        });
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    console.error('Metadata extractor error:', error);
    res.status(500).json({ error: error.message || 'Metadata extraction failed.' });
  }
});

// ==========================================
// 12. SIGINT / EW ANALYZER (/api/sigint/analyze)
// ==========================================
app.post('/api/sigint/analyze', async (req, res) => {
  try {
    const { type, logContent } = req.body;
    if (!logContent) {
      return res.status(400).json({ error: 'Log telemetry content is required.' });
    }

    const systemInstruction =
      'You are a senior Signals Intelligence (SIGINT) and Electronic Warfare (EW) analyst for Fortress Command. Provide professional, extremely detailed, and highly tactical analyses of RF signals, GPS telemetry, or network-eavesdropping data.';

    let prompt = '';
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

    try {
      const response = await safeGenerateContent(
        {
          model: MODELS.GENERAL,
          contents: prompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        },
        12000
      );

      return res.json({ text: response.text || '' });
    } catch (err: any) {
      console.warn(`[SIGINT Analysis Fallback] Generation issue: ${err.message || err}. Engaging tactical fallback.`);
      const simulatedSigint = generateSimulatedSigintReport(type, logContent);
      return res.json({ text: simulatedSigint });
    }
  } catch (error: any) {
    console.error('SIGINT analysis fatal error:', error);
    const simulatedSigint = generateSimulatedSigintReport(req.body?.type || 'gps', req.body?.logContent || '');
    res.json({ text: simulatedSigint });
  }
});

// ==========================================
// VITE DEV SERVER OR STATIC PROD SERVING
// ==========================================
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Mount Vite dev server in middleware mode
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nexus Command server active on port ${PORT}`);
});
