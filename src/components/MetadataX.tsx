import { useState } from "react";
import { Scan, Search, Loader2, Database, Zap, FileText, Copy, Check, Save, Download, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { extractMetadata, handleAiError } from "@/lib/gemini";
import Markdown from "react-markdown";
import { db, handleFirestoreError, OperationType, collection, addDoc } from "@/lib/firebase";
import type { User } from "firebase/auth";

export function MetadataX({ user }: { user: User | null }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    setReport(null);
    setError(null);

    try {
      const result = await extractMetadata(content.trim());
      setReport(result);
    } catch (err) {
      console.error(err);
      const friendlyError = handleAiError(err);
      setError(`Extraction failure: ${friendlyError}`);
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
        type: "METADATA_EXTRACTION",
        target: "Forensic Data Block",
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
    a.download = `nexus_metadata_xray_${Date.now()}.md`;
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
    <div className="bento-card h-full max-w-6xl mx-auto w-full p-0 flex flex-col border-primary/20 bg-[#0A0A0B]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-secondary/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Scan className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-widest leading-none">Metadata X-Ray</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 opacity-60 flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-500 animate-pulse" /> Deep Artifact Extractor Online
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 divide-x divide-white/5 overflow-hidden">
        {/* Input Area */}
        <div className="flex flex-col h-full bg-black/20 p-8 space-y-6 overflow-y-auto no-scrollbar">
           <div className="space-y-4">
             <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
               <Database className="w-4 h-4" /> Forensic Data Block
             </h3>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">Provide image headers, server logs, or raw JSON for metadata inspection.</p>
             <Textarea 
               value={content} 
               onChange={(e) => setContent(e.target.value)} 
               placeholder="Paste headers or raw data here..."
               className="bg-secondary/40 border-white/10 focus:border-primary/50 font-mono text-xs h-[350px] resize-none rounded-xl p-6"
               disabled={loading}
             />
           </div>

           <Button 
             onClick={handleExtract} 
             disabled={loading || !content.trim()} 
             className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-3"
           >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Eye className="w-5 h-5" /> Launch X-Ray Scan</>}
           </Button>

           {error && <div className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</div>}
        </div>

        {/* Report Area */}
        <div className="flex flex-col h-full relative overflow-hidden bg-gradient-to-br from-transparent to-blue-500/[0.02]">
          <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/40 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/70">Extracted_Digital_Artifacts</span>
            {report && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleSaveToVault} disabled={!user || saving} className={`h-7 text-[9px] uppercase font-black tracking-widest ${saved ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}>
                   {saved ? <><Check className="w-3 h-3 mr-1.5" /> Saved</> : saving ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <><Save className="w-3 h-3 mr-1.5" /> Save</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadReport} className="h-7 text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10">
                   <Download className="w-3 h-3 mr-1.5" /> Download
                </Button>
                <Button variant="ghost" size="sm" onClick={copyReport} className="h-7 text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10">
                  {copied ? <><Check className="w-3 h-3 mr-1.5" /> Copied</> : <><Copy className="w-3 h-3 mr-1.5" /> Copy</>}
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar bg-black/5">
              {!report && !loading ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 grayscale filter">
                   <FileText className="w-16 h-16 text-blue-500" />
                   <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Forensic Input</p>
                     <p className="text-[9px] uppercase tracking-widest max-w-[200px] mx-auto text-muted-foreground">Uncover hidden identifying markers in digital payloads.</p>
                   </div>
                </div>
              ) : loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                    <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                    <Scan className="absolute inset-0 m-auto w-6 h-6 text-blue-500 animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-500 animate-pulse">Filtering Noise</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Identifying origin signatures...</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-full animate-in fade-in duration-1000">
                  <div className="markdown-body prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:text-blue-500 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-strong:text-blue-500 text-[14px]">
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
