# Technical Architecture & System Design

This document details the architecture, design principles, data flow, and component relationships of the **Fortress Command** platform.

---

## 1. High-Level Architecture

Fortress Command is built as an ultra-responsive, modular Single Page Application (SPA) backed by modern Google GenAI models and Cloud Firestore persistence, with built-in zero-dependency offline fallback.

```
+-------------------------------------------------------------------------+
|                              Client Layer                               |
|                                                                         |
|  +--------------------+  +--------------------+  +--------------------+ |
|  |  Operations HUD    |  |  Command Palette   |  |   SIGINT & EW      | |
|  |  (App.tsx / Dash)  |  |  (⌘K Dialog)       |  |   (SDR Canvas)     | |
|  +---------+----------+  +---------+----------+  +---------+----------+ |
|            |                       |                       |            |
|  +---------v-----------------------v-----------------------v----------+ |
|  |                     Specialized Tool Modules                       | |
|  |  [IPScan] [SourceAudit] [PhishLab] [MalwareBox] [MetadataX] [Recon]| |
|  +---------------------------------+----------------------------------+ |
+------------------------------------|------------------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
+--------------v---------------+           +---------------v--------------+
|       AI Services Layer       |           |     Persistence Layer        |
|                               |           |                              |
|  +-------------------------+  |           |  +------------------------+  |
|  | safeGenerateContent     |  |           |  | Cloud Firestore        |  |
|  | (Primary: 3.8-flash)    |  |           |  | - Rules Engine         |  |
|  +------------+------------+  |           |  | - Loot Collection      |  |
|               | fallback      |           |  +-----------+------------+  |
|  +------------v------------+  |           |              | offline       |
|  | gemini-3.1-flash-lite   |  |           |  +-----------v------------+  |
|  | (Quota Resiliency)      |  |           |  | Mock DB (localStorage) |  |
|  +-------------------------+  |           |  +------------------------+  |
+-------------------------------+           +------------------------------+
```

---

## 2. Directory Structure

```
├── .github/                      # GitHub workflow and issue/PR templates
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── security_vulnerability.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── components/
│   │   ├── ui/                   # Reusable UI primitives (dialog, button, etc.)
│   │   ├── CommandPalette.tsx    # Global command palette & security field manuals
│   │   ├── Dashboard.tsx         # Main operations center HUD
│   │   ├── DbManager.tsx         # Encrypted tactical vault manager
│   │   ├── GhostChat.tsx         # AI C2 command terminal
│   │   ├── IPScanner.tsx         # Network reconnaissance & port scanner
│   │   ├── ImageOps.tsx          # Synthetic visual persona synthesis
│   │   ├── IntelRecon.tsx        # Global web & map recon grounding
│   │   ├── MalwareAnalyzer.tsx   # AI heuristic malware sandbox
│   │   ├── MetadataX.tsx         # Forensic metadata extraction
│   │   ├── PhishingLab.tsx       # Social engineering simulation lab
│   │   ├── SigintSuite.tsx       # SIGINT, GPS spoofing & EW suite
│   │   └── SourceAuditor.tsx     # Static source code auditor
│   ├── lib/
│   │   ├── firebase.ts           # Firestore & Auth with offline sandbox fallback
│   │   ├── gemini.ts             # Google GenAI SDK client with quota fallback
│   │   └── utils.ts              # Styling and class merge utilities
│   ├── App.tsx                   # Top-level shell, routing & navigation
│   ├── index.css                 # Global CSS & Tailwind configuration
│   └── main.tsx                  # React entry point
├── ARCHITECTURE.md               # Technical architecture documentation
├── CHANGELOG.md                  # Project release changelog
├── CODE_OF_CONDUCT.md            # Contributor Covenant Code of Conduct
├── CONTRIBUTING.md               # Contribution and development guidelines
├── LICENSE                       # MIT License
├── README.md                     # Main repository documentation
├── ROADMAP.md                    # Strategic product roadmap
├── SECURITY.md                   # Security policy & disclosure protocols
├── firestore.rules               # Firestore security & RBAC rules
├── package.json                  # Dependencies and build scripts
└── vite.config.ts                # Vite build and plugin configuration
```

---

## 3. Core Architectural Subsystems

### 3.1 AI Orchestration & Resiliency Pipeline (`src/lib/gemini.ts`)
- Utilizes the modern `@google/genai` TypeScript SDK.
- **Dynamic Quota Fallback**:
  Network scanning, static analysis, malware heuristic detonation, and SIGINT analysis first execute against `gemini-3.8-flash`.
  If the API responds with `RESOURCE_EXHAUSTED`, `429`, or quota saturation, `safeGenerateContent` and `safeGenerateContentStream` automatically re-route the request to `gemini-3.1-flash-lite`, ensuring uninterrupted operations without manual user intervention.
- **Multimodal Capabilities**:
  - Live Search Grounding (`tools: [{ googleSearch: {} }]`)
  - Geospatial Grounding (`tools: [{ googleMaps: {} }]`)
  - Image Synthesis (`gemini-3.1-flash-image`)
  - Audio Text-to-Speech (`gemini-3.8-flash-lite-tts`)

### 3.2 Dual-Tier Data Persistence (`src/lib/firebase.ts`)
- **Online Mode**: Authenticates with Firebase Google Auth and stores encrypted loot documents in Cloud Firestore with strict user isolation (`where('userId', '==', user.uid)`).
- **Offline / Sandbox Mode**: Automatically activates if Firestore credentials are in sandbox mode or offline. Emulates database collections and document listeners in `localStorage`, maintaining complete operational UI fidelity without throwing unhandled network errors.

### 3.3 Security Rules Enforcement (`firestore.rules`)
- Validates that every incoming loot record strictly contains:
  `['userId', 'type', 'target', 'data', 'timestamp']`
- Guarantees document ownership validation: `resource.data.userId == request.auth.uid`.
- Restricts document payload size to prevent database denial-of-service.

---

## 4. Design Standards
- **Cyber-Terminal Bento Aesthetic**: High contrast, subtle neon accents, muted dark mode surfaces (`#0A0A0B`), crisp typography.
- **No Pill Discipline**: Uses sharp, slightly rounded structural badges and buttons with distinct borders.
- **Zero Inline Styles**: All layout and styling is strictly managed via Tailwind CSS utilities.
