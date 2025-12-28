
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
    { id: NavPage.DASHBOARD, label: 'Performance', icon: 'fa-chart-simple' },
    { id: NavPage.GENERATE, label: 'Create', icon: 'fa-plus-circle' },
    { id: NavPage.CHANNELS, label: 'Social Hub', icon: 'fa-share-nodes' },
    { id: NavPage.HISTORY, label: 'Archive', icon: 'fa-clock-rotate-left' },
    { id: NavPage.SETTINGS, label: 'Settings', icon: 'fa-gear' },
  ];

  const handleNav = (id: NavPage) => {
    setActivePage(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Responsive Sidebar */}
      <div className={`
        fixed lg:relative h-full bg-[#020617] border-r border-white/5 flex flex-col z-[120] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        w-80 lg:w-72
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/40 rotate-3">
              <i className="fas fa-paper-plane text-white text-xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white uppercase italic leading-none">Nexus</span>
              <span className="text-[10px] mono font-bold text-blue-500 tracking-[0.3em] uppercase opacity-80">Intelligence</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white p-2">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 lg:py-4 rounded-2xl transition-all duration-300 group relative ${
                activePage === item.id
                  ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              {activePage === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full shadow-[0_0_10px_white]"></div>
              )}
              <i className={`fas ${item.icon} text-lg transition-transform duration-300 group-hover:scale-110 ${activePage === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}></i>
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto mb-20 lg:mb-8">
          <div className="bg-slate-900/40 rounded-[28px] p-6 border border-white/5 glass shadow-2xl">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black shadow-lg">JD</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-white truncate">Admin Pro</p>
                <p className="text-[9px] mono font-bold text-slate-500 uppercase tracking-widest">Enterprise v3.4</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-500">CONTENT LOAD</span>
                <span className="text-blue-500">85%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full w-[85%] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Redefined for better ergonomics */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 h-18 bg-slate-950/80 backdrop-blur-3xl border border-white/5 rounded-[24px] flex items-center justify-around px-4 z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {menuItems.slice(0, 3).map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
              activePage === item.id ? 'text-blue-500 scale-110 bg-blue-500/10' : 'text-slate-500'
            }`}
          >
            <i className={`fas ${item.icon} text-lg`}></i>
            <span className="text-[8px] mono font-bold uppercase tracking-tight">{item.label}</span>
          </button>
        ))}
        <button
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-slate-500 hover:text-white"
          onClick={onOpen}
        >
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5">
            <i className="fas fa-bars-staggered text-base"></i>
          </div>
        </button>
      </div>
    </>
  );
};

export default Sidebar;
