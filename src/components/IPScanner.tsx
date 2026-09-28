import { useState, useMemo } from "react";
import { Search, Loader2, Network, Target, Activity, CheckCircle2, ShieldAlert, Cpu, ListTree, Filter, Save, Check, Clipboard, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { analyzeNetworkTargetStream, handleAiError } from "@/lib/gemini";
import Markdown from "react-markdown";
import { db, handleFirestoreError, OperationType, collection, addDoc } from "@/lib/firebase";
import type { User } from "firebase/auth";

type DiscoveryType = 'all' | 'port' | 'service' | 'vuln' | 'reco';

export function IPScanner({ user }: { user: User | null }) {
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DiscoveryType>('all');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Progress states
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const validateIP = (value: string) => {
    const trimmedValue = value.trim();
    const ipv4 = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
    const ipv6 = /^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$/;
    return ipv4.test(trimmedValue) || ipv6.test(trimmedValue);
  };

  const findings = useMemo(() => {
    if (!report) return [];
    return report.split(/(?=## \[)/g).filter(f => f.trim() !== "");
  }, [report]);

  const filteredFindings = useMemo(() => {
    if (filter === 'all') return findings;
    const tag = `[${filter.toUpperCase()}]`;
    return findings.filter(f => f.includes(tag));
  }, [findings, filter]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim() || loading) return;

    if (!validateIP(ip)) {
      setError("Invalid tactical destination. IPv4/IPv6 required.");
      return;
    }

    setLoading(true);
    setReport("");
    setError(null);
    setProgress(5);
    setStatus("Initializing recon sequence...");

    try {
      const stream = await analyzeNetworkTargetStream(ip.trim());
      
      for await (const chunk of stream) {
        const text = chunk.text || "";
        setReport((prev) => (prev || "") + text);
        
        if (text.includes("[STATUS]")) { setProgress(15); setStatus("Host status confirmed. Probing ports..."); }
        else if (text.includes("[PORT]")) { setProgress(40); setStatus("Discovering exposed ports..."); }
        else if (text.includes("[SERVICE]")) { setProgress(65); setStatus("Fingerprinting services..."); }
        else if (text.includes("[VULN]")) { setProgress(85); setStatus("Mapping threat vectors..."); }
        else if (text.includes("[RECO]")) { setProgress(95); setStatus("Synthesizing report..."); }
      }
      
      setProgress(100);
      setStatus("Intelligence gathering complete.");
    } catch (err) {
      console.error(err);
      const friendlyError = handleAiError(err);
      setError(`Recon failure: ${friendlyError}`);
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
        type: "IP_SCAN",
        target: ip,
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
    a.download = `nexus_ip_scan_${ip.replace(/\./g, '_')}_${Date.now()}.md`;
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
    <div className="bento-card h-full max-w-5xl mx-auto w-full p-0 flex flex-col border-primary/20 bg-[#0A0A0B]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-secondary/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Network className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-widest leading-none">Target Recon Scanner</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 opacity-60 flex items-center gap-1">
              {loading ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> {status}
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground opacity-40"></span> Awaiting target uplink
                </>
              )}
            </p>
          </div>
        </div>
        {loading && (
          <div className="text-[10px] font-mono text-primary animate-pulse bg-primary/10 px-2 py-1 rounded border border-primary/20">
            SCAN_PROGRESS: {progress}%
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-6 border-b border-white/5 bg-black/20 space-y-4 shrink-0">
          <form onSubmit={handleScan} className="flex gap-3">
            <div className="relative flex-1">
              <Input 
                value={ip} 
                onChange={(e) => setIp(e.target.value)} 
                placeholder="Target IPv4/IPv6 Address (e.g. 192.168.1.1)"
                className="w-full bg-secondary/50 border-white/10 focus:border-primary/50 focus-visible:ring-primary h-12 pl-10 text-sm font-mono rounded-xl shadow-inner"
                disabled={loading}
              />
              <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
            </div>
            <Button type="submit" disabled={loading || !ip.trim()} className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-xl transition-all hover:shadow-[0_0_15px_rgba(62,99,221,0.4)]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-2" /> EXECUTE</>}
            </Button>
          </form>
          {error && <div className="text-destructive text-[10px] font-mono uppercase tracking-tighter animate-in fade-in slide-in-from-top-1">{error}</div>}
        </div>

        {report && (
          <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {(['all', 'port', 'service', 'vuln', 'reco'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1 rounded-md text-[9px] whitespace-nowrap font-black uppercase tracking-[0.1em] border transition-all duration-300 ${
                    filter === t 
                      ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(62,99,221,0.3)]' 
                      : 'bg-secondary/40 border-white/5 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {t === 'all' ? 'Entire Report' : t === 'reco' ? 'Tactical Advice' : `${t}s`}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
               <Button variant="ghost" size="sm" onClick={handleSaveToVault} disabled={!user || saving} className={`h-7 text-[9px] uppercase font-black tracking-widest ${saved ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}>
                  {saved ? <><Check className="w-3 h-3 mr-1.5" /> Saved</> : saving ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <><Save className="w-3 h-3 mr-1.5" /> Save to Vault</>}
               </Button>
               <Button variant="ghost" size="sm" onClick={downloadReport} className="h-7 text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <Download className="w-3 h-3 mr-1.5" /> Download
               </Button>
               <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-7 text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10">
                 {copied ? <><Check className="w-3 h-3 mr-1.5" /> Copied</> : <><Clipboard className="w-3 h-3 mr-1.5" /> Copy Report</>}
               </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="w-full h-[1px] bg-white/5 relative overflow-hidden shrink-0">
             <div 
              className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_8px_rgba(62,99,221,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar bg-gradient-to-b from-transparent via-transparent to-black/20">
          {!report && !loading ? (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 grayscale">
               <div className="w-24 h-24 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center animate-[spin_20s_linear_infinite]">
                 <Network className="w-10 h-10 text-primary" />
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Uplink Sequence</p>
                 <p className="text-[9px] uppercase tracking-widest max-w-[200px] mx-auto text-muted-foreground">Input target destination to begin deep reconnaissance</p>
               </div>
             </div>
          ) : (
            <div className="max-w-3xl mx-auto animate-in fade-in duration-700">
               <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Tactical Intel // {ip}</span>
                    {loading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    {progress === 100 && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-white/5">
                    INTERNAL_USE_ONLY
                  </div>
               </div>

               <div className="markdown-body prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:text-primary prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-strong:text-primary prose-code:text-primary text-[14px]">
                {filter === 'all' ? (
                  <>
                    <Markdown>{report || ""}</Markdown>
                    {loading && <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle"></div>}
                  </>
                ) : (
                  <div className="space-y-6">
                    {filteredFindings.length > 0 ? (
                      filteredFindings.map((f, i) => (
                        <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-500 scale-[0.98] origin-left">
                          <Markdown>{f}</Markdown>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-24 flex flex-col items-center gap-4 text-muted-foreground italic text-[11px] uppercase tracking-widest opacity-50">
                        <Activity className="w-8 h-8 opacity-20" />
                        No data segments recovered for current category.
                      </div>
                    )}
                  </div>
                )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
