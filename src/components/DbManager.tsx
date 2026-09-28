import { useState, useEffect } from "react";
import { Database, HardDrive, Shield, Lock, Trash2, Key, Search, Loader2, Download, ExternalLink, Network, Code } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { db, handleFirestoreError, OperationType, collection, query, where, onSnapshot, doc, deleteDoc, Timestamp } from "@/lib/firebase";
import type { User } from "firebase/auth";

interface LootEntry {
  id: string;
  type: string;
  target: string;
  timestamp: Timestamp;
  data: string;
  userId: string;
}

export function DbManager({ user }: { user: User | null }) {
  const [entries, setEntries] = useState<LootEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
      snapshot.forEach((doc) => {
        lootData.push({ id: doc.id, ...doc.data() } as LootEntry);
      });
      // Sort by timestamp desc
      lootData.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
      setEntries(lootData);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, "loot");
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to purge this record from the tactical vault?")) return;
    try {
      await deleteDoc(doc(db, "loot", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `loot/${id}`);
    }
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
    <div className="bento-card h-full max-w-6xl mx-auto w-full p-0 flex flex-col border-primary/20 bg-[#0A0A0B]">
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
          <div className="h-full flex flex-col items-center justify-center gap-4 text-primary">
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
                      {entry.type === 'IP_SCAN' ? <Network className="w-5 h-5" /> : entry.type === 'SOURCE_AUDIT' ? <Code className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-white group-hover:text-primary transition-colors">{entry.target}</div>
                      <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter opacity-50">{entry.type} // {entry.timestamp.toDate().toLocaleString()}</div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(entry.id)} 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex-grow min-h-0 relative z-10">
                   <div className="bg-black/40 rounded-xl p-4 border border-white/5 h-32 overflow-hidden text-[11px] font-mono text-primary/70 leading-relaxed italic relative">
                      {entry.data.substring(0, 300)}...
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                   </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                  <Button variant="outline" className="flex-1 h-9 text-[10px] uppercase font-black tracking-widest border-white/10 hover:border-primary/50 bg-transparent">
                    <ExternalLink className="w-3.5 h-3.5 mr-2 text-primary" /> View Full Intel
                  </Button>
                  <Button variant="outline" className="h-9 px-3 border-white/10 hover:border-primary/50 bg-transparent">
                    <Download className="w-3.5 h-3.5 text-primary opacity-50" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
