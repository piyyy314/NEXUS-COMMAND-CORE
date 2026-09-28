import { Terminal, Shield, Eye, Image as ImageIcon, Database, Globe, Server, Activity, HardDrive, Network, Code, Mail, Bug, Scan, Radio } from "lucide-react";

export function Dashboard({ onNavigate }: { onNavigate: (module: 'dashboard' | 'chat' | 'recon' | 'image' | 'db' | 'ip-scan' | 'source-audit' | 'phishing' | 'malware' | 'metadata' | 'sigint') => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-min gap-6 flex-1 min-h-0 overflow-y-auto w-full max-w-full pb-8 pr-2 no-scrollbar">
      {/* 2x2 Main Active Environment Card */}
      <div className="bento-card lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-[#141416] via-[#141416] to-[#1a1a1e] border-primary/20 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="bento-card-title !mb-0 opacity-100 flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary" />
            NEXUS_OPERATIONS_CENTER
          </div>
          <div className="text-[9px] font-mono text-primary animate-pulse tracking-widest bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            SYSTEM_ENCRYPTED
          </div>
        </div>
        
        <div className="flex-grow flex flex-col justify-center py-4">
          <div className="bento-big-text text-white tracking-tighter mb-1">COMMAND_V7</div>
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded">
              <span className="bento-status-dot !mr-0 pulse bg-green-500"></span> 
              <span className="text-[10px] font-black text-green-500/80 uppercase tracking-tighter">Operational</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded">
              <Server className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Region: US-EAST-1</span>
            </div>
          </div>
          
          <div className="space-y-1 font-mono text-[11px] text-primary/80 bg-black/40 p-5 rounded-xl border border-white/5 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
            <div className="flex items-center gap-3"><span className="text-[9px] opacity-30">01</span> <span className="text-white/40">{">>" }</span> Initializing tactical protocols...</div>
            <div className="flex items-center gap-3"><span className="text-[9px] opacity-30">02</span> <span className="text-white/40">{">>" }</span> Synchronizing with remote vault...</div>
            <div className="flex items-center gap-3 text-green-500"><span className="text-[9px] opacity-30">03</span> <span className="text-white/40">{">>" }</span> Firebase connection established.</div>
            <div className="flex items-center gap-3 text-primary"><span className="text-[9px] opacity-30">04</span> <span className="text-white/40">{">>" }</span> AES-256 GCM logic engaged.</div>
            <div className="mt-4 pt-4 border-t border-white/5 text-foreground/90 font-bold uppercase tracking-[0.2em]">{">"} Operative session active.</div>
            <div className="animate-pulse mt-1 text-primary cursor-default">_</div>
          </div>
        </div>
      </div>

      {/* Toolkit Access - 1x1 Cards */}
      <DashboardToolCard 
        title="Network Recon" 
        icon={<Network className="w-8 h-8" />} 
        description="IP & Port Analysis"
        onClick={() => onNavigate('ip-scan')} 
      />

      <DashboardToolCard 
        title="SIGINT & EW Suite" 
        icon={<Radio className="w-8 h-8" />} 
        description="RF & GPS Defense"
        onClick={() => onNavigate('sigint')} 
      />

      <DashboardToolCard 
        title="Source Auditor" 
        icon={<Code className="w-8 h-8" />} 
        description="Static Code Analysis"
        onClick={() => onNavigate('source-audit')} 
      />

      <DashboardToolCard 
        title="Phishing Lab" 
        icon={<Mail className="w-8 h-8" />} 
        description="Social Engineering"
        onClick={() => onNavigate('phishing')} 
      />

      <DashboardToolCard 
        title="Malware Sandbox" 
        icon={<Bug className="w-8 h-8" />} 
        description="Heuristic Analysis"
        onClick={() => onNavigate('malware')} 
      />

      <DashboardToolCard 
        title="Metadata X-Ray" 
        icon={<Scan className="w-8 h-8" />} 
        description="Artifact Extraction"
        onClick={() => onNavigate('metadata')} 
      />

      <DashboardToolCard 
        title="Ghost Link" 
        icon={<Terminal className="w-8 h-8" />} 
        description="AI C2 Interface"
        onClick={() => onNavigate('chat')} 
      />

      {/* 2x1 Asset Selection Cards */}
      <div className="bento-card lg:col-span-2 hover:border-primary/40 group transition-all duration-500 cursor-pointer overflow-hidden p-0 bg-secondary/20 h-[160px]" onClick={() => onNavigate('recon')}>
        <div className="flex h-full">
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="bento-card-title !mb-0 opacity-100 flex items-center gap-2">
              <Eye className="w-3 h-3 text-primary" />
              INTEL_GATHERING
            </div>
            <div>
              <div className="text-[18px] font-black uppercase tracking-tight text-white mb-1">Global Intelligence</div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest opacity-60">Grounding / Maps / OSINT</p>
            </div>
          </div>
          <div className="w-1/3 bg-primary/5 flex items-center justify-center border-l border-white/5 relative group-hover:bg-primary/10 transition-colors">
            <Globe className="w-12 h-12 text-primary opacity-20 group-hover:opacity-40 transition-all duration-700 group-hover:rotate-12" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(62,99,221,0.1),transparent)] group-hover:opacity-100 transition-opacity"></div>
          </div>
        </div>
      </div>

      <DashboardToolCard 
        title="Synthetic ID" 
        icon={<ImageIcon className="w-8 h-8" />} 
        description="Visual Obfuscation"
        onClick={() => onNavigate('image')} 
      />

      <DashboardToolCard 
        title="Storage Vault" 
        icon={<HardDrive className="w-8 h-8" />} 
        description="Encrypted Loot"
        onClick={() => onNavigate('db')} 
        status={<div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>}
      />
    </div>
  );
}

function DashboardToolCard({ title, icon, description, onClick, status }: { title: string, icon: React.ReactNode, description: string, onClick: () => void, status?: React.ReactNode }) {
  return (
    <div 
      className="bento-card group cursor-pointer hover:border-primary/50 hover:bg-secondary/40 transition-all duration-300 relative overflow-hidden h-[180px] p-6"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 text-primary group-hover:scale-110 group-hover:text-white group-hover:bg-primary transition-all duration-500 shadow-xl">
          {icon}
        </div>
        {status}
      </div>
      <div className="mt-auto">
        <h3 className="text-[13px] font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50 mt-1 font-bold">{description}</p>
      </div>
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <Terminal className="w-3 h-3 text-primary" />
        </div>
      </div>
    </div>
  );
}
