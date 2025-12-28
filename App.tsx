
import React, { useState } from 'react';
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
          <div className="space-y-20 md:space-y-32">
            <PostCreator 
              connectedAccounts={connectedAccounts} 
              onNavigateToAuth={() => setActivePage(NavPage.CHANNELS)} 
            />
            <div className="border-t border-slate-900 pt-20">
              <ContentLab />
            </div>
            <div className="border-t border-slate-900 pt-20">
              <MarketResearch />
            </div>
            <div className="border-t border-slate-900 pt-20">
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
          <div className="py-24 text-center">
            <div className="w-24 h-24 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-800 shadow-2xl">
              <i className="fas fa-folder-open text-3xl text-slate-700"></i>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">No Archived Content</h2>
            <p className="text-slate-500 max-w-sm mx-auto">Deployment history will appear here once your campaigns are synthesized and deployed.</p>
          </div>
        );
      case NavPage.SETTINGS:
        return (
          <div className="py-12">
            <h1 className="text-4xl font-black text-white mb-10 text-gradient">Configuration</h1>
            <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-8 md:p-12 max-w-3xl glass backdrop-blur-xl">
              <div className="flex flex-col md:flex-row items-center gap-8 mb-12 pb-12 border-b border-slate-800">
                 <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-3xl font-black shadow-2xl shadow-blue-500/20">JD</div>
                 <div className="text-center md:text-left">
                    <h3 className="text-2xl font-extrabold text-white">James Developer</h3>
                    <p className="text-slate-500 font-medium">Enterprise Administrator • Tier III</p>
                 </div>
              </div>
              <div className="space-y-6">
                 <div className="flex items-center justify-between p-6 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                         <i className="fas fa-shield-alt"></i>
                       </div>
                       <div>
                         <p className="font-bold text-white">Two-Factor Auth</p>
                         <p className="text-xs text-slate-500">Security layer active</p>
                       </div>
                    </div>
                    <div className="w-12 h-6 bg-blue-600 rounded-full relative p-1 cursor-pointer">
                       <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                    </div>
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
      
      <main className="flex-1 overflow-y-auto relative pb-24 lg:pb-0 scroll-smooth">
        <div className="fixed top-0 right-0 -z-0 w-[800px] h-[800px] bg-blue-600/10 blur-[180px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="fixed bottom-0 left-0 lg:left-64 -z-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[160px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

        <header className="h-20 flex items-center justify-between px-6 md:px-12 sticky top-0 bg-slate-950/40 backdrop-blur-2xl z-[60] border-b border-white/5">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-11 h-11 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <i className="fas fa-bars"></i>
            </button>
            <div className="flex items-center gap-3">
              <span className="hidden xs:inline text-[10px] mono font-bold uppercase tracking-[0.2em] text-slate-500">Workspace /</span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">{activePage}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 bg-slate-900/60 border border-white/5 rounded-full px-5 py-2 glass">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse"></span>
              <span className="text-[10px] mono font-bold uppercase tracking-widest text-slate-300">Live Engine</span>
            </div>
            <button 
              onClick={() => setActivePage(NavPage.GENERATE)}
              className="w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              <i className="fas fa-plus text-sm"></i>
            </button>
          </div>
        </header>

        <div className="px-6 md:px-12 pb-12 md:pb-24 relative z-10 max-w-[1600px] mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
