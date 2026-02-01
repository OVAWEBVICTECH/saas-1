
import React, { useState } from 'react';
import { GenerationResult, SocialPost, SocialAccount } from '../types';
import { executeProductionDeployment } from '../services/geminiService';

interface PostScheduleProps {
  campaign: GenerationResult | null;
  connectedAccounts: SocialAccount[];
  onNavigateToChannels: () => void;
  onCampaignUpdate: (campaign: GenerationResult) => void;
}

const PostSchedule: React.FC<PostScheduleProps> = ({ campaign, connectedAccounts, onNavigateToChannels, onCampaignUpdate }) => {
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeProgress, setFinalizeProgress] = useState(0);
  const [currentDeploying, setCurrentDeploying] = useState('');
  
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

  const handleFinalizeCampaign = async () => {
    if (!campaign) return;
    
    // Check for connected channels
    const unconnectedPlatforms = new Set<string>();
    campaign.posts.forEach(p => {
      if (!connectedAccounts.some(acc => acc.platformId === p.platformId)) {
        unconnectedPlatforms.add(p.platformId);
      }
    });

    if (unconnectedPlatforms.size > 0) {
      const confirm = window.confirm(`Some platforms (${Array.from(unconnectedPlatforms).join(', ')}) are not connected. Posts for these channels will be skipped. Continue?`);
      if (!confirm) {
        onNavigateToChannels();
        return;
      }
    }

    setIsFinalizing(true);
    const updatedPosts = [...campaign.posts];
    const totalPosts = updatedPosts.length;
    
    for (let i = 0; i < totalPosts; i++) {
      const post = updatedPosts[i];
      const isConnected = connectedAccounts.some(acc => acc.platformId === post.platformId);
      
      if (!isConnected || post.status === 'posted') {
        setFinalizeProgress(Math.round(((i + 1) / totalPosts) * 100));
        continue;
      }

      setCurrentDeploying(`${post.platformId} - ${post.scheduledDay}`);
      
      try {
        // Mark as posting
        updatedPosts[i] = { ...updatedPosts[i], status: 'posting' };
        onCampaignUpdate({ ...campaign, posts: [...updatedPosts] });

        const liveUrl = await executeProductionDeployment(updatedPosts[i], (stage) => {
          updatedPosts[i] = { ...updatedPosts[i], deploymentStage: stage };
          onCampaignUpdate({ ...campaign, posts: [...updatedPosts] });
        });

        updatedPosts[i] = { ...updatedPosts[i], status: 'posted', liveUrl };
        onCampaignUpdate({ ...campaign, posts: [...updatedPosts] });
      } catch (e) {
        updatedPosts[i] = { ...updatedPosts[i], status: 'failed' };
        onCampaignUpdate({ ...campaign, posts: [...updatedPosts] });
      }

      setFinalizeProgress(Math.round(((i + 1) / totalPosts) * 100));
    }

    setIsFinalizing(false);
    alert('Campaign Finalized: All scheduled production assets have been deployed to the authorized social clusters.');
  };

  return (
    <div className="py-12 md:py-24 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter text-glow leading-none">Campaign <span className="text-blue-500 italic">Timeline</span></h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl">Neural-optimized deployment windows calculated for peak platform engagement.</p>
        </div>
        
        {campaign && (
           <button 
            onClick={handleFinalizeCampaign}
            disabled={isFinalizing}
            className="group relative px-12 py-6 bg-emerald-600 hover:bg-emerald-500 rounded-[28px] text-white font-black text-lg uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50"
           >
              <div className="flex items-center gap-4">
                <i className={`fas ${isFinalizing ? 'fa-atom fa-spin' : 'fa-rocket-launch'}`}></i>
                {isFinalizing ? 'Finalizing Campaign...' : 'Finalize & Launch'}
              </div>
           </button>
        )}
      </div>

      {isFinalizing && (
        <div className="glass p-10 rounded-[40px] border border-white/10 shadow-4xl animate-in slide-in-from-top-6">
           <div className="flex items-center justify-between mb-6">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Global Deployment Progress</h4>
              <p className="text-[10px] mono font-bold text-emerald-500 uppercase tracking-widest">{finalizeProgress}% Synchronized</p>
           </div>
           <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden mb-6 p-1 border border-white/5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full transition-all duration-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                style={{ width: `${finalizeProgress}%` }}
              ></div>
           </div>
           <p className="text-[10px] mono font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">
             Propagating: <span className="text-white">{currentDeploying}</span>
           </p>
        </div>
      )}

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
                    <div key={idx} className={`glass bento-card p-8 group hover:border-blue-500/30 transition-soft shadow-3xl ring-1 ring-white/5 flex flex-col h-full ${post.status === 'posted' ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}>
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center ${PLATFORM_COLORS[post.platformId] || 'text-white'} border border-white/5 shadow-inner`}>
                            <i className={`fab fa-${post.platformId === 'twitter' ? 'x-twitter' : post.platformId} text-xl`}></i>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] mono font-black text-slate-600 uppercase tracking-widest leading-none">{post.platformId}</p>
                            <div className="flex items-center gap-2">
                               <span className={`w-1.5 h-1.5 rounded-full ${post.status === 'posted' ? 'bg-emerald-500' : post.status === 'posting' ? 'bg-blue-500' : 'bg-slate-700'}`}></span>
                               <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                                  {post.status.toUpperCase()}
                               </p>
                            </div>
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
                            <img src={post.visualUrl} className={`w-full h-full object-cover ${post.status === 'posted' ? 'opacity-40 grayscale-[0.5]' : 'opacity-60'}`} alt="Preview" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-10">
                              <i className="fas fa-atom fa-spin text-3xl"></i>
                            </div>
                          )}
                          <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-slate-950/80 to-transparent">
                            <p className="text-[10px] font-black text-white uppercase tracking-tighter line-clamp-1">{post.graphicHeadline}</p>
                          </div>
                          
                          {post.status === 'posted' && (
                             <div className="absolute top-4 right-4 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl">
                               <i className="fas fa-check text-[10px]"></i>
                             </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed font-medium italic line-clamp-3">"{post.content}"</p>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                         <div className="flex flex-wrap gap-2">
                           {post.hashtags.slice(0, 2).map(tag => (
                             <span key={tag} className="text-[9px] mono font-bold text-blue-500 opacity-60">#{tag}</span>
                           ))}
                         </div>
                         {post.liveUrl ? (
                            <a href={post.liveUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-white transition-colors">
                               <i className="fas fa-external-link-alt text-xs"></i>
                            </a>
                         ) : (
                           <button className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-600 hover:text-white transition-soft shadow-xl">
                              <i className="fas fa-ellipsis-v text-xs"></i>
                           </button>
                         )}
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
