
import React, { useState } from 'react';
import { conductMarketResearch } from '../services/geminiService';
import { ResearchSource } from '../types';

const MarketResearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; sources: ResearchSource[] } | null>(null);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const data = await conductMarketResearch(query);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 md:py-24 fade-in-up">
      <div className="mb-16 md:mb-24 text-center md:text-left">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight text-gradient">Deep Intelligence</h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">Harness neural-grounded real-time web intelligence to dissect sectors, competitors, and emerging paradigms.</p>
      </div>

      <form onSubmit={handleResearch} className="relative mb-20 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[36px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Competitive landscape of Web3 infrastructure in APAC"
            className="w-full bg-slate-900/60 border border-white/5 rounded-[32px] py-6 md:py-10 px-10 pr-40 md:pr-48 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-xl md:text-2xl text-white font-bold placeholder-slate-700 transition-all glass backdrop-blur-3xl"
          />
          <button
            disabled={isLoading}
            className="absolute right-4 top-4 bottom-4 bg-blue-600 hover:bg-blue-500 text-white px-8 md:px-12 rounded-[24px] font-black transition-all disabled:opacity-50 flex items-center gap-3 shadow-2xl shadow-blue-600/20 active:scale-95 text-sm md:text-base"
          >
            {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-brain-circuit"></i>}
            Analyze
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-slate-900/40 rounded-[48px] p-10 md:p-16 border border-white/5 shadow-3xl glass text-slate-200 leading-relaxed max-w-none relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <i className="fas fa-quote-right text-[200px]"></i>
            </div>
            <div className="relative z-10 whitespace-pre-wrap text-lg md:text-xl font-medium leading-[1.8] tracking-tight">{result.text}</div>
          </div>

          {result.sources.length > 0 && (
            <div className="bg-slate-950/40 rounded-[40px] p-10 border border-white/5 glass">
              <h3 className="text-[10px] mono font-bold text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
                <span className="w-8 h-[1px] bg-slate-800"></span>
                Primary Intelligence Sources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-6 p-6 bg-slate-900/40 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all group glass active:scale-98"
                  >
                    <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors border border-white/5">
                      <i className="fas fa-globe-americas text-xl"></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-white truncate group-hover:text-blue-400 transition-colors">{source.title}</p>
                      <p className="text-xs font-bold mono text-slate-600 truncate mt-1">{source.uri}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketResearch;
