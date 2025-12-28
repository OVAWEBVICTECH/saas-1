
import React, { useState } from 'react';
import { generateMarketingContent } from '../services/geminiService';
import { ContentIdea } from '../types';

const ContentLab: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    try {
      const data = await generateMarketingContent(topic);
      setIdeas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 md:py-24 fade-in-up">
      <div className="mb-16 md:mb-24 text-center">
        <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter text-gradient leading-none">Ideation Laboratory</h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">Scale marketing velocity with high-fidelity campaign architectures and cross-platform hooks generated in milliseconds.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-20 max-w-4xl mx-auto bg-slate-900/60 p-3 rounded-[32px] border border-white/5 glass shadow-2xl">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What are we scaling? (e.g. Next-gen SaaS Analytics)"
          className="flex-1 bg-transparent border-none rounded-2xl px-8 focus:ring-0 outline-none text-white text-xl md:text-2xl font-bold placeholder:text-slate-700 py-6"
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-10 md:px-14 rounded-[24px] font-black transition-all shadow-2xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-4 text-base md:text-xl active:scale-95 py-4 sm:py-0"
        >
          {isLoading ? <i className="fas fa-atom fa-spin"></i> : <i className="fas fa-sparkles"></i>}
          Ideate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 bg-slate-950/20 border border-white/5 rounded-[48px] animate-pulse glass"></div>
        ))}

        {!isLoading && ideas.length > 0 && ideas.map((idea, i) => (
          <div key={i} className="bg-slate-900/40 border border-white/5 rounded-[48px] p-10 md:p-12 hover:border-blue-500/30 transition-all hover:scale-[1.03] group glass shadow-2xl relative overflow-hidden active:scale-100 cursor-default">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
              <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tight leading-tight max-w-[85%]">{idea.title}</h3>
              <button className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-90">
                <i className="far fa-copy text-sm"></i>
              </button>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 min-h-[120px] font-medium opacity-90 relative z-10">{idea.description}</p>
            <div className="flex flex-wrap gap-3 relative z-10">
              {idea.tags.map((tag, idx) => (
                <span key={idx} className="px-4 py-1.5 bg-slate-950/60 text-slate-500 text-[10px] mono font-black uppercase tracking-widest rounded-full border border-white/5 group-hover:border-blue-500/20 group-hover:text-blue-500 transition-all">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!isLoading && ideas.length === 0 && (
        <div className="text-center py-24 opacity-30 flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center mb-8 border border-white/5 glass shadow-3xl">
            <i className="fas fa-lightbulb-on text-4xl text-blue-500 opacity-60"></i>
          </div>
          <p className="text-xl font-bold mono uppercase tracking-[0.4em] text-slate-600">Awaiting Signal</p>
        </div>
      )}
    </div>
  );
};

export default ContentLab;
