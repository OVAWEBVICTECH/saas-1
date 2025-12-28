
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateVisualAnalytics } from '../services/geminiService';
import { AnalyticsReport } from '../types';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const VisualAnalytics: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<AnalyticsReport | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      const data = await generateVisualAnalytics(input);
      setReport(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 md:py-24 fade-in-up">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 md:mb-24 gap-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight text-gradient">Neural Analytics</h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed">Transmit raw data or unstructured narratives and witness instantaneous multidimensional visualization.</p>
        </div>
        <div className="flex gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-white/5 glass">
          <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] mono font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20">Distribution</button>
          <button className="px-6 py-2.5 text-slate-500 hover:text-slate-300 rounded-xl text-[10px] mono font-bold uppercase tracking-widest transition-all">Timeline</button>
          <button className="px-6 py-2.5 text-slate-500 hover:text-slate-300 rounded-xl text-[10px] mono font-bold uppercase tracking-widest transition-all">Proportion</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        <div className="xl:col-span-1">
          <div className="bg-slate-900/40 border border-white/5 rounded-[40px] p-10 h-fit sticky top-28 glass shadow-3xl">
            <label className="block text-[10px] mono font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Pipeline Context</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Model the engagement delta between our AI-Campaign (240k) and organic growth (80k) over the last sprint..."
              className="w-full bg-slate-950/60 border border-white/5 rounded-3xl p-6 text-white text-lg font-medium focus:ring-4 focus:ring-blue-500/10 h-64 focus:outline-none mb-8 resize-none transition-all placeholder:text-slate-700"
            ></textarea>
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all disabled:opacity-50 shadow-2xl shadow-blue-600/20 active:scale-95"
            >
              {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-chart-pie-simple"></i>}
              Render Visualization
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-8">
          {!report && !isLoading && (
            <div className="bg-slate-950/20 border-2 border-dashed border-white/5 rounded-[48px] h-[550px] flex flex-col items-center justify-center text-slate-700 glass">
              <i className="fas fa-microchip text-8xl mb-10 opacity-10"></i>
              <p className="text-sm font-bold mono uppercase tracking-[0.4em] opacity-40">Awaiting Signal Input</p>
            </div>
          )}

          {isLoading && (
            <div className="bg-slate-900/40 border border-white/5 rounded-[48px] h-[550px] flex items-center justify-center glass shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 border-[6px] border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-8 shadow-[0_0_30px_rgba(59,130,246,0.3)]"></div>
                <p className="text-blue-500 mono font-black uppercase tracking-[0.4em] animate-pulse">Encoding Vectors...</p>
              </div>
            </div>
          )}

          {report && (
            <>
              <div className="bg-slate-900/40 border border-white/5 rounded-[48px] p-10 md:p-14 shadow-3xl overflow-hidden relative glass">
                <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none">
                  <i className="fas fa-chart-column text-[300px]"></i>
                </div>
                <div className="flex items-center gap-4 mb-14">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg">
                    <i className="fas fa-layer-group text-sm"></i>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Derived Metrics</h2>
                </div>
                <div className="h-[400px] w-full px-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.chartData}>
                      <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#475569" 
                        fontSize={11} 
                        mono 
                        font-weight="bold" 
                        tickLine={false} 
                        axisLine={false} 
                        dy={20} 
                        tick={{fill: '#64748b', fontWeight: '800', letterSpacing: '0.1em'}}
                      />
                      <YAxis 
                        stroke="#475569" 
                        fontSize={11} 
                        mono 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{fill: '#475569'}}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        contentStyle={{ 
                          backgroundColor: 'rgba(2, 6, 23, 0.95)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '20px',
                          backdropFilter: 'blur(20px)',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                          padding: '12px 18px'
                        }}
                        itemStyle={{ color: '#fff', fontWeight: '800', fontSize: '14px' }}
                        labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                        {report.chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            fillOpacity={0.9}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={1}
                            style={{filter: `drop-shadow(0 0 10px ${COLORS[index % COLORS.length]}44)`}}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-950/40 border border-white/5 rounded-[40px] p-10 glass">
                  <h3 className="text-[10px] mono font-bold text-slate-500 uppercase tracking-[0.3em] mb-8">Executive Summary</h3>
                  <p className="text-slate-300 text-lg leading-relaxed font-medium tracking-tight italic opacity-90">{report.summary}</p>
                </div>
                <div className="bg-slate-950/40 border border-white/5 rounded-[40px] p-10 glass">
                  <h3 className="text-[10px] mono font-bold text-slate-500 uppercase tracking-[0.3em] mb-8">Tactical Takeaways</h3>
                  <ul className="space-y-4">
                    {report.keyTakeaways.map((point, i) => (
                      <li key={i} className="flex items-start gap-4 text-base font-bold text-slate-200">
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mt-0.5 border border-blue-500/20 shrink-0">
                          <i className="fas fa-bolt text-[10px]"></i>
                        </div>
                        <span className="opacity-80 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualAnalytics;
