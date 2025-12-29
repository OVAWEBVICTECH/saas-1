
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PostCreator from './components/PostCreator';
import SocialHub from './components/SocialHub';
import MarketResearch from './components/MarketResearch';
import VisualAnalytics from './components/VisualAnalytics';
import ContentLab from './components/ContentLab';
import { NavPage, SocialAccount } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<NavPage>(NavPage.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);

  const handleConnect = (account: SocialAccount) => {
    setConnectedAccounts(prev => {
      const exists = prev.find(a => a.platformId === account.platformId);
      if (exists) return prev.map(a => a.platformId === account.platformId ? account : a);
      return [...prev, account];
    });
  };

  const handleDisconnect = (platformId: string) => {
    setConnectedAccounts(prev => prev.filter(a => a.platformId !== platformId));
  };

  const renderPage = () => {
    switch (activePage) {
      case NavPage.DASHBOARD:
        return <Dashboard connectedPlatforms={connectedAccounts.map(a => a.platformId)} />;
      case NavPage.GENERATE:
        return (
          <div className="space-y-16 md:space-y-32">
            <PostCreator 
              connectedAccounts={connectedAccounts} 
              onNavigateToAuth={() => setActivePage(NavPage.CHANNELS)} 
            />
            <div className="border-t border-white/5 pt-16 md:pt-32">
              <ContentLab />
            </div>
            <div className="border-t border-white/5 pt-16 md:pt-32">
              <MarketResearch />
            </div>
            <div className="border-t border-white/5 pt-16 md:pt-32">
              <VisualAnalytics />
            </div>
          </div>
        );
      case NavPage.CHANNELS:
        return (
          <SocialHub 
            connectedAccounts={connectedAccounts} 
            onConnect={handleConnect} 
            onDisconnect={handleDisconnect} 
          />
        );
      case NavPage.HISTORY:
        return (
          <div className="py-32 text-center animate-in zoom-in-95 duration-700">
            <div className="w-28 h-28 bg-slate-900/40 rounded-full flex items-center justify-center mx-auto mb-10 border border-white/5 shadow-inner glass">
              <i className="fas fa-folder-open text-4xl text-slate-700"></i>
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Archive Empty</h2>
            <p className="text-slate-500 max-w-sm mx-auto font-medium text-lg leading-relaxed">Synthesis history will populate once your campaigns transition from the lab to production.</p>
          </div>
        );
      case NavPage.SETTINGS:
        return (
          <div className="py-12 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-12 tracking-tighter">System Configuration</h1>
            <div className="bg-slate-900/40 border border-white/5 rounded-[40px] p-8 md:p-14 glass shadow-4xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                <i className="fas fa-gears text-[300px]"></i>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-10 mb-14 pb-14 border-b border-white/5">
                 <div className="w-28 h-28 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-4xl font-black shadow-2xl shadow-blue-500/20 text-white ring-4 ring-white/5">VO</div>
                 <div className="text-center md:text-left space-y-2">
                    <h3 className="text-3xl font-black text-white tracking-tight">Victor Olaiya</h3>
                    <p className="text-slate-500 font-bold text-lg mono uppercase tracking-widest">Enterprise Principal • Webvictech</p>
                 </div>
              </div>
              <div className="space-y-8">
                 <div className="p-8 bg-slate-950/40 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-soft">
                   <div className="space-y-1">
                     <p className="text-sm font-black text-white uppercase tracking-widest">Kernel Version</p>
                     <p className="text-xs text-slate-500 mono">2.0.4-flash-native-stable</p>
                   </div>
                   <div className="px-4 py-1.5 bg-blue-600/10 text-blue-500 rounded-full text-[10px] mono font-bold border border-blue-500/20">LATEST</div>
                 </div>
              </div>
            </div>
          </div>
        )
      default:
        return <Dashboard connectedPlatforms={connectedAccounts.map(a => a.platformId)} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020617] text-slate-200">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isOpen={isSidebarOpen}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 overflow-y-auto relative pb-24 lg:pb-0 scroll-smooth hide-scrollbar">
        {/* Dynamic Background Accents */}
        <div className="fixed top-0 right-0 -z-0 w-[1000px] h-[1000px] bg-blue-600/10 blur-[200px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="fixed bottom-0 left-0 lg:left-64 -z-0 w-[800px] h-[800px] bg-indigo-600/10 blur-[180px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none opacity-60"></div>

        <header className="h-20 md:h-24 flex items-center justify-between px-6 md:px-12 sticky top-0 bg-slate-950/60 backdrop-blur-3xl z-[60] border-b border-white/5">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-11 h-11 rounded-2xl glass flex items-center justify-center text-slate-400 hover:text-white transition-soft active:scale-90"
            >
              <i className="fas fa-bars-staggered"></i>
            </button>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[10px] mono font-bold uppercase tracking-[0.3em] text-slate-600">Infrastructure /</span>
              <span className="text-sm font-black uppercase tracking-[0.15em] text-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.4)] transition-soft">{activePage}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-3 bg-slate-950/60 border border-white/5 rounded-full px-6 py-2.5 glass shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse"></span>
              <span className="text-[10px] mono font-black uppercase tracking-[0.2em] text-slate-400">
                Core: Active
              </span>
            </div>
            <button 
              onClick={() => setActivePage(NavPage.GENERATE)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 active:scale-95 transition-soft"
            >
              <i className="fas fa-bolt-lightning text-lg"></i>
            </button>
          </div>
        </header>

        <div className="px-6 md:px-16 lg:px-20 pb-16 md:pb-32 relative z-10 max-w-[1920px] mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
