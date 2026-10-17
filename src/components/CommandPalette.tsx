import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { 
  Search, 
  Terminal, 
  Radio, 
  Satellite, 
  Network, 
  Code, 
  Mail, 
  Bug, 
  Scan, 
  Globe, 
  Image as ImageIcon, 
  HardDrive, 
  BookOpen, 
  ShieldAlert, 
  ShieldCheck, 
  Copy, 
  Check, 
  ChevronRight, 
  ArrowLeft,
  X,
  Compass,
  Cpu,
  Wifi,
  Lock,
  Layers
} from "lucide-react";
import { Button } from "./ui/button";

export type NavModule = 
  | 'dashboard' 
  | 'chat' 
  | 'recon' 
  | 'image' 
  | 'db' 
  | 'ip-scan' 
  | 'source-audit' 
  | 'phishing' 
  | 'malware' 
  | 'metadata' 
  | 'sigint';

interface SecurityDoc {
  id: string;
  title: string;
  category: 'SIGINT' | 'EW' | 'Counter-Surveillance' | 'AppSec' | 'Social Engineering' | 'Malware' | 'Forensics' | 'OpSec';
  summary: string;
  indicators: string[];
  actionSteps: string[];
  tooling: string[];
  tacticalCommands: string[];
  recommendation: string;
}

const SECURITY_DOCS: SecurityDoc[] = [
  {
    id: "gps-spoofing-detection",
    title: "GPS Spoofing & Ephemeris Manipulation Detection",
    category: "SIGINT",
    summary: "Detect and analyze artificial GNSS/GPS constellation spoofing, ephemeris replay attacks, and coordinate drift injection.",
    indicators: [
      "Severe discrepancy between GPS-derived coordinates and Cellular/Wi-Fi positioning (e.g. >500m drift while stationary)",
      "High Horizontal Dilution of Precision (HDOP > 3.0) or sudden coordinate teleportation",
      "Abnormally uniform Satellite Signal-to-Noise Ratio (SNR) across all channels (e.g. identical 48 dB-Hz indicating a signal generator)",
      "Sudden altitude jumps or conflicting timestamps between NMEA sentences"
    ],
    actionSteps: [
      "Cross-examine $GPGGA, $GPRMC, and $GPGSA sentences for coordinate and dilution consistency",
      "Monitor raw satellite SNR levels; authentic satellites exhibit varying orbital signal strengths",
      "Enable cellular triangulation and auxiliary Inertial Measurement Units (IMUs) to confirm velocity vectors",
      "Deploy Faraday shielding enclosures to isolate critical navigation equipment if spoofing is confirmed"
    ],
    tooling: ["GPSTest (Android / iOS)", "RTL-SDR with GPS-SDR-SIM inspector", "HackRF One", "NMEA Analyzer"],
    tacticalCommands: [
      "gpspipe -r | grep -E 'GPGGA|GPRMC|GPGSA'",
      "cgps -s",
      "gpsctl -s 115200 /dev/ttyUSB0"
    ],
    recommendation: "If state-level or high-power RF spoofing is suspected, transition primary navigation to dead-reckoning/inertial sensors and deploy Faraday containment bags until clearing the contested RF zone."
  },
  {
    id: "electronic-warfare-jamming",
    title: "Electronic Warfare (EW) & RF Jamming Protocols",
    category: "EW",
    summary: "Techniques for detecting broadband barrage, comb multi-frequency, and continuous wave (CW) jamming across cellular, GNSS, and ISM bands.",
    indicators: [
      "Abrupt simultaneous drop of all wireless communication channels (LTE, Wi-Fi 2.4/5GHz, GNSS, Bluetooth)",
      "Drastic elevation of the local RF noise floor (e.g. -45 dBm instead of standard -115 dBm)",
      "High-power comb spectral patterns (discrete peaks spaced at 5-10MHz intervals across the band)",
      "Continuous Wave (CW) single-frequency pilot jammer overriding the center carrier frequency"
    ],
    actionSteps: [
      "Sweep key frequency bands: 800MHz/900MHz/1.8GHz (Cellular), 1575.42MHz (GPS L1), 2.4GHz/5.8GHz (Wi-Fi/BT/ISM)",
      "Assess spectral waterfall displays for flat-top noise barrage signatures",
      "Switch immediately to shielded wired Ethernet or optical communications",
      "Deploy directional antennas to locate the jamming emitter bearing via signal triangulation"
    ],
    tooling: ["Software Defined Radio (RTL-SDR / HackRF One / LimeSDR)", "GQRX Software", "SDR#", "Spectrum Analyzer"],
    tacticalCommands: [
      "rtl_power -f 800M:1000M:1M -i 5s -e 1h lte_sweep.csv",
      "rtl_power -f 2400M:2500M:500k -i 1s wifi_band_sweep.csv",
      "hackrf_sweep -f 50:6000 -l 32 -g 20 -w 1000000"
    ],
    recommendation: "Maintain hardened physical line-of-sight optical links or coaxial cables in high-threat environments. Utilize Faraday-shielded field boxes for sensitive computational units."
  },
  {
    id: "eavesdropping-detection",
    title: "Covert Eavesdropping & Transmitter Sweeper Guide",
    category: "Counter-Surveillance",
    summary: "Forensic methodologies for detecting physical RF audio bugs, burst store-and-forward transmitters, and unauthorized digital outbound C2 beacons.",
    indicators: [
      "Unexplained local RF power spikes between 50MHz and 6GHz in an acoustically quiet room",
      "Periodic high-frequency pulsed bursts (characteristic of store-and-forward digital micro-transmitters)",
      "Unusual mobile battery depletion or persistent microphone/camera status indicators",
      "Established outbound socket connections to unknown external IPs from unauthorized processes"
    ],
    actionSteps: [
      "Audit active network sockets with netstat / lsof to detect covert reverse shells or telemetry beacons",
      "Perform near-field RF sweeps across 50MHz - 6GHz using an SDR with omnidirectional antenna",
      "Inspect suspect hardware for parasitic taps on power lines and Ethernet cables",
      "Enforce acoustic masking or white-noise sound dampeners during sensitive operative briefings"
    ],
    tooling: ["Non-Linear Junction Detector (NLJD)", "HackRF One with Portapack", "RF Bug Detector", "Wireshark", "Sysinternals TCPView"],
    tacticalCommands: [
      "netstat -ano | findstr ESTABLISHED",
      "lsof -i -P -n | grep -E 'ESTABLISHED|LISTEN'",
      "ss -tupn | grep -v '127.0.0.1'",
      "tcpdump -nn -i any not port 22 and not port 53 -c 100"
    ],
    recommendation: "Perform regular physical and electromagnetic counter-surveillance sweeps before operations. Isolate mobile devices in double-layer RF attenuation Faraday pouches."
  },
  {
    id: "static-source-auditing",
    title: "Static Application Security Testing (SAST) Checklist",
    category: "AppSec",
    summary: "Systematic auditing techniques for identifying remote code execution, injection vectors, unvalidated deserialization, and authentication bypasses.",
    indicators: [
      "Dynamic string concatenation in database queries (SQL Injection risk)",
      "Invocation of execution primitives (eval, exec, subprocess, system) with untrusted user input",
      "Server-Side Request Forgery (SSRF) via unconstrained HTTP client fetches",
      "Hardcoded API keys, JWT signing secrets, or private keys inside repository source files"
    ],
    actionSteps: [
      "Enforce parameterized queries or ORM abstraction for all data layer interactions",
      "Validate all input schemas using strict validation libraries (e.g. Zod, Pydantic)",
      "Eliminate dynamic string evaluation and restrict system process execution",
      "Audit third-party dependencies against national vulnerability databases (CVEs)"
    ],
    tooling: ["Semgrep", "SonarQube", "Snyk", "Trivy", "ESLint Security Rules"],
    tacticalCommands: [
      "semgrep --config=auto ./src",
      "npm audit --audit-level=high",
      "trufflehog filesystem --directory=. --only-verified"
    ],
    recommendation: "Integrate automated SAST scanners into CI/CD pipelines. Never permit raw user input into file paths, OS commands, or dynamic SQL queries."
  },
  {
    id: "phishing-simulation-defense",
    title: "Social Engineering & Spear-Phishing Defense Protocol",
    category: "Social Engineering",
    summary: "Analyzing spear-phishing pretexts, credential harvesting vectors, lookalike domains, and technical email verification standards.",
    indicators: [
      "Urgent or fear-inducing pretext demanding immediate credential verification or MFA bypass",
      "Lookalike domain names utilizing homoglyphs or Punycode substitutions (e.g. rnicrosoft vs microsoft)",
      "Mismatched Sender Policy Framework (SPF), DKIM signature, or DMARC alignment records",
      "Direct links navigating to external identity proxy reverse-proxies (e.g. Evilginx2 patterns)"
    ],
    actionSteps: [
      "Inspect raw email RFC 822 headers for Authentication-Results, SPF, and Return-Path headers",
      "Verify domains against WHOIS registration age; recently created domains (<30 days) represent elevated risk",
      "Enforce hardware FIDO2/WebAuthn security keys to defeat real-time reverse proxy phishing",
      "Conduct non-punitive simulated training campaigns to establish an organizational security culture"
    ],
    tooling: ["MXToolbox", "GoPhish", "URLScan.io", "VirusTotal", "Shodan"],
    tacticalCommands: [
      "dig +short TXT _dmarc.targetdomain.com",
      "dig +short TXT targetdomain.com | grep 'v=spf1'",
      "whois targetdomain.com | grep -E 'Creation Date|Registrar'"
    ],
    recommendation: "Deploy strict DMARC 'p=reject' policies across all organizational domains. Require hardware tokens for all privileged authentication flows."
  },
  {
    id: "malware-heuristics-sandbox",
    title: "Malware Behavioral Analysis & IoC Extraction",
    category: "Malware",
    summary: "Heuristic and dynamic detection criteria for identifying trojans, ransomware, reverse shells, and persistence implants.",
    indicators: [
      "Anomalous parent-child process relationships (e.g. winword.exe launching cmd.exe or powershell.exe)",
      "Registry persistence under HKCU\\...\\Run or Linux systemd cron tampering",
      "Process hollowing, reflective DLL loading, or unusual memory permission allocations (PAGE_EXECUTE_READWRITE)",
      "High entropy binary sections indicating encrypted or packed payloads"
    ],
    actionSteps: [
      "Analyze binary imports for evasion APIs (VirtualAlloc, WriteProcessMemory, CreateRemoteThread)",
      "Detonate suspect binaries only inside air-gapped, instrumented sandbox environments",
      "Extract Indicators of Compromise (IoCs): file hashes (SHA-256), C2 domains, mutex names",
      "Deploy endpoint detection (EDR) rules to terminate unauthorized shell spawn events"
    ],
    tooling: ["Ghidra", "x64dbg", "Process Hacker / Process Explorer", "YARA", "Cuckoo Sandbox"],
    tacticalCommands: [
      "sha256sum suspicious_payload.bin",
      "strings -a suspicious_payload.bin | grep -iE 'http|powershell|reg add|socket'",
      "yara -r malware_rules.yar ./suspicious_folder"
    ],
    recommendation: "Never execute untrusted payloads on host systems. Employ isolated disposable microVMs with network interception bridges for all reverse-engineering tasks."
  },
  {
    id: "metadata-forensic-sanitization",
    title: "Forensic Metadata Extraction & OpSec Scrubbing",
    category: "Forensics",
    summary: "Uncovering and neutralizing hidden forensic artifacts, EXIF geolocation coordinates, system signatures, and hardware markers.",
    indicators: [
      "Embedded GPS coordinates (latitude/longitude/altitude) in camera and smartphone image EXIF tags",
      "Document revision history exposing author names, corporate usernames, and internal file paths",
      "HTTP server banners disclosing precise operating system and web server build numbers",
      "Printer tracking yellow micro-dots encoding hardware serial numbers and timestamps"
    ],
    actionSteps: [
      "Extract all EXIF, XMP, and IPTC metadata before publishing mission imagery or documents",
      "Scrub document revision tracks and comment blocks before transmission",
      "Strip server software headers (Server, X-Powered-By) to prevent automated OSINT fingerprinting",
      "Enforce automated metadata sanitization gateways on all public-facing upload channels"
    ],
    tooling: ["ExifTool", "MAT2 (Metadata Anonymisation Toolkit)", "FOCA", "Binwalk"],
    tacticalCommands: [
      "exiftool -all= target_image.jpg",
      "exiftool -gps* target_photo.jpg",
      "mat2 target_document.pdf"
    ],
    recommendation: "Treat every transmitted file as an operational signature. Enforce rigorous, automated metadata stripping prior to external transfer."
  }
];

const MODULE_COMMANDS = [
  { id: 'dashboard', name: 'Dashboard', shortcut: 'D', category: 'Navigation', icon: <Terminal className="w-4 h-4 text-primary" />, desc: 'Nexus Operations Center & status overview' },
  { id: 'chat', name: 'Ghost Link C2', shortcut: 'G', category: 'Navigation', icon: <Terminal className="w-4 h-4 text-emerald-400" />, desc: 'AI command terminal & tactical neural link' },
  { id: 'sigint', name: 'SIGINT & EW Suite', shortcut: 'S', category: 'Navigation', icon: <Radio className="w-4 h-4 text-red-400" />, desc: 'RF spectrum, GPS spoofing & eavesdropping defense' },
  { id: 'ip-scan', name: 'Network Recon Scanner', shortcut: 'N', category: 'Navigation', icon: <Network className="w-4 h-4 text-blue-400" />, desc: 'IP port scanning & threat vector reconnaissance' },
  { id: 'source-audit', name: 'Static Source Auditor', shortcut: 'A', category: 'Navigation', icon: <Code className="w-4 h-4 text-yellow-400" />, desc: 'Static code vulnerability analysis & remediation' },
  { id: 'phishing', name: 'Phishing Lab', shortcut: 'P', category: 'Navigation', icon: <Mail className="w-4 h-4 text-amber-400" />, desc: 'Social engineering pretexts & security simulations' },
  { id: 'malware', name: 'AI Malware Sandbox', shortcut: 'M', category: 'Navigation', icon: <Bug className="w-4 h-4 text-rose-400" />, desc: 'Behavioral analysis & IoC signature detection' },
  { id: 'metadata', name: 'Metadata X-Ray', shortcut: 'X', category: 'Navigation', icon: <Scan className="w-4 h-4 text-cyan-400" />, desc: 'Artifact extraction & forensic telemetry scanning' },
  { id: 'recon', name: 'Global Intel Recon', shortcut: 'R', category: 'Navigation', icon: <Globe className="w-4 h-4 text-indigo-400" />, desc: 'Live search grounding & geospatial tracking' },
  { id: 'image', name: 'Covert Identity Synth', shortcut: 'C', category: 'Navigation', icon: <ImageIcon className="w-4 h-4 text-purple-400" />, desc: 'Synthetic visual persona & asset generation' },
  { id: 'db', name: 'Tactical Vault', shortcut: 'V', category: 'Navigation', icon: <HardDrive className="w-4 h-4 text-blue-500" />, desc: 'Encrypted loot repository & stored audit logs' },
];

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (module: NavModule) => void;
}) {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'modules' | 'docs'>('all');
  const [selectedDoc, setSelectedDoc] = useState<SecurityDoc | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Reset query and selectedDoc when opening or closing
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedDoc(null);
    }
  }, [open]);

  // Filter modules
  const filteredModules = useMemo(() => {
    if (filterType === 'docs') return [];
    const q = query.toLowerCase().trim();
    if (!q) return MODULE_COMMANDS;
    return MODULE_COMMANDS.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.desc.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    );
  }, [query, filterType]);

  // Filter docs
  const filteredDocs = useMemo(() => {
    if (filterType === 'modules') return [];
    const q = query.toLowerCase().trim();
    if (!q) return SECURITY_DOCS;
    return SECURITY_DOCS.filter(d => 
      d.title.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.tooling.some(t => t.toLowerCase().includes(q)) ||
      d.indicators.some(i => i.toLowerCase().includes(q))
    );
  }, [query, filterType]);

  const handleSelectModule = (modId: string) => {
    onNavigate(modId as NavModule);
    onOpenChange(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-3xl p-0 gap-0 overflow-hidden bg-[#0A0A0B] border-primary/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl max-h-[85vh] flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette & Security Documentation</DialogTitle>
          <DialogDescription>Navigate modules or search security documentation</DialogDescription>
        </DialogHeader>

        {/* Top Header / Search Bar */}
        <div className="p-4 border-b border-white/10 bg-secondary/30 flex items-center gap-3 shrink-0">
          {selectedDoc ? (
            <button
              onClick={() => setSelectedDoc(null)}
              className="p-2 hover:bg-white/10 rounded-lg text-primary transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </button>
          ) : (
            <Search className="w-5 h-5 text-primary opacity-70 shrink-0" />
          )}

          {!selectedDoc ? (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command, module name, or search security documentation..."
              className="w-full bg-transparent border-none text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60 font-mono"
              autoFocus
            />
          ) : (
            <div className="flex-1 truncate">
              <span className="text-xs font-black text-white uppercase tracking-wider">{selectedDoc.title}</span>
            </div>
          )}

          {query && !selectedDoc && (
            <button 
              onClick={() => setQuery("")}
              className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground bg-black/40 border border-white/10 rounded">
              ESC to close
            </kbd>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        {!selectedDoc && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5 bg-black/40 shrink-0 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                filterType === 'all' 
                  ? 'bg-primary text-white shadow-[0_0_10px_rgba(62,99,221,0.3)]' 
                  : 'text-muted-foreground hover:text-white bg-secondary/20'
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => setFilterType('modules')}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                filterType === 'modules' 
                  ? 'bg-primary text-white shadow-[0_0_10px_rgba(62,99,221,0.3)]' 
                  : 'text-muted-foreground hover:text-white bg-secondary/20'
              }`}
            >
              Tactical Modules ({filteredModules.length})
            </button>
            <button
              onClick={() => setFilterType('docs')}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                filterType === 'docs' 
                  ? 'bg-primary text-white shadow-[0_0_10px_rgba(62,99,221,0.3)]' 
                  : 'text-muted-foreground hover:text-white bg-secondary/20'
              }`}
            >
              Security Field Docs ({filteredDocs.length})
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar min-h-0 bg-gradient-to-b from-transparent to-black/30">
          {selectedDoc ? (
            /* Document Detail View */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Card */}
              <div className="bg-secondary/20 border border-white/10 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                    {selectedDoc.category}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedDoc.summary)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-white font-mono"
                  >
                    {copiedText === selectedDoc.summary ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copiedText === selectedDoc.summary ? "Copied" : "Copy Summary"}
                  </button>
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wide mb-1">{selectedDoc.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedDoc.summary}</p>
              </div>

              {/* Key Indicators */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Tactical Indicators & Anomalies
                </span>
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-2">
                  {selectedDoc.indicators.map((ind, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground/90 font-mono">
                      <span className="text-destructive font-bold">!</span>
                      <span>{ind}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Steps */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> Recommended Action Steps
                </span>
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-2">
                  {selectedDoc.actionSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-foreground/90">
                      <span className="text-[9px] font-mono text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">0{i+1}</span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tactical Commands */}
              {selectedDoc.tacticalCommands.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-primary" /> Command Line Operations & Audit Scripts
                  </span>
                  <div className="space-y-2">
                    {selectedDoc.tacticalCommands.map((cmd, i) => (
                      <div key={i} className="flex items-center justify-between bg-black/60 border border-white/5 p-3 rounded-lg font-mono text-xs text-emerald-400">
                        <span className="truncate mr-2">$ {cmd}</span>
                        <button
                          onClick={() => copyToClipboard(cmd)}
                          className="shrink-0 p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-white"
                          title="Copy command"
                        >
                          {copiedText === cmd ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tooling */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" /> Recommended Hardware & Software Tooling
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedDoc.tooling.map((tool, i) => (
                    <span key={i} className="text-[10px] font-mono font-bold px-2.5 py-1 bg-secondary/40 border border-white/10 text-white rounded-lg">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Final Directive */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-xs font-mono text-primary/90 leading-relaxed">
                <span className="font-bold uppercase tracking-wider block mb-1">Tactical Directive:</span>
                {selectedDoc.recommendation}
              </div>
            </div>
          ) : (
            /* Results List */
            <>
              {/* Modules Group */}
              {filteredModules.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2">
                    Command Navigation ({filteredModules.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredModules.map((mod) => (
                      <button
                        key={mod.id}
                        onClick={() => handleSelectModule(mod.id)}
                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-white/5 hover:border-primary/40 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5 group-hover:bg-primary/20 transition-colors">
                            {mod.icon}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                              {mod.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {mod.desc}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground bg-black/40 border border-white/5 rounded opacity-60 group-hover:opacity-100">
                            {mod.shortcut}
                          </kbd>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Documentation Group */}
              {filteredDocs.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2">
                    Tactical Security Documentation ({filteredDocs.length})
                  </span>
                  <div className="space-y-2">
                    {filteredDocs.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className="w-full flex items-start justify-between p-3.5 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-white/5 hover:border-primary/40 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5 group-hover:bg-primary/20 text-primary transition-colors shrink-0 mt-0.5">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                                {doc.title}
                              </span>
                              <span className="text-[8px] font-mono uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                                {doc.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {doc.summary}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doc.tooling.slice(0, 3).map((t, i) => (
                                <span key={i} className="text-[8px] font-mono text-muted-foreground bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-1">
                          View Manual <ChevronRight className="w-4 h-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {filteredModules.length === 0 && filteredDocs.length === 0 && (
                <div className="text-center py-16 space-y-3 opacity-40">
                  <Search className="w-8 h-8 text-primary mx-auto opacity-50" />
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    No modules or security documentation matching "{query}"
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-3 border-t border-white/10 bg-black/50 text-[10px] font-mono text-muted-foreground flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1 py-0.5 bg-secondary/50 rounded border border-white/10 text-white">↑</kbd> <kbd className="px-1 py-0.5 bg-secondary/50 rounded border border-white/10 text-white">↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 bg-secondary/50 rounded border border-white/10 text-white">ENTER</kbd> select</span>
            <span><kbd className="px-1 py-0.5 bg-secondary/50 rounded border border-white/10 text-white">ESC</kbd> close</span>
          </div>
          <span className="text-primary font-bold">NEXUS // COMMAND_PALETTE</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
