
import React from 'react';

interface DashboardProps {
  connectedPlatforms: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ connectedPlatforms }) => {
  const stats = [
    { label: 'Total Reach', value: '1.2M', change: '+18.4%', icon: 'fa-users', color: 'text-blue-500', glow: 'shadow-blue-500/10' },
    { label: 'Engagement', value: '4.8%', change: '+0.6%', icon: 'fa-heart', color: 'text-rose-500', glow: 'shadow-rose-500/10' },
    { label: 'Velocity', value: '14/wk', change: '-2%', icon: 'fa-bolt', color: 'text-yellow-500', glow: 'shadow-yellow-500/10' },
    { label: 'Growth', value: '92/100', change: '+5', icon: 'fa-chart-line', color: 'text-emerald-500', glow: 'shadow-emerald-500/10' },
  ];

  return (
    <div className="py-8 md:py-12 fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 text-gradient">System Overview</h1>
          <p className="text-slate-500 font-medium text-lg">Harnessing <span className="text-blue-500 font-bold">{connectedPlatforms.length} active pipelines</span> across your network.</p>
        </div>
        <div className="flex gap-4">
          <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3 border border-white/5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]"></span>
            <span className="text-[10px] mono font-bold text-white uppercase tracking-widest">Global Status: Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-16">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-slate-900/40 border border-white/5 p-8 rounded-[32px] glass hover:border-blue-500/30 transition-all group shadow-2xl ${stat.glow}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 bg-slate-950 border border-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
              <i className={`fas ${stat.icon} text-lg`}></i>
            </div>
            <p className="text-slate-500 text-[10px] mono font-bold uppercase tracking-widest mb-2">{stat.label}</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">{stat.value}</h3>
              <span className={`text-[10px] mono font-bold px-2 py-1 rounded-lg ${stat.change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-[40px] p-8 md:p-12 glass shadow-2xl">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white mb-1">Performance Velocity</h3>
              <p className="text-xs text-slate-500 mono uppercase tracking-widest font-bold">Real-time aggregate engagement</p>
            </div>
            <div className="flex gap-1.5 p-1 bg-slate-950/50 rounded-xl border border-white/5">
               <button className="px-4 py-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">Week</button>
               <button className="px-4 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-300">Month</button>
            </div>
          </div>
          
          <div className="h-[250px] md:h-[350px] flex items-end gap-2 md:gap-4 pb-10 px-2">
            {[40, 70, 45, 90, 65, 80, 50, 85, 95, 60, 75, 55].map((val, i) => (
              <div key={i} className="flex-1 bg-slate-800/50 rounded-t-xl relative group transition-all hover:bg-blue-600/10 border border-white/5 border-b-0">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-xl transition-all group-hover:brightness-125 shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                  style={{ height: `${val}%` }}
                ></div>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-950 text-[10px] font-black px-2 py-1 rounded-md shadow-xl pointer-events-none">
                  {val}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] mono font-bold text-slate-600 px-4 uppercase tracking-[0.4em] pt-4 border-t border-white/5">
            <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-950 group">
             <div className="relative z-10">
               <h4 className="text-2xl font-black mb-3 italic">Nexus Elite</h4>
               <p className="text-blue-100 text-sm mb-8 leading-relaxed font-medium">Activate autonomous multi-variant deployment and viral trend detection.</p>
               <button className="bg-white text-blue-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95">
                 Upgrade Now
               </button>
             </div>
             <i className="fas fa-microchip absolute -bottom-10 -right-10 text-white/10 text-[180px] -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-700"></i>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-[40px] p-10 glass shadow-2xl">
             <div className="flex items-center justify-between mb-8">
               <h4 className="font-black text-white uppercase tracking-[0.2em] text-xs">Queue</h4>
               <span className="text-[10px] mono bg-slate-800 px-2 py-1 rounded text-slate-400">Next 24h</span>
             </div>
             <div className="space-y-5">
               {[
                 { platform: 'linkedin', time: '2h', title: 'Q3 Product Sync', color: 'text-blue-400' },
                 { platform: 'instagram', time: '6PM', title: 'Brand Story Concept', color: 'text-rose-400' }
               ].filter(post => connectedPlatforms.includes(post.platform)).map((post, i) => (
                 <div key={i} className="flex items-center gap-4 p-4 bg-slate-950/40 hover:bg-slate-800/60 rounded-2xl border border-white/5 transition-all cursor-pointer group">
                   <div className={`w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center ${post.color} group-hover:scale-110 transition-transform`}>
                     <i className={`fab fa-${post.platform} text-base`}></i>
                   </div>
                   <div className="min-w-0">
                     <p className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{post.title}</p>
                     <p className="text-[9px] mono font-bold text-slate-500 uppercase tracking-widest">Starts in {post.time}</p>
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
