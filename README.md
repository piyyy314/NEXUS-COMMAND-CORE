# Remix: Fortress Command (NEXUS COMMAND // CORE)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38b2ac.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Security Policy](https://img.shields.io/badge/Security-Policy-red.svg)](SECURITY.md)

> **Fortress Command** is a next-generation offensive and defensive cybersecurity command center. It bridges tactical signals intelligence (SIGINT), electronic warfare (EW) forensics, static application security testing (SAST), social engineering simulations, malware heuristic analysis, and AI-driven command & control (C2) into a unified tactical workstation.

---

## Table of Contents

- [Overview](#overview)
- [Tactical Modules](#tactical-modules)
  - [1. Operations Dashboard](#1-operations-dashboard)
  - [2. Command Palette & Field Manuals (⌘K)](#2-command-palette--field-manuals-k)
  - [3. Ghost Link C2 Terminal](#3-ghost-link-c2-terminal)
  - [4. SIGINT & Electronic Warfare (EW) Suite](#4-sigint--electronic-warfare-ew-suite)
  - [5. Network Recon & Port Scanner](#5-network-recon--port-scanner)
  - [6. Static Source Code Auditor](#6-static-source-code-auditor)
  - [7. Phishing Simulation Lab](#7-phishing-simulation-lab)
  - [8. AI Malware Sandbox](#8-ai-malware-sandbox)
  - [9. Forensic Metadata X-Ray](#9-forensic-metadata-x-ray)
  - [10. Global Intel Recon (OSINT)](#10-global-intel-recon-osint)
  - [11. Covert Identity Synthesis](#11-covert-identity-synthesis)
  - [12. Encrypted Tactical Storage Vault](#12-encrypted-tactical-storage-vault)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Installation & Local Setup](#installation--local-setup)
- [Environment Configuration](#environment-configuration)
- [Security & Ethical Use Policy](#security--ethical-use-policy)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Modern cyber operations require seamless coordination between physical electromagnetic intelligence (RF/GNSS), digital network reconnaissance, application-layer vulnerability assessment, and behavioral malware analytics. 

**Fortress Command** consolidates these disciplines into an operator-centric terminal equipped with real-time AI reasoning, multi-model fallback resiliency, and secure cryptographic storage.

```
                     +---------------------------------------+
                     |        NEXUS COMMAND // CORE          |
                     +-------------------+-------------------+
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
+--------v--------+             +--------v--------+             +--------v--------+
|   Tactical UI   |             |   Gemini AI     |             |  Storage Vault  |
| - Bento Grid    |             | - Flash 3.8     |             | - Firestore     |
| - Command ⌘K    |             | - Lite Fallback |             | - AES-256 GCM   |
| - Realtime SDR  |             | - Live Grounding|             | - Offline Sync  |
+-----------------+             +-----------------+             +-----------------+
```

---

## Tactical Modules

### 1. Operations Dashboard
- High-level telemetry HUD visualizing system encryption, operational statuses, and operative session state.
- Interactive modular bento grid enabling instant pivoting into any security domain.

### 2. Command Palette & Field Manuals (⌘K)
- Accessible anywhere via <kbd>⌘K</kbd> (Mac) or <kbd>Ctrl+K</kbd> (Windows/Linux).
- Searchable tactical field manuals covering GPS spoofing indicators, electronic warfare protocols, counter-surveillance sweeps, SAST checklists, and phishing defense.
- Direct copy-to-clipboard actions for tactical CLI commands (`netstat`, `lsof`, `rtl_power`, `exiftool`, `yara`, `semgrep`).

### 3. Ghost Link C2 Terminal
- AI command and control interface powered by Gemini with text-to-speech audio feedback.
- Resilient session memory, payload validation, and automatic quota fallback routing.

### 4. SIGINT & Electronic Warfare (EW) Suite
- **GPS Spoofing Diagnostics**: Discrepancy comparison between GPS coordinates and Wi-Fi/Cellular positioning, Horizontal Dilution of Precision (HDOP) alerting, satellite SNR uniformity detection, and live NMEA ($GPGGA, $GPRMC, $GPGSA) sentence analysis.
- **Electronic Warfare (EW) & Jamming**: Real-time canvas SDR spectrum monitor, baseline noise floor tracking (-115 dBm normal to -45 dBm saturated), and interference signature profiling (Broadband Barrage, Comb Jamming, Continuous Wave Spot Jamming).
- **Eavesdropping & Counter-Surveillance**: Network connection inspection (`netstat -ano` / `lsof -i`) for covert C2 beacons and physical RF spectrum sweeping (50MHz – 6GHz) for continuous or store-and-forward bugs.

### 5. Network Recon & Port Scanner
- IPv4 and IPv6 target destination verification.
- Streaming intelligence synthesis with categorized finding filters: Ports, Services, Vulnerabilities (CVEs), Host Status, and Tactical Recommendations.

### 6. Static Source Auditor
- Deep static application security testing (SAST) for logic flaws, injection vectors (SQLi, RCE, SSRF), and hardcoded secrets.
- Supports JavaScript, TypeScript, Python, Go, Rust, and C++.

### 7. Phishing Simulation Lab
- Generates targeted social engineering pretexts and simulated audit campaigns for authorized organizational security training.
- Evaluates attack pretexts, delivery methods, and call-to-action vectors.

### 8. AI Malware Sandbox
- Behavioral and heuristic evaluation of untrusted code snippets, execution chains, and Indicators of Compromise (IoCs).
- Provides threat ratings (Low, Med, High, Critical) and mitigation countermeasures.

### 9. Forensic Metadata X-Ray
- Forensic artifact extraction across raw file headers, logs, email headers, and system telemetry blocks.
- Identifies geolocation coordinates, software build footprints, and OpSec exposure risks.

### 10. Global Intel Recon (OSINT)
- Dual-mode intelligence gathering featuring Google Search web grounding and Geospatial Maps reconnaissance with operator geolocation assistance.

### 11. Covert Identity Synthesis
- Generates synthetic visual persona assets and mission profile avatars using AI image models.

### 12. Encrypted Tactical Storage Vault
- Encrypted repository storing operative scan loot, reports, and audit logs.
- Dual-mode support: Cloud Firestore database with role-based security rules or offline encrypted local storage sandbox.
- In-app markdown viewer modal with full clipboard copy and `.md` file export.

---

## Architecture & Tech Stack

- **Frontend Core**: React 19, TypeScript 5.8, Vite 6
- **Styling & UI**: Tailwind CSS v4, Base UI, Lucide Icons, Motion
- **AI Intelligence**: `@google/genai` TypeScript SDK
  - Primary General: `gemini-3.8-flash`
  - High-Efficiency Fallback: `gemini-3.1-flash-lite`
  - Complex Reasoning: `gemini-3.1-pro-preview`
  - Image Synthesis: `gemini-3.1-flash-image`
  - Text-to-Speech: `gemini-3.8-flash-lite-tts`
- **Persistence & Auth**: Firebase Auth (Google Sign-In) & Cloud Firestore (`firebase@12.12.0`)
- **Cryptography & Utilities**: `crypto-js`, `clsx`, `tailwind-merge`

---

## Installation & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- `npm`, `yarn`, or `pnpm`

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/fortress-command.git
   cd fortress-command
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
   Populate your Gemini API key in `.env`:
   ```bash
   GEMINI_API_KEY="your-google-gemini-api-key"
   ```

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## Environment Configuration

| Variable | Description | Required |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API Key for neural synthesis and recon operations | Yes |
| `APP_URL` | Public origin URL for self-referential links and callbacks | Optional |

---

## Security & Ethical Use Policy

This toolkit is designed exclusively for authorized cybersecurity auditing, defensive research, educational simulation, and authorized red-team engagements.

- **Strictly Prohibited**: Unauthorized reconnaissance, attacking networks without explicit written consent, or malicious electronic warfare interference.
- See our comprehensive [SECURITY.md](SECURITY.md) for vulnerability disclosure and compliance guidelines.

---

## Contributing

We welcome community contributions, security improvements, and documentation enhancements. Please review [CONTRIBUTING.md](CONTRIBUTING.md) and our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening a pull request.

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for full details.
