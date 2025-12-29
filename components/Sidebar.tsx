
import React from 'react';
import { NavPage } from '../types';

interface SidebarProps {
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, onOpen, onClose }) => {
  const menuItems = [
    { id: NavPage.DASHBOARD, label: 'Metrics', icon: 'fa-chart-network' },
    { id: NavPage.GENERATE, label: 'Studio', icon: 'fa-wand-magic-sparkles' },
    { id: NavPage.CHANNELS, label: 'Channels', icon: 'fa-link' },
    { id: NavPage.HISTORY, label: 'Archive', icon: 'fa-box-archive' },
    { id: NavPage.SETTINGS, label: 'System', icon: 'fa-sliders' },
  ];

  return (
    <>
      {/* Dynamic Mobile Layer */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-2xl z-[110] animate-in fade-in duration-700"
          onClick={onClose}
        />
      )}

      {/* Sidebar Architecture */}
      <aside className={`
        fixed lg:relative h-full flex flex-col z-[120] transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
        bg-[#020617]/95 lg:bg-transparent backdrop-blur-3xl lg:backdrop-blur-none border-r border-white/5
        w-[80vw] sm:w-80 lg:w-72
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Branding Interface */}
        <div className="p-10 lg:p-12 shrink-0">
          <div className="flex items-center gap-5 group cursor-pointer" onClick={() => { setActivePage(NavPage.DASHBOARD); onClose(); }}>
            <div className="w-14 h-14 bg-blue-600 rounded-[22px] flex items-center justify-center shadow-3xl shadow-blue-600/40 group-hover:scale-110 group-hover:rotate-6 transition-soft ring-4 ring-blue-600/10">
              <i className="fas fa-microchip text-white text-2xl"></i>
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none">Webvic</span>
              <span className="text-[11px] mono font-bold text-blue-500 tracking-[0.5em] uppercase opacity-80 pl-0.5">Flow</span>
            </div>
          </div>
        </div>

        {/* Navigation Interface - Optimized for scrolling and visibility */}
        <nav className="flex-1 px-8 space-y-2 mt-8 overflow-y-auto hide-scrollbar pb-32 lg:pb-12">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActivePage(item.id); onClose(); }}
              className={`w-full flex items-center gap-5 px-6 py-5 rounded-[24px] transition-soft group relative overflow-hidden ${
                activePage === item.id
                  ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {activePage === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-[0_0_15px_#fff]"></div>
              )}
              <i className={`fas ${item.icon} text-xl ${activePage === item.id ? 'text-white' : 'group-hover:text-blue-400 group-hover:scale-110'} transition-soft`}></i>
              <span className="font-black text-sm tracking-tight uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Infrastructure Section */}
        <div className="p-8 lg:p-10 mt-auto shrink-0 pb-32 lg:pb-10">
          <div className="glass rounded-[32px] p-6 border border-white/10 shadow-4xl ring-1 ring-white/5">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black shadow-2xl border border-white/10">VO</div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-black text-white truncate tracking-tight">Victor Olaiya</p>
                <p className="text-[10px] mono font-bold text-slate-600 uppercase tracking-widest">Webvic Principal</p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
              <div className="h-full bg-blue-600 w-[94%] shadow-[0_0_15px_#3b82f6] transition-all duration-1000"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Adaptive Mobile Controller Bar - Refined to ensure System is always visible */}
      <nav className="lg:hidden fixed bottom-6 left-4 right-4 h-20 glass border border-white/15 rounded-full flex items-center justify-between px-3 z-[100] shadow-5xl ring-1 ring-white/10">
        <div className="flex-1 flex justify-around items-center">
          {menuItems.filter(item => item.id !== NavPage.HISTORY).map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center gap-1 p-2 transition-soft ${
                activePage === item.id ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <i className={`fas ${item.icon} text-lg`}></i>
              <span className="text-[7px] mono font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="w-px h-10 bg-white/10 mx-2 shrink-0"></div>
        <button
          className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-slate-400 border border-white/10 active:scale-90 transition-soft shadow-3xl shrink-0"
          onClick={onOpen}
        >
          <i className="fas fa-bars-staggered text-lg"></i>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
