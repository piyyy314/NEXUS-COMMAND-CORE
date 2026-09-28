import { useState } from "react";
import { Code, Search, Loader2, ShieldCheck, Bug, Zap, ListChecks, Terminal, Copy, Check, Save, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { auditSourceCode, handleAiError } from "@/lib/gemini";
import Markdown from "react-markdown";
import { db, handleFirestoreError, OperationType, collection, addDoc } from "@/lib/firebase";
import type { User } from "firebase/auth";

export function SourceAuditor({ user }: { user: User | null }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;

    if (code.trim().length > 15000) {
      setError("Payload exceeds tactical limit (15k chars).");
      return;
    }

    setLoading(true);
    setReport(null);
    setError(null);

    try {
      const result = await auditSourceCode(code.trim());
      setReport(result);
    } catch (err) {
      console.error(err);
      const friendlyError = handleAiError(err);
      setError(`Audit sequence failure: ${friendlyError}`);
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
        type: "SOURCE_AUDIT",
        target: "Tactical Source Snippet",
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
    a.download = `nexus_audit_report_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bento-card h-full max-w-6xl mx-auto w-full p-0 flex flex-col border-primary/20 bg-[#0A0A0B] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
       <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-secondary/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Code className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-widest leading-none">Static Source Auditor</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 opacity-60 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500 animate-pulse" /> Logic Vector Analysis Engine Active
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 overflow-hidden divide-x divide-white/5">
        {/* Editor Panel */}
        <div className="flex flex-col h-full overflow-hidden bg-black/20">
          <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/40">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Source_Input_Buffer</span>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono text-muted-foreground opacity-50 uppercase tracking-tighter">Payload_Size: {code.length}</span>
            </div>
          </div>
          
          <div className="flex-1 min-h-0 p-4 relative group">
             <Textarea 
               value={code} 
               onChange={(e) => setCode(e.target.value)} 
               placeholder="Paste tactical source code here for static vulnerability analysis... // Supported: JS, TS, PY, GO, Rust, C++"
               className="h-full w-full bg-transparent border-none focus-visible:ring-0 font-mono text-[13px] leading-relaxed resize-none p-4 placeholder:opacity-20 placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
               disabled={loading}
             />
             <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                <Button 
                  onClick={handleAudit} 
                  disabled={loading || !code.trim()} 
                  className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-[0_10px_20px_rgba(62,99,221,0.4)] transition-all hover:-translate-y-1 active:translate-y-0"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                </Button>
             </div>
          </div>
          {error && <div className="p-4 bg-destructive/10 border-t border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest text-center">{error}</div>}
        </div>

        {/* Report Panel */}
        <div className="flex flex-col h-full overflow-hidden relative">
          <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/40 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Audit_Intelligence_Report</span>
            {report && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleSaveToVault} disabled={!user || saving} className={`h-7 text-[9px] uppercase font-black tracking-widest ${saved ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}>
                   {saved ? <><Check className="w-3 h-3 mr-1.5" /> Saved</> : saving ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <><Save className="w-3 h-3 mr-1.5" /> Save to Vault</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadReport} className="h-7 text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10">
                   <Download className="w-3 h-3 mr-1.5" /> Download
                </Button>
                <Button variant="ghost" size="sm" onClick={copyReport} className="h-7 text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10">
                  {copied ? <><Check className="w-3 h-3 mr-1.5" /> Copied</> : <><Copy className="w-3 h-3 mr-1.5" /> Copy Report</>}
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar bg-gradient-to-b from-transparent to-primary/[0.03]">
             {loading && !report ? (
               <div className="h-full flex flex-col items-center justify-center space-y-6">
                 <div className="relative">
                   <div className="w-20 h-20 rounded-full border-4 border-primary/10 flex items-center justify-center">
                     <Terminal className="w-10 h-10 text-primary animate-pulse" />
                   </div>
                   <div className="absolute inset-0 w-20 h-20 border-t-4 border-primary rounded-full animate-spin"></div>
                 </div>
                 <div className="text-center space-y-2">
                   <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Scanning Codebase</p>
                   <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Identifying potential zero-day vectors</p>
                 </div>
               </div>
             ) : !report ? (
               <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-20 filter grayscale">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 border border-dashed border-primary/40 rounded-2xl flex flex-col items-center gap-3">
                      <Bug className="w-8 h-8 text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Vuln Search</span>
                    </div>
                    <div className="p-6 border border-dashed border-primary/40 rounded-2xl flex flex-col items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Logic Audit</span>
                    </div>
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting tactical payload in editor buffer</p>
               </div>
             ) : (
               <div className="max-w-full animate-in fade-in duration-700">
                  <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${report.includes('High') || report.includes('Critical') ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}></div>
                      <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Audit Sequence Complete</span>
                    </div>
                    <div className="text-[9px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-white/5 uppercase">INTERNAL_ONLY</div>
                  </div>
                  <div className="markdown-body prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:text-primary prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-strong:text-primary prose-code:text-primary text-[14px]">
                    <Markdown>{report}</Markdown>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
