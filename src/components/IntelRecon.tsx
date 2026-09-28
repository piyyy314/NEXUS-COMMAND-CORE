import { useState } from "react";
import { Search, Map as MapIcon, Loader2, Globe, Database, Target, ExternalLink, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { searchGrounding, mapRecon, handleAiError } from "@/lib/gemini";
import Markdown from "react-markdown";

export function IntelRecon() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string, sources: any[] } | null>(null);

  const getCoordinates = (): Promise<{ latitude?: number; longitude?: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve({});
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve({}),
        { timeout: 6000 }
      );
    });
  };

  const handleSearch = async (type: 'search' | 'maps') => {
    if (!query.trim() || loading) return;
    
    setLoading(true);
    setResult(null);

    try {
      let response;
      if (type === 'search') {
        response = await searchGrounding(query);
      } else {
        const coords = await getCoordinates();
        response = await mapRecon(query, coords.latitude, coords.longitude);
      }

      if (response) {
        setResult({
          text: response.text || "No intelligence data returned.",
          sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        });
      }
    } catch (error) {
      console.error(error);
      const friendlyError = handleAiError(error);
      setResult({ text: `[ERROR] Intelligence gathering failed: ${friendlyError}`, sources: [] });
    } finally {
      setLoading(false);
    }
  };

  const downloadIntel = () => {
    if (!result?.text) return;
    const blob = new Blob([result.text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_intel_report_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bento-card h-full max-w-5xl mx-auto w-full p-0 flex flex-col border-primary/20 bg-[#0A0A0B]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-secondary/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-widest leading-none">Global Intel Recon</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 opacity-60 flex items-center gap-1">
              <Globe className="w-3 h-3 text-primary animate-pulse" /> Live Grounding Engine Active
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-6 border-b border-white/5 bg-black/20 shrink-0">
          <Tabs defaultValue="web" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/30 border border-white/5 p-1 rounded-xl">
              <TabsTrigger value="web" className="data-[state=active]:bg-primary data-[state=active]:text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all">
                <Globe className="w-3.5 h-3.5 mr-2" /> Global Web Scan
              </TabsTrigger>
              <TabsTrigger value="maps" className="data-[state=active]:bg-primary data-[state=active]:text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all">
                <MapIcon className="w-3.5 h-3.5 mr-2" /> Geospatial Tracking
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="web" className="mt-0 space-y-4 animate-in fade-in duration-300">
              <form onSubmit={(e) => { e.preventDefault(); handleSearch('search') }} className="flex gap-3">
                <div className="relative flex-1">
                  <Input 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder="Enter target subject or query..."
                    className="w-full bg-secondary/50 border-white/10 focus:border-primary/50 h-12 pl-10 text-sm font-medium rounded-xl"
                    disabled={loading}
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                </div>
                <Button type="submit" disabled={loading || !query.trim()} className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-xl transition-all hover:shadow-[0_0_15px_rgba(62,99,221,0.4)]">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="maps" className="mt-0 space-y-4 animate-in fade-in duration-300">
              <form onSubmit={(e) => { e.preventDefault(); handleSearch('maps') }} className="flex gap-3">
                <div className="relative flex-1">
                  <Input 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder="Enter geographical POI or coordinates..."
                    className="w-full bg-secondary/50 border-white/10 focus:border-primary/50 h-12 pl-10 text-sm font-medium rounded-xl"
                    disabled={loading}
                  />
                  <MapIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                </div>
                <Button type="submit" disabled={loading || !query.trim()} className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-xl transition-all hover:shadow-[0_0_15px_rgba(62,99,221,0.4)]">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Locate'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar bg-gradient-to-b from-transparent to-black/20">
          {!result && !loading ? (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 grayscale">
               <div className="w-24 h-24 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center animate-[pulse_4s_ease-in-out_infinite]">
                 <Globe className="w-10 h-10 text-primary" />
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Search Parameters</p>
                 <p className="text-[9px] uppercase tracking-widest max-w-[250px] mx-auto text-muted-foreground">Input mission query to synthesize live intelligence from global sources</p>
               </div>
             </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
               {loading ? (
                 <div className="flex flex-col items-center justify-center py-24 gap-4">
                   <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                   <p className="text-[10px] uppercase font-black tracking-widest text-primary animate-pulse">Gathering Intel...</p>
                 </div>
               ) : (
                 <>
                  <div className="bg-secondary/20 border border-white/5 p-6 rounded-2xl relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
                    <div className="text-[11px] font-black tracking-[0.2em] text-primary uppercase mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-4">
                        <span>Synthesized Intelligence Report</span>
                        <Button variant="ghost" size="sm" onClick={downloadIntel} className="h-6 text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10 px-2 rounded">
                          <Download className="w-3 h-3 mr-1.5" /> Export Intel
                        </Button>
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground bg-black/40 px-2 py-0.5 rounded border border-white/5 uppercase">Tactical Search Grounding</div>
                    </div>
                    <div className="markdown-body prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:text-primary prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-strong:text-primary prose-code:text-primary text-[14px]">
                      <Markdown>{result?.text || ""}</Markdown>
                    </div>
                  </div>

                  {result?.sources && result.sources.length > 0 && (
                    <div className="space-y-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2 mb-2">
                        <Database className="w-3 h-3 text-primary" /> Source Documentation
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {result.sources.map((src, i) => {
                          const uri = src.web?.uri || src.maps?.uri;
                          const title = src.web?.title || src.maps?.placeAnswerSources?.at(0)?.title || 'Verified Intel Source';
                          if (!uri) return null;
                          return (
                            <a 
                              key={i} 
                              href={uri} 
                              target="_blank" 
                              rel="noreferrer"
                              className="group flex items-center justify-between p-3 bg-secondary/40 border border-white/5 rounded-xl hover:border-primary/50 transition-all duration-300 hover:bg-primary/[0.02]"
                            >
                              <div className="flex flex-col min-w-0 mr-4">
                                <span className="text-[11px] font-black text-foreground truncate uppercase tracking-tight">{title}</span>
                                <span className="text-[9px] text-muted-foreground truncate opacity-50">{new URL(uri).hostname}</span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-primary opacity-30 group-hover:opacity-100 transition-opacity shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                 </>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
