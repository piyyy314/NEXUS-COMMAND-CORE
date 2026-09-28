import { useState } from "react";
import { Mail, Send, Loader2, Target, UserPlus, Clipboard, Check, Zap, MessageSquare, AlertTriangle, Save, Database, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { generatePhishingCampaign, handleAiError } from "@/lib/gemini";
import Markdown from "react-markdown";
import { db, handleFirestoreError, OperationType, collection, addDoc } from "@/lib/firebase";
import type { User } from "firebase/auth";

export function PhishingLab({ user }: { user: User | null }) {
  const [target, setTarget] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [campagin, setCampaign] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim() || !context.trim() || loading) return;

    setLoading(true);
    setCampaign(null);
    setError(null);

    try {
      const result = await generatePhishingCampaign(target.trim(), context.trim());
      setCampaign(result);
    } catch (err) {
      console.error(err);
      const friendlyError = handleAiError(err);
      setError(`Campaign generation failure: ${friendlyError}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!campagin || !user || saving) return;

    setSaving(true);
    setError(null);

    try {
      await addDoc(collection(db, "loot"), {
        userId: user.uid,
        type: "PHISHING_PAYLOAD",
        target: target,
        data: campagin,
        timestamp: new Date().toISOString() // Using string for timestamp as per blueprint and rules string check
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "loot");
    } finally {
      setSaving(false);
    }
  };

  const downloadPayload = () => {
    if (!campagin) return;
    const blob = new Blob([campagin], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_phishing_payload_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!campagin) return;
    navigator.clipboard.writeText(campagin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bento-card h-full max-w-6xl mx-auto w-full p-0 flex flex-col border-primary/20 bg-[#0A0A0B]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-secondary/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-widest leading-none">Phishing Simulation Lab</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 opacity-60 flex items-center gap-1">
              <UserPlus className="w-3 h-3 text-primary animate-pulse" /> Social Engineering Synth Engine Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded">
          <AlertTriangle className="w-3 h-3 text-yellow-500" />
          <span className="text-[9px] font-black text-yellow-500 uppercase tracking-tighter">Educational Simulation Only</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 divide-x divide-white/5 overflow-hidden">
        {/* Config Panel */}
        <div className="flex flex-col h-full bg-black/20 p-8 space-y-8 overflow-y-auto no-scrollbar">
           <div className="space-y-2">
             <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
               <Target className="w-3.5 h-3.5" /> Target Profile
             </h3>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">Specify the persona or role of the simulation target.</p>
             <Input 
               value={target} 
               onChange={(e) => setTarget(e.target.value)} 
               placeholder="e.g. Senior System Admin at Fintech Corp"
               className="bg-secondary/40 border-white/10 focus:border-primary/50 h-12 rounded-xl text-sm overflow-hidden"
               disabled={loading}
             />
           </div>

           <div className="space-y-2 flex-1 flex flex-col">
             <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
               <MessageSquare className="w-3.5 h-3.5" /> Simulation Context
             </h3>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">Provide the "lure" or situation for the simulation.</p>
             <Textarea 
               value={context} 
               onChange={(e) => setContext(e.target.value)} 
               placeholder="e.g. Urgent password reset required due to detected breach in internal VPN endpoint..."
               className="flex-1 bg-secondary/40 border-white/10 focus:border-primary/50 rounded-xl text-sm min-h-[120px] resize-none p-4"
               disabled={loading}
             />
           </div>

           <Button 
             onClick={handleGenerate} 
             disabled={loading || !target.trim() || !context.trim()} 
             className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_5px_15px_rgba(62,99,221,0.3)] transition-all flex items-center justify-center gap-3"
           >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> Generate Simulation Payload</>}
           </Button>

           {error && <div className="text-destructive text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in">{error}</div>}
        </div>

        {/* Output Panel */}
        <div className="flex flex-col h-full relative overflow-hidden bg-gradient-to-br from-transparent to-primary/[0.02]">
           <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/40">
             <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Generated_Tactical_Payload</span>
             {campagin && (
               <div className="flex items-center gap-2">
                 <Button variant="ghost" size="sm" onClick={handleSaveToVault} disabled={!user || saving} className={`h-7 text-[9px] uppercase font-black tracking-widest ${saved ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}>
                    {saved ? <><Check className="w-3 h-3 mr-1.5" /> Saved</> : saving ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <><Save className="w-3 h-3 mr-1.5" /> Save to Vault</>}
                 </Button>
                 <Button variant="ghost" size="sm" onClick={downloadPayload} className="h-7 text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10">
                    <Download className="w-3 h-3 mr-1.5" /> Download
                 </Button>
                 <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-7 text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10">
                   {copied ? <><Check className="w-3 h-3 mr-1.5" /> Copied</> : <><Clipboard className="w-3 h-3 mr-1.5" /> Copy Payload</>}
                 </Button>
               </div>
             )}
           </div>

           <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar bg-black/5">
              {!campagin && !loading ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 grayscale filter">
                   <div className="w-20 h-20 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center">
                     <Mail className="w-10 h-10 text-primary" />
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Simulation Config</p>
                     <p className="text-[9px] uppercase tracking-widest max-w-[200px] mx-auto text-muted-foreground">Synthesize high-fidelity phishing simulations for testing defense readiness.</p>
                   </div>
                </div>
              ) : loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                    <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
                    <Mail className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Drafting Attack Vector</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Applying psychological triggers</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-full animate-in fade-in duration-1000">
                  <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                     <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(62,99,221,0.5)] animate-pulse"></div>
                     <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Simulation Synthesis Complete</span>
                  </div>
                  <div className="markdown-body prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:text-primary prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-strong:text-primary text-[14px]">
                    <Markdown>{campagin}</Markdown>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
