import { useState, useEffect } from "react";
import { Shield, Key, LogOut } from "lucide-react";
import { GhostChat } from "./components/GhostChat";
import { IntelRecon } from "./components/IntelRecon";
import { ImageOps } from "./components/ImageOps";
import { DbManager } from "./components/DbManager";
import { Dashboard } from "./components/Dashboard";
import { IPScanner } from "./components/IPScanner";
import { SourceAuditor } from "./components/SourceAuditor";
import { PhishingLab } from "./components/PhishingLab";
import { MalwareAnalyzer } from "./components/MalwareAnalyzer";
import { MetadataX } from "./components/MetadataX";
import { SigintSuite } from "./components/SigintSuite";
import { auth, signInWithGoogle, logout, onAuthStateChanged } from "./lib/firebase";
import type { User } from "firebase/auth";
import { Button } from "./components/ui/button";

export default function App() {
  const [activeModule, setActiveModule] = useState<'dashboard' | 'chat' | 'recon' | 'image' | 'db' | 'ip-scan' | 'source-audit' | 'phishing' | 'malware' | 'metadata' | 'sigint'>('dashboard');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Header section */}
      <header className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-border bg-[#0A0A0B]/80 backdrop-blur-md shrink-0 gap-4">
        <div className="font-bold text-[18px] tracking-widest flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(62,99,221,0.3)]">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline">NEXUS COMMAND // <span className="text-primary">CORE</span></span>
          <span className="sm:hidden text-primary">NEXUS</span>
        </div>
        
        {/* Navigation - Scrollable on mobile */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 scrollbar-hide no-scrollbar">
          <div className="flex gap-1 items-center px-1">
            <NavPill label="Dash" isActive={activeModule === 'dashboard'} onClick={() => setActiveModule('dashboard')} />
            <div className="w-[1px] h-4 bg-border mx-1"></div>
            <NavPill label="Ghost" isActive={activeModule === 'chat'} onClick={() => setActiveModule('chat')} />
            <NavPill label="Recon" isActive={activeModule === 'recon'} onClick={() => setActiveModule('recon')} />
            <NavPill label="Scan" isActive={activeModule === 'ip-scan'} onClick={() => setActiveModule('ip-scan')} />
            <NavPill label="Audit" isActive={activeModule === 'source-audit'} onClick={() => setActiveModule('source-audit')} />
            <NavPill label="Phish" isActive={activeModule === 'phishing'} onClick={() => setActiveModule('phishing')} />
            <NavPill label="Malware" isActive={activeModule === 'malware'} onClick={() => setActiveModule('malware')} />
            <NavPill label="X-Ray" isActive={activeModule === 'metadata'} onClick={() => setActiveModule('metadata')} />
            <NavPill label="SIGINT" isActive={activeModule === 'sigint'} onClick={() => setActiveModule('sigint')} />
            <NavPill label="Covert" isActive={activeModule === 'image'} onClick={() => setActiveModule('image')} />
            <NavPill label="Vault" isActive={activeModule === 'db'} onClick={() => setActiveModule('db')} />
          </div>
          
          <div className="w-[1px] h-6 bg-border mx-2"></div>
          
          <div className="flex items-center gap-2 shrink-0 pr-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col items-end mr-1">
                  <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">Authorized Operative</span>
                  <span className="text-[10px] text-muted-foreground">{user.email?.split('@')[0]}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={signInWithGoogle} variant="outline" className="h-8 text-[10px] px-3 uppercase bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 font-bold tracking-widest">
                <Key className="w-3 h-3 mr-2" /> Connect
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Component Container */}
      <main className="flex-grow flex flex-col relative overflow-hidden min-h-0 p-4 md:p-6 lg:p-8">
        {activeModule === 'dashboard' && <Dashboard onNavigate={setActiveModule as any} />}
        {activeModule === 'chat' && <GhostChat />}
        {activeModule === 'recon' && <IntelRecon />}
        {activeModule === 'ip-scan' && <IPScanner user={user} />}
        {activeModule === 'source-audit' && <SourceAuditor user={user} />}
        {activeModule === 'phishing' && <PhishingLab user={user} />}
        {activeModule === 'malware' && <MalwareAnalyzer user={user} />}
        {activeModule === 'metadata' && <MetadataX user={user} />}
        {activeModule === 'sigint' && <SigintSuite user={user} />}
        {activeModule === 'image' && <ImageOps />}
        {activeModule === 'db' && <DbManager user={user} />}
      </main>
    </div>
  );
}

function NavPill({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] rounded-md transition-all duration-300 border ${
        isActive 
          ? 'bg-primary text-white border-primary shadow-[0_0_12px_rgba(62,99,221,0.4)] translate-y-[-1px]' 
          : 'bg-transparent text-muted-foreground border-transparent hover:border-border hover:bg-secondary/50'
      }`}
    >
      {label}
    </button>
  );
}
