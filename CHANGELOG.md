# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-10-17

### Added
- **Command Palette (`CommandPalette.tsx`)**: Global quick navigation dialog accessible via <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> or header launcher.
- **Searchable Security Documentation**: Comprehensive tactical field manuals integrated into the command palette covering GPS spoofing, electronic warfare, counter-surveillance sweeps, SAST, phishing defense, malware heuristics, and metadata sanitization.
- **In-Palette Manual Reader**: Dedicated detail view with copyable CLI commands (`netstat`, `lsof`, `semgrep`, `trufflehog`, `exiftool`) and operational directives.
- **Operations Center Launcher**: Integrated quick command palette triggers directly into the main Dashboard bento card.

### Fixed
- Fixed unhandled asynchronous geolocation promise rejections in `IntelRecon`.
- Fixed case-sensitive tag filtering bug in `IPScanner`.

---

## [1.1.0] - 2026-09-28

### Added
- **AI Quota Fallback Pipeline**: Built `safeGenerateContent` and `safeGenerateContentStream` wrappers in `gemini.ts` to automatically route requests from `gemini-3.8-flash` to high-efficiency `gemini-3.1-flash-lite` upon daily token limit exhaustion (`RESOURCE_EXHAUSTED` / 429).
- **Ghost Link Quota Recovery**: Automatic session regeneration with fallback model in `GhostChat` to ensure uninterrupted C2 operations.
- **Enhanced Tactical Vault**: In-app markdown viewer modal, clipboard copy actions, and report `.md` file export.
- **In-App Purge Confirmation**: Replaced blocking `window.confirm` with non-intrusive inline record purging.

### Fixed
- Fixed database instance check logic in `firebase.ts` collection and doc wrappers that previously bypassed real Firestore when online.
- Fixed fatal crash in `DbManager` when sorting or displaying mixed ISO timestamp strings and Firestore Timestamp objects.
- Corrected model identifier strings according to Google GenAI SDK standards.

---

## [1.0.0] - 2026-07-18

### Added
- **Initial Release of Nexus Command // Core**:
  - Tactical Operations Dashboard with responsive bento grid layout.
  - Ghost Link AI C2 terminal with Text-to-Speech audio synthesis.
  - Signals Intelligence (SIGINT) & Electronic Warfare (EW) Suite with live HTML5 canvas spectrum visualizer.
  - Network Reconnaissance Scanner with stream discovery tags.
  - Static Source Code Auditor with multi-language vulnerability detection.
  - Phishing Simulation Lab for authorized training campaigns.
  - AI Malware Sandbox for heuristic behavioral analysis.
  - Forensic Metadata X-Ray for artifact extraction.
  - Global Intel Recon with Google Search and Maps grounding.
  - Covert Identity Synthesis for mission avatar generation.
  - Encrypted Tactical Storage Vault with dual Cloud Firestore and offline sandbox storage.
