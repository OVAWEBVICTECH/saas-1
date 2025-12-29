
import React from 'react';

interface DashboardProps {
  connectedPlatforms: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ connectedPlatforms }) => {
  const stats = [
    { label: 'Total Reach', value: '1.2M', change: '+18%', icon: 'fa-users-viewfinder', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Engagement', value: '4.8%', change: '+0.6%', icon: 'fa-fire-flame-curved', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Sync Rate', value: '98%', change: '+2', icon: 'fa-bolt-auto', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Velocity', value: '14/wk', change: '-1%', icon: 'fa-gauge-high', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="py-10 md:py-16 space-y-12 md:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">System <span className="text-blue-500 italic drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]">Performance</span></h1>
          <p className="text-slate-500 text-lg font-medium tracking-tight">Orchestrating <span className="text-white font-black">{connectedPlatforms.length}</span> concurrent neural marketing pipelines.</p>
        </div>
        <div className="flex items-center gap-4 px-8 py-4 glass rounded-full border border-white/10 shadow-2xl self-start lg:self-center ring-1 ring-white/5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse-soft"></div>
          <span className="text-[11px] mono font-black text-slate-300 uppercase tracking-[0.3em]">Network Secure</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="glass bento-card p-10 group hover:border-blue-500/30 transition-soft shadow-3xl ring-1 ring-white/5">
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 group-hover:rotate-6 transition-soft shadow-inner`}>
              <i className={`fas ${stat.icon} text-2xl`}></i>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] mono font-black text-slate-600 uppercase tracking-[0.4em]">{stat.label}</p>
              <div className="flex items-baseline justify-between">
                <h3 className="text-4xl font-black text-white tracking-tight">{stat.value}</h3>
                <span className={`text-[11px] font-black px-3 py-1 rounded-xl ${stat.change.startsWith('+') ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-500 bg-rose-500/10 border border-rose-500/20'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Engine Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Engagement Visualization */}
        <div className="lg:col-span-8 glass bento-card p-10 md:p-14 space-y-12 shadow-4xl ring-1 ring-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight">Signal Velocity</h3>
              <p className="text-[11px] mono font-black text-slate-600 uppercase tracking-[0.3em]">Neural Data Feed Delta</p>
            </div>
            <div className="flex gap-2 p-1.5 bg-slate-950/60 rounded-[18px] border border-white/5 glass">
               <button className="px-6 py-2.5 text-[11px] font-black text-white bg-blue-600 rounded-xl shadow-xl transition-soft">WEEK</button>
               <button className="px-6 py-2.5 text-[11px] font-black text-slate-500 hover:text-white transition-soft">MONTH</button>
            </div>
          </div>

          <div className="h-80 flex items-end gap-3 md:gap-4 pb-4">
            {[55, 70, 45, 90, 75, 100, 60, 70, 85, 45, 65, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-slate-800/10 rounded-t-[14px] relative group transition-soft overflow-hidden h-full">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-blue-600 opacity-70 group-hover:opacity-100 transition-all duration-700 shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-white/20"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] mono font-black text-slate-700 uppercase tracking-[0.4em] pt-8 border-t border-white/5">
            <span>MON</span><span>WED</span><span>FRI</span><span>SUN</span>
          </div>
        </div>

        {/* Global Hub Cards */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 rounded-[40px] p-12 text-white relative overflow-hidden group shadow-5xl shadow-blue-900/40 ring-1 ring-white/10">
            <div className="relative z-10 space-y-6">
              <h4 className="text-3xl font-black italic tracking-tighter leading-none">Webvic Elite</h4>
              <p className="text-blue-100/70 text-base font-medium leading-relaxed tracking-tight">Unleash autonomous multi-channel deployment and neural trend synthesis engines.</p>
              <button className="w-full bg-white text-blue-900 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] hover:shadow-2xl transition-soft active:scale-95 shadow-xl">
                UPGRADE KERNEL
              </button>
            </div>
            <i className="fas fa-microchip absolute -bottom-12 -right-12 text-white/5 text-[220px] -rotate-12 group-hover:rotate-0 transition-all duration-1000"></i>
          </div>

          <div className="glass bento-card p-12 flex-1 shadow-4xl ring-1 ring-white/5">
            <h4 className="text-[11px] mono font-black text-white uppercase tracking-[0.4em] mb-10 flex items-center justify-between">
              Signal Queue
              <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg border border-blue-500/20 text-[9px]">LOCKED</span>
            </h4>
            <div className="space-y-6">
               {['Linkedin Strategic Refinement', 'Instagram Creative Overlay'].map((task, i) => (
                 <div key={i} className="p-6 bg-slate-950/40 rounded-[28px] border border-white/5 flex items-center gap-5 group hover:bg-slate-900/60 hover:border-white/10 transition-soft cursor-pointer shadow-inner">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-blue-500 border border-white/5 group-hover:scale-110 transition-soft shadow-2xl">
                      <i className={`fab fa-${i === 0 ? 'linkedin-in' : 'instagram'} text-lg`}></i>
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-black text-white truncate group-hover:text-blue-400 transition-colors">{task}</p>
                      <p className="text-[10px] mono font-bold text-slate-600 uppercase tracking-widest">Awaiting Pulse Signal</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
