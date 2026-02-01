
import React from 'react';
import { GenerationResult, SocialPost } from '../types';

interface PostScheduleProps {
  campaign: GenerationResult | null;
}

const PostSchedule: React.FC<PostScheduleProps> = ({ campaign }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getPostsForDay = (day: string) => {
    return campaign?.posts.filter(p => p.scheduledDay === day) || [];
  };

  const PLATFORM_COLORS: Record<string, string> = {
    linkedin: 'text-[#0077B5]',
    facebook: 'text-[#1877F2]',
    instagram: 'text-[#E4405F]',
    threads: 'text-white',
    twitter: 'text-white',
  };

  return (
    <div className="py-12 md:py-24 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter text-glow leading-none">Campaign <span className="text-blue-500 italic">Timeline</span></h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl">Neural-optimized deployment windows calculated for peak platform engagement.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-3xl border border-white/5 glass">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
            <i className="fas fa-robot"></i>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] mono font-black text-slate-600 uppercase tracking-widest leading-none">Algorithm Sync</p>
            <p className="text-[11px] font-black text-white uppercase tracking-tighter">Active v2.4 Engine</p>
          </div>
        </div>
      </div>

      {!campaign ? (
        <div className="py-40 text-center glass rounded-[48px] border-2 border-dashed border-white/5">
          <div className="w-24 h-24 bg-slate-950 rounded-[36px] flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner">
            <i className="fas fa-calendar-circle-plus text-4xl text-slate-800"></i>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">No Active Campaign</h2>
          <p className="text-slate-500 font-medium">Synthesize a new campaign in the Studio to generate an optimized planner.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {days.map((day) => {
            const dayPosts = getPostsForDay(day);
            if (dayPosts.length === 0) return null;

            return (
              <div key={day} className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex items-center gap-6">
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">{day}</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                  <span className="text-[10px] mono font-bold text-slate-600 uppercase tracking-[0.4em]">{dayPosts.length} Slots</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {dayPosts.map((post, idx) => (
                    <div key={idx} className="glass bento-card p-8 group hover:border-blue-500/30 transition-soft shadow-3xl ring-1 ring-white/5 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center ${PLATFORM_COLORS[post.platformId] || 'text-white'} border border-white/5 shadow-inner`}>
                            <i className={`fab fa-${post.platformId === 'twitter' ? 'x-twitter' : post.platformId} text-xl`}></i>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] mono font-black text-slate-600 uppercase tracking-widest leading-none">{post.platformId}</p>
                            <p className="text-[11px] font-black text-white uppercase tracking-tighter">Scheduled</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-blue-500 tracking-tight leading-none">{post.scheduledTime}</p>
                          <p className="text-[8px] mono font-bold text-slate-700 uppercase tracking-[0.2em] mt-1">Peak window</p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-6">
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-white/5 shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
                          {post.visualUrl ? (
                            <img src={post.visualUrl} className="w-full h-full object-cover opacity-60" alt="Preview" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-10">
                              <i className="fas fa-atom fa-spin text-3xl"></i>
                            </div>
                          )}
                          <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-slate-950/80 to-transparent">
                            <p className="text-[10px] font-black text-white uppercase tracking-tighter line-clamp-1">{post.graphicHeadline}</p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed font-medium italic line-clamp-3">"{post.content}"</p>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                         <div className="flex flex-wrap gap-2">
                           {post.hashtags.slice(0, 2).map(tag => (
                             <span key={tag} className="text-[9px] mono font-bold text-blue-500 opacity-60">#{tag}</span>
                           ))}
                         </div>
                         <button className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-600 hover:text-white transition-soft shadow-xl">
                            <i className="fas fa-ellipsis-v text-xs"></i>
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PostSchedule;
