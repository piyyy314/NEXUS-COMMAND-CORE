import { useState, useEffect } from "react";
import { Shield, Key, LogOut, Search, Terminal } from "lucide-react";
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
import { CommandPalette, NavModule } from "./components/CommandPalette";
import { auth, signInWithGoogle, logout, onAuthStateChanged } from "./lib/firebase";
import type { User } from "firebase/auth";
import { Button } from "./components/ui/button";

export default function App() {
  const [activeModule, setActiveModule] = useState<NavModule>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        
        {/* Navigation & Command Palette Trigger */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 scrollbar-hide no-scrollbar">
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
          
          <div className="w-[1px] h-6 bg-border mx-1 shrink-0"></div>

          {/* Command Palette Trigger Button */}
          <Button
            variant="outline"
            onClick={() => setCommandPaletteOpen(true)}
            className="h-8 px-2.5 bg-black/40 border-white/10 hover:border-primary/50 text-muted-foreground hover:text-white text-xs font-mono flex items-center gap-2 rounded-lg shrink-0 transition-all hover:shadow-[0_0_10px_rgba(62,99,221,0.2)]"
            title="Search & Command Palette (Cmd+K / Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-primary" />
            <span className="hidden xl:inline text-[10px] uppercase font-bold tracking-wider text-foreground">Palette</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono bg-white/5 border border-white/10 rounded text-muted-foreground">
              ⌘K
            </kbd>
          </Button>

          <div className="flex items-center gap-2 shrink-0 pr-2 ml-1">
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
        {activeModule === 'dashboard' && <Dashboard onNavigate={setActiveModule} onOpenCommandPalette={() => setCommandPaletteOpen(true)} />}
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

      {/* Command Palette Dialog */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={setActiveModule}
      />
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
