import { useState } from "react";
import { Image as ImageIcon, Wand2, Loader2, Download, Zap, Eye, Shield, Fingerprint } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { createTargetIdentity, handleAiError } from "@/lib/gemini";

export function ImageOps() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setImageUrl(null);
    setError(null);

    try {
      const url = await createTargetIdentity(prompt.trim());
      setImageUrl(url);
    } catch (err) {
      console.error(err);
      const friendlyError = handleAiError(err);
      setError(`Visual synthesis failure: ${friendlyError}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `nexus_covert_id_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bento-card h-full max-w-5xl mx-auto w-full p-0 flex flex-col border-primary/20 bg-[#0A0A0B] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-secondary/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ImageIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-widest leading-none">Covert Identity Synthesis</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 opacity-60 flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary animate-pulse" /> Visual Obfuscation Engine Active
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-black/20">
        <div className="p-8 border-b border-white/5 space-y-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-primary" /> Persona Parameters
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">Describe the visual identity required for the current operation.</p>
          </div>

          <form onSubmit={handleGenerate} className="flex gap-3">
            <div className="relative flex-1">
              <Input 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="e.g. Professional executive headshot, neutral background, blurred environment..."
                className="w-full bg-secondary/40 border-white/10 focus:border-primary/50 h-14 pl-12 pr-4 text-sm rounded-xl transition-all shadow-inner"
                disabled={loading}
              />
              <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-50" />
            </div>
            <Button type="submit" disabled={loading || !prompt.trim()} className="h-14 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_5px_20px_rgba(62,99,221,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0">
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Synthesize'}
            </Button>
          </form>
          {error && <div className="text-destructive text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in">{error}</div>}
        </div>

        <div className="flex-1 overflow-y-auto p-12 flex items-center justify-center bg-gradient-to-t from-black/40 to-transparent">
           {!imageUrl && !loading ? (
             <div className="flex flex-col items-center justify-center text-center space-y-8 opacity-20 filter grayscale">
               <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center">
                    <Shield className="w-12 h-12 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-primary rounded-full p-2 border-4 border-black">
                     <Eye className="w-5 h-5 text-white" />
                  </div>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em]">Identity Buffer Empty</p>
                 <p className="text-[9px] uppercase tracking-widest max-w-[250px] mx-auto text-muted-foreground">Generate synthetic visual assets for covert mission profiles.</p>
               </div>
             </div>
           ) : loading ? (
             <div className="flex flex-col items-center justify-center space-y-6">
                <div className="w-24 h-24 relative">
                  <div className="absolute inset-0 border-8 border-primary/10 rounded-2xl"></div>
                  <div className="absolute inset-0 border-t-8 border-primary rounded-2xl animate-spin"></div>
                  <ImageIcon className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Synthesizing Pixels</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Applying biometric obfuscation</p>
                </div>
             </div>
           ) : imageUrl && (
             <div className="max-w-2xl w-full flex flex-col items-center animate-in zoom-in duration-1000">
               <div className="relative group p-4 bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md">
                 <img 
                   src={imageUrl} 
                   alt="Generated Covert Identity" 
                   className="w-[400px] h-[400px] object-cover rounded-xl shadow-2xl border border-white/5"
                   referrerPolicy="no-referrer"
                 />
                 <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
                 
                 <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 w-full justify-center">
                    <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest px-6 h-10 rounded-lg shadow-xl flex items-center gap-2">
                       <Download className="w-4 h-4" /> Download Asset
                    </Button>
                    <Button variant="outline" onClick={() => setImageUrl(null)} className="bg-black/40 border-white/10 hover:bg-white/10 text-muted-foreground font-black uppercase tracking-widest px-6 h-10 rounded-lg">
                       Flush Buffer
                    </Button>
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
