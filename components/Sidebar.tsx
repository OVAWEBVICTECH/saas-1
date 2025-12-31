
import React, { useState } from 'react';
import { NavPage } from '../types';

interface SidebarProps {
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, onOpen, onClose }) => {
  const [isStudioExpanded, setIsStudioExpanded] = useState(true);

  const menuItems = [
    { id: NavPage.DASHBOARD, label: 'Metrics', icon: 'fa-chart-network' },
    { 
      id: NavPage.GENERATE, 
      label: 'Studio', 
      icon: 'fa-wand-magic-sparkles',
      subItems: [
        { id: NavPage.STUDIO_DESIGN, label: 'Design Studio', icon: 'fa-palette' },
        { id: NavPage.STUDIO_IDEATION, label: 'Ideation Lab', icon: 'fa-lightbulb' },
        { id: NavPage.STUDIO_INTELLIGENCE, label: 'Deep Intel', icon: 'fa-brain-circuit' },
        { id: NavPage.STUDIO_ANALYTICS, label: 'Neural Analytics', icon: 'fa-chart-pie-simple' },
      ]
    },
    { id: NavPage.CHANNELS, label: 'Channels', icon: 'fa-link' },
    { id: NavPage.HISTORY, label: 'Archive', icon: 'fa-box-archive' },
    { id: NavPage.SETTINGS, label: 'System', icon: 'fa-sliders' },
  ];

  const handleNavClick = (pageId: NavPage) => {
    setActivePage(pageId);
    onClose();
  };

  const isStudioActive = activePage === NavPage.GENERATE || 
    activePage === NavPage.STUDIO_DESIGN || 
    activePage === NavPage.STUDIO_IDEATION || 
    activePage === NavPage.STUDIO_INTELLIGENCE || 
    activePage === NavPage.STUDIO_ANALYTICS;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[110] animate-in fade-in duration-500"
          onClick={onClose}
        />
      )}

      {/* Sidebar Desktop/Drawer */}
      <aside className={`
        fixed lg:relative h-full flex flex-col z-[120] transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
        bg-[#020617]/95 lg:bg-transparent backdrop-blur-3xl lg:backdrop-blur-none border-r border-white/5
        w-[80vw] sm:w-85 lg:w-72
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Branding */}
        <div className="p-10 lg:p-12 shrink-0">
          <div className="flex items-center gap-5 group cursor-pointer" onClick={() => handleNavClick(NavPage.DASHBOARD)}>
            <div className="w-14 h-14 bg-blue-600 rounded-[22px] flex items-center justify-center shadow-4xl shadow-blue-600/30 group-hover:scale-105 group-hover:rotate-6 transition-soft ring-4 ring-blue-600/10">
              <i className="fas fa-microchip text-white text-2xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none">Webvic</span>
              <span className="text-[10px] mono font-bold text-blue-500 tracking-[0.6em] uppercase opacity-80 mt-1">Flow</span>
            </div>
          </div>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 px-8 space-y-2 mt-10 overflow-y-auto hide-scrollbar pb-40 lg:pb-12">
          {menuItems.map((item) => (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  if (item.subItems) {
                    setIsStudioExpanded(!isStudioExpanded);
                  } else {
                    handleNavClick(item.id);
                  }
                }}
                className={`w-full flex items-center gap-5 px-6 py-4 rounded-[22px] transition-soft group relative overflow-hidden ${
                  (item.subItems ? isStudioActive : activePage === item.id)
                    ? 'bg-blue-600 text-white shadow-3xl shadow-blue-600/20'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <i className={`fas ${item.icon} text-xl ${ (item.subItems ? isStudioActive : activePage === item.id) ? 'text-white' : 'group-hover:text-blue-500 group-hover:scale-110'} transition-soft`}></i>
                <span className="font-black text-sm tracking-tight uppercase tracking-widest leading-none flex-1 text-left">{item.label}</span>
                {item.subItems && (
                  <i className={`fas fa-chevron-down text-[10px] transition-transform duration-500 ${isStudioExpanded ? 'rotate-180' : ''}`}></i>
                )}
              </button>

              {item.subItems && isStudioExpanded && (
                <div className="pl-6 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-300">
                  {item.subItems.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => handleNavClick(sub.id)}
                      className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-[18px] transition-soft text-[11px] font-black uppercase tracking-widest ${
                        activePage === sub.id 
                          ? 'text-blue-500 bg-blue-500/5' 
                          : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <i className={`fas ${sub.icon} w-5 text-center`}></i>
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Account Footer */}
        <div className="p-8 lg:p-10 mt-auto shrink-0 pb-32 lg:pb-10">
          <div className="glass-dark rounded-[36px] p-6 border border-white/10 shadow-4xl ring-1 ring-white/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black shadow-2xl border border-white/10 text-white">VO</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate leading-tight">Victor Olaiya</p>
                <p className="text-[9px] mono font-bold text-slate-500 uppercase tracking-widest mt-0.5">Principal</p>
              </div>
            </div>
            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-[94%] shadow-[0_0_12px_#3b82f6]"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Bar - Fixed View */}
      <nav className="lg:hidden fixed bottom-6 left-4 right-4 h-22 glass border border-white/15 rounded-[32px] flex items-center justify-between px-2 z-[100] shadow-5xl ring-1 ring-white/10">
        <div className="flex-1 flex justify-around items-center h-full py-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.subItems) {
                   // Mobile nav logic: if it has subitems, clicking it goes to the first subitem if not already in studio
                   if (!isStudioActive) {
                     handleNavClick(NavPage.STUDIO_DESIGN);
                   } else {
                     onOpen && onOpen(); // Open sidebar to show sub-options
                   }
                } else {
                  handleNavClick(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all duration-500 relative ${
                (item.subItems ? isStudioActive : activePage === item.id) ? 'text-blue-500 scale-105' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {(item.subItems ? isStudioActive : activePage === item.id) && (
                <div className="absolute -top-1 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
              )}
              <i className={`fas ${item.icon} text-lg`}></i>
              <span className="text-[7px] mono font-black uppercase tracking-widest opacity-80">{item.label}</span>
            </button>
          ))}
          <div className="w-px h-10 bg-white/10 mx-1"></div>
          <button
            className="p-4 rounded-full bg-slate-900/80 flex items-center justify-center text-slate-400 border border-white/10 shadow-inner"
            onClick={onOpen}
          >
            <i className="fas fa-bars-staggered"></i>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
