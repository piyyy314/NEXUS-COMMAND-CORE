import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Radio, Satellite, Compass, ShieldAlert, Activity, Cpu, Wifi, 
  Search, Database, Save, Download, RefreshCw, Layers, Server, 
  Terminal, ShieldCheck, Play, Square, Network, HelpCircle, Copy, Check
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { analyzeSigintData, handleAiError } from "@/lib/gemini";
import Markdown from "react-markdown";
import { db, handleFirestoreError, OperationType, collection, addDoc } from "@/lib/firebase";
import type { User } from "firebase/auth";

// Types
type GpsSimulationType = "safe" | "spoofed_jump" | "spoofed_snr";
type EwSimulationType = "clean" | "broadband" | "comb" | "cw";
type BandType = "800mhz" | "900mhz" | "1.57ghz" | "1.8ghz" | "2.4ghz";

export function SigintSuite({ user }: { user: User | null }) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<"gps" | "ew" | "eavesdropping">("gps");

  // Common states
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- GPS SPOOFING STATES ---
  const [gpsSimType, setGpsSimType] = useState<GpsSimulationType>("safe");
  const [customNmea, setCustomNmea] = useState("");
  const [gpsDiscrepancy, setGpsDiscrepancy] = useState<any>({
    gpsCoords: "34.0522° N, 118.2437° W",
    wifiCoords: "34.0524° N, 118.2439° W",
    hdop: 1.1,
    altitudeGps: "104.2 m",
    altitudeWifi: "102.5 m",
    distance: "23 meters (Safe)",
    status: "NORMAL",
  });

  const satData = useMemo(() => {
    if (gpsSimType === "safe") {
      return [
        { id: "GP-03", snr: 32, type: "GPS" },
        { id: "GP-07", snr: 41, type: "GPS" },
        { id: "GP-14", snr: 27, type: "GPS" },
        { id: "GP-22", snr: 38, type: "GPS" },
        { id: "GP-28", snr: 24, type: "GPS" },
        { id: "GL-05", snr: 35, type: "GLONASS" },
        { id: "GL-12", snr: 29, type: "GLONASS" },
      ];
    } else if (gpsSimType === "spoofed_jump") {
      return [
        { id: "GP-03", snr: 32, type: "GPS" },
        { id: "GP-07", snr: 15, type: "GPS" }, // degrading
        { id: "GP-14", snr: 48, type: "GPS" }, // abnormally high
        { id: "GP-22", snr: 47, type: "GPS" }, // abnormally high
        { id: "GP-28", snr: 12, type: "GPS" },
        { id: "GL-05", snr: 8, type: "GLONASS" }, // lost lock
        { id: "GL-12", snr: 5, type: "GLONASS" },
      ];
    } else {
      // spoofed_snr: identical high signal strength
      return [
        { id: "GP-03", snr: 48, type: "GPS" },
        { id: "GP-07", snr: 48, type: "GPS" },
        { id: "GP-14", snr: 48, type: "GPS" },
        { id: "GP-22", snr: 48, type: "GPS" },
        { id: "GP-28", snr: 48, type: "GPS" },
        { id: "GL-05", snr: 48, type: "GLONASS" },
        { id: "GL-12", snr: 48, type: "GLONASS" },
      ];
    }
  }, [gpsSimType]);

  const nmeaLogs = useMemo(() => {
    if (gpsSimType === "safe") {
      return `$GPGGA,233120.00,3405.2215,N,11824.3724,W,1,07,1.1,104.2,M,-32.4,M,,*5C\n$GPRMC,233120.00,A,3405.2215,N,11824.3724,W,0.024,,180726,,,A*6D\n$GPGSA,A,3,03,07,14,22,28,05,12,,,,,,2.1,1.1,1.8*35`;
    } else if (gpsSimType === "spoofed_jump") {
      return `$GPGGA,233120.00,3409.2287,N,11832.8715,W,1,03,4.8,312.4,M,-32.4,M,,*6F\n$GPRMC,233120.00,A,3409.2287,N,11832.8715,W,120.4,,180726,,,A*5A\n$GPGSA,A,3,14,22,03,,,,,,,,,,5.2,4.8,3.9*32`;
    } else {
      return `$GPGGA,233120.00,3405.2215,N,11824.3724,W,1,07,0.8,104.2,M,-32.4,M,,*52\n$GPRMC,233120.00,A,3405.2215,N,11824.3724,W,0.000,,180726,,,A*61\n$GPGSA,A,3,03,07,14,22,28,05,12,,,,,,0.9,0.8,0.5*3C`;
    }
  }, [gpsSimType]);

  useEffect(() => {
    if (gpsSimType === "safe") {
      setGpsDiscrepancy({
        gpsCoords: "34.0522° N, 118.2437° W",
        wifiCoords: "34.0524° N, 118.2439° W",
        hdop: 1.1,
        altitudeGps: "104.2 m",
        altitudeWifi: "102.5 m",
        distance: "23 meters (Safe Range)",
        status: "NORMAL",
      });
    } else if (gpsSimType === "spoofed_jump") {
      setGpsDiscrepancy({
        gpsCoords: "34.0922° N, 118.3287° W", // Sudden jump
        wifiCoords: "34.0524° N, 118.2439° W", // WiFi remains in LA
        hdop: 4.8, // Bad dilution
        altitudeGps: "312.4 m",
        altitudeWifi: "102.5 m",
        distance: "9.3 km (Abnormal Discrepancy)",
        status: "CRITICAL ALERT: COORD JUMP",
      });
    } else {
      setGpsDiscrepancy({
        gpsCoords: "34.0522° N, 118.2437° W",
        wifiCoords: "34.0524° N, 118.2439° W",
        hdop: 0.8, // suspicious too-perfect precision
        altitudeGps: "104.2 m",
        altitudeWifi: "102.5 m",
        distance: "23 meters (Safe Distance)",
        status: "WARNING: SATELLITE SNR UNIFORMITY",
      });
    }
    setCustomNmea(nmeaLogs);
  }, [gpsSimType, nmeaLogs]);


  // --- EW & JAMMING STATES ---
  const [ewBand, setEwBand] = useState<BandType>("2.4ghz");
  const [ewSimType, setEwSimType] = useState<EwSimulationType>("clean");
  const [noiseFloor, setNoiseFloor] = useState(-115);
  const [freqHz, setFreqHz] = useState("2.412 GHz");
  const [customSpectrumLog, setCustomSpectrumLog] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Generate spectral scan logs for AI to consume
    let log = `BAND: ${ewBand.toUpperCase()}\nCENTER FREQUENCY: ${freqHz}\n`;
    if (ewSimType === "clean") {
      setNoiseFloor(-112 - Math.floor(Math.random() * 5));
      log += `NOISE FLOOR: -114 dBm\nSIGNAL STATE: NORMAL\nINTERFERENCE: NONE\nSPECTRAL PATTERN: White Gaussian Noise, minimal carrier harmonics.`;
    } else if (ewSimType === "broadband") {
      setNoiseFloor(-45 - Math.floor(Math.random() * 8));
      log += `NOISE FLOOR: -48 dBm (SEVERE SATURATION)\nSIGNAL STATE: BLOCKED\nINTERFERENCE: broadband noise barrage jammer\nSPECTRAL PATTERN: Flat-top high power barrage over entire band.`;
    } else if (ewSimType === "comb") {
      setNoiseFloor(-65 - Math.floor(Math.random() * 6));
      log += `NOISE FLOOR: -68 dBm\nSIGNAL STATE: DEGRADED\nINTERFERENCE: comb multi-frequency jammer\nSPECTRAL PATTERN: Discrete high-power spikes separated by equal 10MHz spacing gaps.`;
    } else {
      setNoiseFloor(-35 - Math.floor(Math.random() * 5));
      log += `NOISE FLOOR: -38 dBm\nSIGNAL STATE: SATURATED\nINTERFERENCE: Continuous Wave (CW) single frequency pilot jammer\nSPECTRAL PATTERN: Massive narrow-bandwidth continuous wave tone directly overriding center frequency.`;
    }
    setCustomSpectrumLog(log);
  }, [ewBand, ewSimType, freqHz]);

  useEffect(() => {
    if (ewBand === "800mhz") setFreqHz("806.5 MHz (LTE Band 20)");
    else if (ewBand === "900mhz") setFreqHz("935.2 MHz (GSM 900 Downlink)");
    else if (ewBand === "1.57ghz") setFreqHz("1575.42 MHz (GPS L1)");
    else if (ewBand === "1.8ghz") setFreqHz("1805.0 MHz (LTE Band 3)");
    else setFreqHz("2.412 GHz (Wi-Fi Channel 1 / BT)");
  }, [ewBand]);

  // Spectrum simulation canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      // Draw background grid
      ctx.strokeStyle = "rgba(62, 99, 221, 0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Draw Noise Floor Reference Line
      const noiseY = height - ((noiseFloor + 120) * (height / 100));
      ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, noiseY);
      ctx.lineTo(width, noiseY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
      ctx.font = "8px monospace";
      ctx.fillText(`Noise Floor: ${noiseFloor} dBm`, 10, noiseY - 4);

      // Render Spectrum Wave
      ctx.beginPath();
      ctx.strokeStyle = ewSimType === "clean" ? "#3E63DD" : "#EF4444";
      ctx.lineWidth = 2;

      for (let x = 0; x < width; x++) {
        let y = height - 20;

        // Base noise
        let noise = Math.sin(x * 0.2 + offset) * 3 + Math.cos(x * 0.4 - offset * 0.5) * 2;
        noise += (Math.random() - 0.5) * 6;

        if (ewSimType === "clean") {
          // clean signal: low baseline, one small signal peak in the center
          const distToCenter = Math.abs(x - width / 2);
          const signalPeak = distToCenter < 30 ? Math.cos(distToCenter / 30 * Math.PI) * 45 : 0;
          y = height - 30 - noise - signalPeak;
        } else if (ewSimType === "broadband") {
          // broadband jamming: high noise baseline across the entire spectrum
          y = height - 120 - noise;
        } else if (ewSimType === "comb") {
          // comb jamming: several sharp high peaks separated evenly
          let combPeak = 0;
          const spacing = 80;
          for (let p = 40; p < width; p += spacing) {
            const dist = Math.abs(x - p);
            if (dist < 15) {
              combPeak = Math.max(combPeak, Math.cos(dist / 15 * Math.PI) * 110);
            }
          }
          y = height - 40 - noise - combPeak;
        } else if (ewSimType === "cw") {
          // Continuous Wave: one massive sharp peak that overrides everything
          const distToCenter = Math.abs(x - width / 2);
          const cwPeak = distToCenter < 8 ? Math.cos(distToCenter / 8 * Math.PI) * 150 : 0;
          y = height - 35 - noise - cwPeak;
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Create waterfall style fading at the bottom
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fillStyle = ewSimType === "clean" ? "rgba(62, 99, 221, 0.05)" : "rgba(239, 68, 68, 0.05)";
      ctx.fill();

      offset += 0.15;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [ewSimType, noiseFloor]);


  // --- EAVESDROPPING STATES ---
  const [eavesdroppingMode, setEavesdroppingMode] = useState<"network" | "rf_sweep">("network");
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepProgress, setSweepProgress] = useState(0);
  const [customEavesLog, setCustomEavesLog] = useState("");

  const processConnections = useMemo(() => {
    return [
      { pid: 4810, process: "chrome.exe", local: "192.168.1.144:54201", remote: "142.250.190.46:443", state: "ESTABLISHED", secure: true },
      { pid: 914, process: "discord.exe", local: "192.168.1.144:51299", remote: "162.159.135.234:443", state: "ESTABLISHED", secure: true },
      { pid: 14812, process: "covert_beacon.bin", local: "192.168.1.144:49102", remote: "45.138.16.89:8080", state: "ESTABLISHED", secure: false, alert: "HIGH RISK C2 BEACON" },
      { pid: 212, process: "systemd-resolved", local: "127.0.0.1:53", remote: "0.0.0.0:0", state: "LISTENING", secure: true },
      { pid: 3109, process: "spotify.exe", local: "192.168.1.144:54311", remote: "104.199.65.124:443", state: "ESTABLISHED", secure: true },
      { pid: 7421, process: "svchost_local.exe", local: "192.168.1.144:49502", remote: "185.220.101.5:9001", state: "ESTABLISHED", secure: false, alert: "TOR EXIT NODE CONNECTION" },
    ];
  }, []);

  const rfSpikes = useMemo(() => {
    return [
      { freq: "433.92 MHz", level: "-48 dBm", type: "Keyfob / ISM Burst", suspicious: false },
      { freq: "868.10 MHz", level: "-88 dBm", type: "IoT Lora Node", suspicious: false },
      { freq: "915.00 MHz", level: "-32 dBm", type: "RF Spike (Continuous)", suspicious: true, alert: "Possible Local Audio Transmitter" },
      { freq: "2.441 GHz", level: "-52 dBm", type: "Bluetooth FHSS", suspicious: false },
      { freq: "5.180 GHz", level: "-72 dBm", type: "Wi-Fi Backhaul", suspicious: false },
      { freq: "5.820 GHz", level: "-38 dBm", type: "Unusual Pulsed Spike", suspicious: true, alert: "Store-and-Forward Covert Bug" },
    ];
  }, []);

  useEffect(() => {
    if (eavesdroppingMode === "network") {
      let log = "DIGITAL NETWORK CONNECTIONS LOG (netstat -ano / lsof -i):\n";
      processConnections.forEach(c => {
        log += `[PID: ${c.pid}] ${c.process} | Local: ${c.local} --> Remote: ${c.remote} [${c.state}] ${c.alert ? `<< ALERT: ${c.alert} >>` : ""}\n`;
      });
      setCustomEavesLog(log);
    } else {
      let log = "PHYSICAL LOCAL RF SWEEP (50MHz - 6GHz Spectrum Capture):\n";
      rfSpikes.forEach(s => {
        log += `Frequency: ${s.freq} | Signal Level: ${s.level} | Class: ${s.type} ${s.alert ? `<< SUSPICIOUS: ${s.alert} >>` : ""}\n`;
      });
      setCustomEavesLog(log);
    }
  }, [eavesdroppingMode, processConnections, rfSpikes]);

  const handleRunSweep = () => {
    setIsSweeping(true);
    setSweepProgress(0);
    const interval = setInterval(() => {
      setSweepProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSweeping(false);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };


  // --- ANALYSIS OPERATIONS ---
  const handleAnalyze = async () => {
    let logToAnalyze = "";
    if (activeSubTab === "gps") {
      logToAnalyze = customNmea;
    } else if (activeSubTab === "ew") {
      logToAnalyze = customSpectrumLog;
    } else {
      logToAnalyze = customEavesLog;
    }

    if (loading) return;
    setLoading(true);
    setReport("");
    setError(null);

    try {
      const responseText = await analyzeSigintData(activeSubTab, logToAnalyze);
      setReport(responseText);
    } catch (err) {
      console.error(err);
      const friendlyError = handleAiError(err);
      setError(`SIGINT Analysis failed: ${friendlyError}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!report || !user || saving) return;

    setSaving(true);
    setError(null);

    try {
      await addDoc(collection(db, "loot"), {
        userId: user.uid,
        type: `SIGINT_${activeSubTab.toUpperCase()}`,
        target: activeSubTab === "gps" ? "NMEA_TELEMETRY" : activeSubTab === "ew" ? `RF_SCAN_${ewBand.toUpperCase()}` : `COVERT_SWEEP_${eavesdroppingMode.toUpperCase()}`,
        data: report,
        timestamp: new Date().toISOString()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "loot");
    } finally {
      setSaving(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_sigint_${activeSubTab}_report_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="bento-card h-full max-w-6xl mx-auto w-full p-0 flex flex-col border-primary/20 bg-[#0A0A0B]">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-white/5 bg-secondary/20 shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-widest leading-none">SIGINT & EW Tactical Command</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 opacity-60 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-primary" /> Multi-spectral Signals Intelligence Suite Active
            </p>
          </div>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex bg-secondary/30 border border-white/5 p-1 rounded-xl shrink-0 w-full sm:w-auto">
          <button 
            onClick={() => { setActiveSubTab("gps"); setReport(""); setError(null); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${activeSubTab === "gps" ? "bg-primary text-white shadow-[0_0_12px_rgba(62,99,221,0.3)]" : "text-muted-foreground hover:text-white"}`}
          >
            <Satellite className="w-3.5 h-3.5" /> GPS Spoofing
          </button>
          <button 
            onClick={() => { setActiveSubTab("ew"); setReport(""); setError(null); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${activeSubTab === "ew" ? "bg-primary text-white shadow-[0_0_12px_rgba(62,99,221,0.3)]" : "text-muted-foreground hover:text-white"}`}
          >
            <Activity className="w-3.5 h-3.5" /> EW / Jamming
          </button>
          <button 
            onClick={() => { setActiveSubTab("eavesdropping"); setReport(""); setError(null); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${activeSubTab === "eavesdropping" ? "bg-primary text-white shadow-[0_0_12px_rgba(62,99,221,0.3)]" : "text-muted-foreground hover:text-white"}`}
          >
            <Wifi className="w-3.5 h-3.5" /> Eavesdropping
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* LEFT COLUMN: Controls and Interactive Simulations */}
        <div className="w-full lg:w-[48%] border-r border-white/5 overflow-y-auto p-6 space-y-6 no-scrollbar flex flex-col">
          
          {/* TAB 1: GPS SPOOFING WORKSPACE */}
          {activeSubTab === "gps" && (
            <div className="space-y-6 flex-grow flex flex-col justify-start">
              {/* Simulator settings */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-primary">Simulation profile</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={gpsSimType === "safe" ? "default" : "outline"}
                    onClick={() => setGpsSimType("safe")}
                    className="text-[9px] font-bold uppercase py-2 h-auto rounded-lg"
                  >
                    Standard GPS
                  </Button>
                  <Button 
                    variant={gpsSimType === "spoofed_jump" ? "default" : "outline"}
                    onClick={() => setGpsSimType("spoofed_jump")}
                    className="text-[9px] font-bold uppercase py-2 h-auto rounded-lg border-destructive/20 hover:bg-destructive/10"
                  >
                    Coordinate Jump
                  </Button>
                  <Button 
                    variant={gpsSimType === "spoofed_snr" ? "default" : "outline"}
                    onClick={() => setGpsSimType("spoofed_snr")}
                    className="text-[9px] font-bold uppercase py-2 h-auto rounded-lg border-destructive/20 hover:bg-destructive/10"
                  >
                    Uniform SNR
                  </Button>
                </div>
              </div>

              {/* GPS Discrepancy Diagnostics Grid */}
              <div className="grid grid-cols-2 gap-4 bg-secondary/20 p-4 border border-white/5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/30"></div>
                
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">GPS Derived Coordinates</span>
                  <p className="font-mono text-xs font-black text-white">{gpsDiscrepancy.gpsCoords}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Cellular / Wi-Fi Positioning</span>
                  <p className="font-mono text-xs font-black text-white">{gpsDiscrepancy.wifiCoords}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Horizontal Dilution (HDOP)</span>
                  <p className={`font-mono text-xs font-black ${gpsDiscrepancy.hdop > 2 ? 'text-destructive' : 'text-green-400'}`}>
                    {gpsDiscrepancy.hdop} {gpsDiscrepancy.hdop > 2 ? '(DEGRADED)' : '(EXCELLENT)'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Derived Altitude</span>
                  <p className="font-mono text-xs font-black text-white">{gpsDiscrepancy.altitudeGps} / {gpsDiscrepancy.altitudeWifi}</p>
                </div>

                <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full animate-ping ${gpsSimType !== "safe" ? "bg-destructive" : "bg-green-500"}`}></div>
                    <span className="text-[9px] font-mono uppercase font-black text-white">{gpsDiscrepancy.distance}</span>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${gpsSimType === "safe" ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                    {gpsDiscrepancy.status}
                  </span>
                </div>
              </div>

              {/* Satellite SNR Analyzer Chart */}
              <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Satellite className="w-3.5 h-3.5 text-primary" /> Satellite Signal-to-Noise Ratios (SNR)
                  </span>
                  {gpsSimType === "spoofed_snr" && (
                    <span className="text-[8px] font-mono text-destructive uppercase animate-pulse border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 rounded">
                      SPOOF VERDICT: UNIFORM SNR SIGNATURE
                    </span>
                  )}
                </div>

                <div className="space-y-2 font-mono">
                  {satData.map((sat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px]">
                      <span className="w-12 text-white font-bold">{sat.id} ({sat.type})</span>
                      <div className="flex-grow mx-4 h-2 bg-secondary/40 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full transition-all duration-500 ${gpsSimType === "spoofed_snr" ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-primary"}`}
                          style={{ width: `${(sat.snr / 55) * 100}%` }}
                        ></div>
                      </div>
                      <span className="w-10 text-right font-black">{sat.snr} dB-Hz</span>
                    </div>
                  ))}
                </div>
                <div className="text-[8px] text-muted-foreground uppercase tracking-tight text-center pt-2 border-t border-white/5">
                  Standard satellites have varying SNR. Identical high levels (e.g. 48 dB-Hz) suggest signal replay or simulator-generated spoofing.
                </div>
              </div>

              {/* Telemetry log preview */}
              <div className="space-y-2 flex-grow flex flex-col min-h-[150px]">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" /> Active NMEA Sentences ($GPGGA, $GPRMC, $GPGSA)
                </span>
                <Textarea 
                  value={customNmea}
                  onChange={(e) => setCustomNmea(e.target.value)}
                  className="w-full flex-grow bg-black/40 border-white/10 text-[11px] font-mono rounded-xl p-3 text-emerald-400 border resize-none focus:border-primary/50"
                  placeholder="Paste or write raw NMEA coordinates..."
                />
              </div>
            </div>
          )}


          {/* TAB 2: ELECTRONIC WARFARE & JAMMING WORKSPACE */}
          {activeSubTab === "ew" && (
            <div className="space-y-6 flex-grow flex flex-col justify-start">
              {/* Band selector */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-primary">Target RF Frequency Band</label>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { value: "800mhz", label: "800M" },
                    { value: "900mhz", label: "900M" },
                    { value: "1.57ghz", label: "GNSS" },
                    { value: "1.8ghz", label: "1.8G" },
                    { value: "2.4ghz", label: "2.4G" }
                  ].map((band) => (
                    <Button 
                      key={band.value}
                      variant={ewBand === band.value ? "default" : "outline"}
                      onClick={() => setEwBand(band.value as BandType)}
                      className="text-[9px] font-bold p-1 h-auto rounded-lg"
                    >
                      {band.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Jamming mode simulator */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-primary">Interference Signature Profile</label>
                <div className="grid grid-cols-4 gap-2">
                  <Button 
                    variant={ewSimType === "clean" ? "default" : "outline"}
                    onClick={() => setEwSimType("clean")}
                    className="text-[9px] font-bold uppercase py-2 h-auto rounded-lg"
                  >
                    Clean
                  </Button>
                  <Button 
                    variant={ewSimType === "broadband" ? "default" : "outline"}
                    onClick={() => setEwSimType("broadband")}
                    className="text-[9px] font-bold uppercase py-2 h-auto rounded-lg border-destructive/20 hover:bg-destructive/10"
                  >
                    Barrage
                  </Button>
                  <Button 
                    variant={ewSimType === "comb" ? "default" : "outline"}
                    onClick={() => setEwSimType("comb")}
                    className="text-[9px] font-bold uppercase py-2 h-auto rounded-lg border-destructive/20 hover:bg-destructive/10"
                  >
                    Comb
                  </Button>
                  <Button 
                    variant={ewSimType === "cw" ? "default" : "outline"}
                    onClick={() => setEwSimType("cw")}
                    className="text-[9px] font-bold uppercase py-2 h-auto rounded-lg border-destructive/20 hover:bg-destructive/10"
                  >
                    CW Spot
                  </Button>
                </div>
              </div>

              {/* SDR Spectrum Visualizer Canvas */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col gap-4">
                <div className="flex justify-between items-center shrink-0">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-primary animate-pulse" /> Live SDR Spectrum Stream
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-muted-foreground uppercase">{freqHz}</span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-black ${ewSimType === "clean" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive animate-pulse"}`}>
                      {ewSimType === "clean" ? "CLEAR" : "JAMMING DETECTED"}
                    </span>
                  </div>
                </div>

                <div className="w-full h-[180px] bg-black/60 rounded-xl relative overflow-hidden border border-white/5 flex items-center justify-center">
                  <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={180} 
                    className="w-full h-full block"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground uppercase">Noise Floor:</span>
                    <span className={`font-bold ${noiseFloor > -80 ? 'text-destructive' : 'text-green-400'}`}>{noiseFloor} dBm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground uppercase">SDR Status:</span>
                    <span className="text-primary font-bold">LOCKED // COMPLIANT</span>
                  </div>
                </div>
              </div>

              {/* Spectral scan metadata log */}
              <div className="space-y-2 flex-grow flex flex-col min-h-[120px]">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" /> SDR Spectral Scan Metadata
                </span>
                <Textarea 
                  value={customSpectrumLog}
                  onChange={(e) => setCustomSpectrumLog(e.target.value)}
                  className="w-full flex-grow bg-black/40 border-white/10 text-[11px] font-mono rounded-xl p-3 text-red-400 border resize-none focus:border-primary/50"
                  placeholder="Paste or write custom RF spectrum capture log..."
                />
              </div>
            </div>
          )}


          {/* TAB 3: EAVESDROPPING & PROCESS/RF VECTOR WORKSPACE */}
          {activeSubTab === "eavesdropping" && (
            <div className="space-y-6 flex-grow flex flex-col justify-start">
              {/* Type Switcher */}
              <div className="flex bg-secondary/30 border border-white/5 p-1 rounded-xl">
                <Button 
                  variant={eavesdroppingMode === "network" ? "default" : "ghost"}
                  onClick={() => setEavesdroppingMode("network")}
                  className="flex-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all h-8"
                >
                  <Network className="w-3.5 h-3.5 mr-2" /> Digital Netstat / Lsof
                </Button>
                <Button 
                  variant={eavesdroppingMode === "rf_sweep" ? "default" : "ghost"}
                  onClick={() => setEavesdroppingMode("rf_sweep")}
                  className="flex-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all h-8"
                >
                  <Radio className="w-3.5 h-3.5 mr-2" /> Physical RF Sweeper
                </Button>
              </div>

              {/* Mode 1: Network Connection Auditor */}
              {eavesdroppingMode === "network" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-primary animate-pulse" /> Active Network Connections
                    </span>
                    <Button 
                      onClick={handleRunSweep} 
                      disabled={isSweeping}
                      className="h-7 text-[8px] uppercase tracking-widest font-black"
                    >
                      {isSweeping ? "Auditing Connections..." : "Run Netstat Scan"}
                    </Button>
                  </div>

                  {isSweeping ? (
                    <div className="space-y-2 py-8 bg-black/30 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                      <Activity className="w-8 h-8 text-primary animate-spin" />
                      <div className="w-3/4 bg-secondary/40 h-1.5 rounded-full overflow-hidden border border-white/5 mt-2">
                        <div className="bg-primary h-full transition-all duration-300" style={{ width: `${sweepProgress}%` }}></div>
                      </div>
                      <span className="text-[8px] font-mono uppercase tracking-widest text-primary animate-pulse mt-1">Dumping Outbound Descriptors...</span>
                    </div>
                  ) : (
                    <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden font-mono text-[10px]">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-secondary/40 border-b border-white/5 text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                            <th className="p-3">PID / Process</th>
                            <th className="p-3">Local Adr</th>
                            <th className="p-3">Remote Adr</th>
                            <th className="p-3 text-right">OpSec Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {processConnections.map((c, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-secondary/20">
                              <td className="p-3 font-bold text-white">
                                {c.process} <span className="text-[8px] text-muted-foreground">({c.pid})</span>
                              </td>
                              <td className="p-3 text-muted-foreground truncate max-w-[110px]">{c.local}</td>
                              <td className="p-3 text-white truncate max-w-[110px]">{c.remote}</td>
                              <td className="p-3 text-right">
                                {c.alert ? (
                                  <span className="text-[8px] font-bold uppercase bg-destructive/10 text-destructive border border-destructive/20 px-1.5 py-0.5 rounded animate-pulse">
                                    {c.alert}
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20 px-1.5 py-0.5 rounded">
                                    SECURED
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Physical RF Sweep */}
              {eavesdroppingMode === "rf_sweep" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-primary animate-pulse" /> Local EM Spectrum Sweep
                    </span>
                    <Button 
                      onClick={handleRunSweep} 
                      disabled={isSweeping}
                      className="h-7 text-[8px] uppercase tracking-widest font-black"
                    >
                      {isSweeping ? "Sweeping frequencies..." : "Scan Environment"}
                    </Button>
                  </div>

                  {isSweeping ? (
                    <div className="space-y-2 py-8 bg-black/30 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                      <div className="w-3/4 bg-secondary/40 h-1.5 rounded-full overflow-hidden border border-white/5 mt-2">
                        <div className="bg-primary h-full transition-all duration-300" style={{ width: `${sweepProgress}%` }}></div>
                      </div>
                      <span className="text-[8px] font-mono uppercase tracking-widest text-primary animate-pulse mt-1">Sweeping 50 MHz - 6.0 GHz...</span>
                    </div>
                  ) : (
                    <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden font-mono text-[10px]">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-secondary/40 border-b border-white/5 text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                            <th className="p-3">RF Frequency</th>
                            <th className="p-3">Signal Power</th>
                            <th className="p-3">Signal Type</th>
                            <th className="p-3 text-right">Tactical Threat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rfSpikes.map((s, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-secondary/20">
                              <td className="p-3 font-bold text-white">{s.freq}</td>
                              <td className="p-3 text-muted-foreground">{s.level}</td>
                              <td className="p-3 text-white">{s.type}</td>
                              <td className="p-3 text-right">
                                {s.suspicious ? (
                                  <span className="text-[8px] font-bold uppercase bg-destructive/10 text-destructive border border-destructive/20 px-1.5 py-0.5 rounded animate-pulse">
                                    SUSPICIOUS SPIKE
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20 px-1.5 py-0.5 rounded">
                                    SAFE LEVEL
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Audit text box */}
              <div className="space-y-2 flex-grow flex flex-col min-h-[120px]">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" /> Active Connection & RF Sweep Output logs
                </span>
                <Textarea 
                  value={customEavesLog}
                  onChange={(e) => setCustomEavesLog(e.target.value)}
                  className="w-full flex-grow bg-black/40 border-white/10 text-[11px] font-mono rounded-xl p-3 text-cyan-400 border resize-none focus:border-primary/50"
                  placeholder="Paste netstat logs, process listings, or raw RF power outputs to analyze..."
                />
              </div>
            </div>
          )}

          {/* Action scanner button */}
          <Button 
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-xl transition-all hover:shadow-[0_0_15px_rgba(62,99,221,0.4)] flex items-center justify-center gap-2 mt-auto"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Synthesizing AI Defense Intel..." : `Analyze ${activeSubTab.toUpperCase()} Profile with Gemini`}
          </Button>
        </div>


        {/* RIGHT COLUMN: AI Signals Analysis Report */}
        <div className="w-full lg:w-[52%] overflow-y-auto p-6 space-y-6 no-scrollbar bg-gradient-to-b from-transparent to-black/20 flex flex-col">
          {!report && !loading ? (
            <div className="h-full flex-grow flex flex-col items-center justify-center text-center space-y-6 opacity-30 grayscale min-h-[300px]">
              <div className="w-24 h-24 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center animate-[pulse_4s_ease-in-out_infinite]">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Signals Capture</p>
                <p className="text-[9px] uppercase tracking-widest max-w-[280px] mx-auto text-muted-foreground">Select a signals profile or paste your own logs and initiate AI Analysis to synthesize defense countermeasures</p>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col space-y-4 animate-in fade-in duration-500">
              
              {loading ? (
                <div className="h-full flex-grow flex flex-col items-center justify-center py-24 gap-4 min-h-[300px]">
                  <RefreshCw className="w-10 h-10 animate-spin text-primary opacity-50" />
                  <p className="text-[10px] uppercase font-black tracking-widest text-primary animate-pulse">Running Forensic Spectral Wave Deconvolutions...</p>
                </div>
              ) : (
                <div className="flex-grow flex flex-col space-y-4">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between bg-secondary/30 border border-white/5 px-4 py-2 rounded-xl shrink-0">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-primary animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-foreground">AI Defense Telemetry</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-7 text-[8px] uppercase font-black px-2.5">
                        {copied ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={downloadReport} className="h-7 text-[8px] uppercase font-black px-2.5">
                        <Download className="w-3 h-3 mr-1" /> Export
                      </Button>
                      {user && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleSaveToVault} 
                          disabled={saving}
                          className="h-7 text-[8px] uppercase font-black px-2.5 text-primary hover:bg-primary/10"
                        >
                          <Save className="w-3 h-3 mr-1" /> {saved ? "Saved" : "Save to Vault"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Diagnostic warnings */}
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive font-mono text-[10px] tracking-tight uppercase shrink-0">
                      {error}
                    </div>
                  )}

                  {/* Markdown Report Render */}
                  <div className="flex-grow bg-secondary/10 border border-white/5 p-6 rounded-2xl relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
                    <div className="markdown-body prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:text-primary prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-strong:text-primary prose-code:text-primary text-[13px]">
                      <Markdown>{report}</Markdown>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
