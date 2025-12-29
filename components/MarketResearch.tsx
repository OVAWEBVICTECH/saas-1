
import React, { useState } from 'react';
import { conductMarketResearch } from '../services/geminiService';
import { ResearchSource } from '../types';

const MarketResearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; sources: ResearchSource[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await conductMarketResearch(query);
      setResult(data);
    } catch (err: any) {
      setError("Deep Intelligence sync failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 md:py-24 fade-in-up">
      <div className="mb-16 md:mb-24 text-center md:text-left">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight text-gradient">Deep Intelligence</h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">Harness neural-grounded intelligence to dissect sectors and competitors.</p>
      </div>

      <form onSubmit={handleResearch} className="relative mb-20 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[36px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search market or brand details..."
            className="w-full bg-slate-900/60 border border-white/5 rounded-[32px] py-6 md:py-10 px-10 pr-40 md:pr-48 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-xl md:text-2xl text-white font-bold placeholder-slate-700 transition-all glass backdrop-blur-3xl"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-4 top-4 bottom-4 bg-blue-600 hover:bg-blue-500 text-white px-8 md:px-12 rounded-[24px] font-black transition-all disabled:opacity-50 flex items-center gap-3 shadow-2xl shadow-blue-600/20 active:scale-95 text-sm md:text-base"
          >
            {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-brain-circuit"></i>}
            Analyze
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-12 p-8 bg-rose-500/10 border border-rose-500/30 rounded-[32px] flex items-center gap-6 animate-in slide-in-from-top-4">
           <i className="fas fa-exclamation-triangle text-rose-500 text-2xl"></i>
           <p className="text-rose-500 font-bold flex-1">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="py-20 text-center animate-pulse">
          <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-blue-500 font-bold tracking-widest uppercase text-xs">Processing...</p>
        </div>
      )}

      {result && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
          <div className="bg-slate-900/40 rounded-[48px] p-10 md:p-16 border border-white/5 shadow-3xl glass text-slate-200 leading-relaxed max-w-none relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></span>
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em]">Analysis Result</h3>
            </div>
            <div className="relative z-10 whitespace-pre-wrap text-lg md:text-xl font-medium leading-[1.8] tracking-tight text-slate-100 mb-12">
              {result.text}
            </div>

            {result.sources.length > 0 && (
              <div className="relative z-10 pt-10 border-t border-white/10">
                <h4 className="text-[10px] mono font-bold text-slate-500 uppercase tracking-[0.4em] mb-6">Neural Grounding Sources</h4>
                <div className="flex flex-wrap gap-4">
                  {result.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-slate-950/60 rounded-xl border border-white/5 text-[10px] font-bold text-blue-400 hover:text-white hover:border-blue-500/50 transition-all flex items-center gap-3"
                    >
                      <i className="fas fa-link text-[8px]"></i>
                      {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketResearch;
