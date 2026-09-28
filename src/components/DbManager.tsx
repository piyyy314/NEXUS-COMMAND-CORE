import { useState, useEffect } from "react";
import { Database, HardDrive, Shield, Lock, Trash2, Search, Loader2, Download, ExternalLink, Network, Code, Mail, Bug, Scan, Radio, X, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { db, handleFirestoreError, OperationType, collection, query, where, onSnapshot, doc, deleteDoc } from "@/lib/firebase";
import type { User } from "firebase/auth";
import Markdown from "react-markdown";

interface LootEntry {
  id: string;
  type: string;
  target: string;
  timestamp: any;
  data: string;
  userId: string;
}

export function DbManager({ user }: { user: User | null }) {
  const [entries, setEntries] = useState<LootEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingEntry, setViewingEntry] = useState<LootEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getMillis = (ts: any): number => {
    if (!ts) return 0;
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (typeof ts.toDate === "function") return ts.toDate().getTime();
    if (typeof ts === "number") return ts;
    if (ts.seconds) return ts.seconds * 1000;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const formatDate = (ts: any): string => {
    if (!ts) return "Unknown Date";
    if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    const d = new Date(ts);
    return isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
  };

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "loot"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lootData: LootEntry[] = [];
      snapshot.forEach((docSnap) => {
        lootData.push({ id: docSnap.id, ...docSnap.data() } as LootEntry);
      });
      // Sort safely by timestamp descending
      lootData.sort((a, b) => getMillis(b.timestamp) - getMillis(a.timestamp));
      setEntries(lootData);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, "loot");
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "loot", id));
      setConfirmDeleteId(null);
      if (viewingEntry?.id === id) {
        setViewingEntry(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `loot/${id}`);
    }
  };

  const handleDownload = (entry: LootEntry) => {
    const blob = new Blob([entry.data], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_${entry.type.toLowerCase()}_${entry.id}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeIcon = (type: string) => {
    if (type.includes("IP_SCAN")) return <Network className="w-5 h-5" />;
    if (type.includes("SOURCE_AUDIT")) return <Code className="w-5 h-5" />;
    if (type.includes("PHISHING")) return <Mail className="w-5 h-5" />;
    if (type.includes("MALWARE")) return <Bug className="w-5 h-5" />;
    if (type.includes("METADATA")) return <Scan className="w-5 h-5" />;
    if (type.includes("SIGINT")) return <Radio className="w-5 h-5" />;
    return <Database className="w-5 h-5" />;
  };

  const filteredEntries = entries.filter(e => 
    e.target.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="bento-card h-full max-w-4xl mx-auto w-full flex flex-col items-center justify-center p-12 text-center space-y-8 bg-[#0A0A0B]/80 backdrop-blur-md border-primary/20">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/5 border-4 border-dashed border-primary/20 flex items-center justify-center animate-[pulse_5s_infinite]">
            <Lock className="w-10 h-10 text-primary opacity-30" />
          </div>
          <div className="absolute -top-1 -right-1 flex gap-1">
             <Shield className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-[18px] font-black uppercase tracking-[0.2em] text-white">Vault Access Restricted</h2>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest max-w-[300px] mx-auto leading-relaxed">Operative authentication required to decrypt tactical loot repository.</p>
        </div>
        <div className="text-[9px] font-mono text-primary/60 animate-pulse tracking-tighter">Awaiting Secure Handshake...</div>
      </div>
    );
  }

  return (
    <div className="bento-card h-full max-w-6xl mx-auto w-full p-0 flex flex-col border-primary/20 bg-[#0A0A0B] relative overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-secondary/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <HardDrive className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-widest leading-none">Encrypted Tactical Vault</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 opacity-60 flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-500" /> AES-256 Storage Cluster Synced
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="text-[9px] font-mono text-muted-foreground bg-black/40 px-2 py-1 rounded border border-white/5 uppercase tracking-tighter">
             Active_Records: {entries.length}
           </div>
        </div>
      </div>

      <div className="p-6 border-b border-white/5 bg-black/20 shrink-0">
        <div className="relative max-w-md">
          <Input 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search tactical records..."
            className="w-full bg-secondary/40 border-white/10 focus:border-primary/50 h-11 pl-10 text-sm rounded-xl"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative min-h-0">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-primary py-24">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Decrypting Records...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20 filter grayscale p-12">
             <Database className="w-16 h-16 text-primary" />
             <div className="space-y-1">
               <p className="text-[11px] font-black uppercase tracking-[0.3em]">No Records Found</p>
               <p className="text-[9px] uppercase tracking-widest max-w-[250px] mx-auto text-muted-foreground">The tactical vault is currently empty. Run reconnaissance or audits to populate this sector.</p>
             </div>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEntries.map((entry) => (
              <div 
                key={entry.id} 
                className="bg-secondary/30 border border-white/5 p-5 rounded-2xl flex flex-col gap-4 hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300 group relative overflow-hidden animate-in fade-in zoom-in-95 duration-500"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:bg-primary/10 transition-all"></div>
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      {getTypeIcon(entry.type)}
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-white group-hover:text-primary transition-colors">{entry.target}</div>
                      <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter opacity-50">{entry.type} // {formatDate(entry.timestamp)}</div>
                    </div>
                  </div>
                  {confirmDeleteId === entry.id ? (
                    <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/30 p-1 rounded-lg">
                      <button 
                        onClick={() => handleDelete(entry.id)} 
                        className="text-[9px] font-black uppercase tracking-wider text-destructive hover:bg-destructive hover:text-white px-2 py-1 rounded transition-colors"
                      >
                        Purge
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(null)} 
                        className="text-[9px] font-black uppercase tracking-wider text-muted-foreground hover:text-white px-1.5 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setConfirmDeleteId(entry.id)} 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      title="Purge record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="flex-grow min-h-0 relative z-10">
                   <div className="bg-black/40 rounded-xl p-4 border border-white/5 h-32 overflow-hidden text-[11px] font-mono text-primary/70 leading-relaxed italic relative">
                      {entry.data.substring(0, 300)}...
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                   </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                  <Button 
                    variant="outline" 
                    onClick={() => setViewingEntry(entry)}
                    className="flex-1 h-9 text-[10px] uppercase font-black tracking-widest border-white/10 hover:border-primary/50 bg-transparent"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-2 text-primary" /> View Full Intel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownload(entry)}
                    className="h-9 px-3 border-white/10 hover:border-primary/50 bg-transparent hover:text-primary"
                    title="Export Intel"
                  >
                    <Download className="w-3.5 h-3.5 text-primary opacity-70 group-hover:opacity-100" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Intel Viewer Overlay Modal */}
      {viewingEntry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          <div className="bg-[#0e0e11] border border-primary/30 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-secondary/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {getTypeIcon(viewingEntry.type)}
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">{viewingEntry.target}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
                    {viewingEntry.type} // {formatDate(viewingEntry.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleCopy(viewingEntry.data)} 
                  className="h-8 text-[10px] uppercase font-black"
                >
                  {copied ? <Check className="w-3.5 h-3.5 mr-1 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDownload(viewingEntry)} 
                  className="h-8 text-[10px] uppercase font-black"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Export
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewingEntry(null)} 
                  className="h-8 w-8 text-muted-foreground hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-black/40">
              <div className="markdown-body prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:text-primary prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-strong:text-primary prose-code:text-primary text-[13px]">
                <Markdown>{viewingEntry.data}</Markdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
