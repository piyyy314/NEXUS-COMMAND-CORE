import { useState, useEffect, useRef } from "react";
import { Send, Volume2, Loader2, Terminal, Trash2, Command, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { createChat, synthesizeSpeech, handleAiError } from "@/lib/gemini";
import Markdown from "react-markdown";

let chatSession: any = null;

export function GhostChat() {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatSession) {
      chatSession = createChat();
      setMessages([{ role: 'model', text: "Ghost Net Controller Online. How can I assist in your offensive operation?" }]);
    }
  }, []);

  const clearChat = () => {
    chatSession = createChat();
    setMessages([{ role: 'model', text: "Session flushed. Ghost link re-established. Parameters cleared." }]);
  };

  const downloadChat = () => {
    if (messages.length === 0) return;
    const history = messages.map(m => `[${m.role.toUpperCase()}]: ${m.text}`).join('\n\n---\n\n');
    const blob = new Blob([history], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_chat_history_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    
    if (input.trim().toLowerCase() === '/clear') {
      clearChat();
      setInput("");
      return;
    }

    if (input.trim().length > 1000) {
      setMessages((prev) => [...prev, { role: 'model', text: `[ERROR] Payload too large. Maximum 1000 characters allowed.` }]);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await chatSession.sendMessage({ message: userMessage });
      const text = response.text;
      setMessages((prev) => [...prev, { role: 'model', text }]);
    } catch (error) {
      console.error(error);
      const friendlyError = handleAiError(error);
      setMessages((prev) => [...prev, { role: 'model', text: `[SYSTEM ERROR] ${friendlyError}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = async (text: string, index: number) => {
    setAudioLoading(index);
    try {
      const audioUrl = await synthesizeSpeech(text);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error("Text to speech failed:", error);
    } finally {
      setAudioLoading(null);
    }
  };

  return (
    <div className="bento-card h-full max-w-5xl mx-auto w-full p-0 flex flex-col border-primary/20 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-secondary/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Terminal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-widest leading-none">Ghost Net Terminal</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 opacity-60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Encrypted C2 Uplink Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={downloadChat} className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10">
            <Download className="w-3 h-3 mr-2" /> Export
          </Button>
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="w-3 h-3 mr-2" /> Flush Buffer
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div 
          className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide no-scrollbar" 
          ref={scrollRef}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div 
                  className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-5 relative group shadow-lg ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white border-none marker:text-white selection:bg-white/20' 
                      : 'bg-secondary border border-white/5 text-foreground selection:bg-primary/20'
                  }`}
                >
                  <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2 ${msg.role === 'user' ? 'text-white/60' : 'text-primary'}`}>
                    {msg.role === 'user' ? <Command className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
                    {msg.role === 'user' ? 'Operator' : 'Ghost C2'}
                  </div>
                  
                  {msg.role === 'model' ? (
                    <div className="markdown-body prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 text-[14px]">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-[14px] font-medium">{msg.text}</div>
                  )}

                  {msg.role === 'model' && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-primary hover:bg-white/5 rounded-full"
                      onClick={() => handlePlayAudio(msg.text, idx)}
                      disabled={audioLoading !== null}
                    >
                      {audioLoading === idx ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-secondary border border-white/5 text-foreground rounded-2xl p-5 w-32 flex justify-center">
                   <div className="flex gap-1.5">
                     <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                     <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                     <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 bg-gradient-to-t from-black/20 to-transparent border-t border-white/5">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3">
            <div className="flex-1 relative">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Enter command or type /clear..."
                className="w-full bg-secondary/50 border-white/10 focus:border-primary/50 focus-visible:ring-primary h-14 pl-12 pr-4 text-sm rounded-xl transition-all shadow-inner"
                disabled={loading}
                maxLength={1000}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                <Terminal className="w-5 h-5 opacity-50" />
              </div>
            </div>
            <Button type="submit" disabled={loading || !input.trim()} className="h-14 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-xl shadow-[0_5px_15px_rgba(62,99,221,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
