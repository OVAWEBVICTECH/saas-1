
import React, { useState, useRef, useEffect } from 'react';
import { analyzeAndGeneratePosts, executeProductionDeployment, generateImageForPost } from '../services/geminiService';
import { GenerationResult, SocialPost, SocialPlatform, SocialAccount, DesignConfig } from '../types';

const PLATFORMS: SocialPlatform[] = [
  { id: 'linkedin', name: 'LinkedIn', icon: 'fa-linkedin-in', color: 'bg-[#0077B5]', connected: false },
  { id: 'facebook', name: 'Facebook', icon: 'fa-facebook-f', color: 'bg-[#1877F2]', connected: false },
  { id: 'instagram', name: 'Instagram', icon: 'fa-instagram', color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', connected: false },
  { id: 'threads', name: 'Threads', icon: 'fa-at', color: 'bg-black', connected: false },
  { id: 'twitter', name: 'Twitter / X', icon: 'fa-x-twitter', color: 'bg-black', connected: false },
];

const ALGO_TIMES: Record<string, string> = {
  linkedin: '10:15 AM',
  facebook: '01:30 PM',
  instagram: '06:45 PM',
  threads: '08:00 AM',
  twitter: '12:00 PM'
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface PostCreatorProps {
  connectedAccounts: SocialAccount[];
  onNavigateToAuth: () => void;
  onCampaignReady?: (result: GenerationResult) => void;
  onNavigateToSchedule?: () => void;
}

const PostCreator: React.FC<PostCreatorProps> = ({ connectedAccounts, onNavigateToAuth, onCampaignReady, onNavigateToSchedule }) => {
  const [url, setUrl] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualTagline, setManualTagline] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('linkedin');
  const [logo, setLogo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [isQuotaRetry, setIsQuotaRetry] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('linkedin');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(false);
  const [showAutoPilotConfirm, setShowAutoPilotConfirm] = useState(false);
  
  const [schedulingIdx, setSchedulingIdx] = useState<number | null>(null);
  const [dragItem, setDragItem] = useState<{ type: 'logo' | 'text'; postIdx: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenKeyManager = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setError(null);
      setIsQuotaRetry(false);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setIsQuotaRetry(false);
    setIsGenerating(true);
    setResult(null);
    setGenerationStep(`Synchronizing ${selectedPlatform} Neural Clusters...`);
    
    try {
      const data = await analyzeAndGeneratePosts(
        url, 
        selectedPlatform,
        manualName ? { companyName: manualName, tagline: manualTagline } : undefined, 
        (status) => setGenerationStep(status),
        autoPilotEnabled
      );
      setResult(data);
      setActiveTab(selectedPlatform);
      if (onCampaignReady) onCampaignReady(data);

      if (data.logoUrl && !logo) setLogo(data.logoUrl);
      if (data.companyName && !manualName) setManualName(data.companyName);
      if (data.tagline && !manualTagline) setManualTagline(data.tagline);

      // Single-channel Visual Synthesis
      setGenerationStep(`Synthesizing Visual Assets for ${selectedPlatform}...`);
      for (let i = 0; i < data.posts.length; i++) {
        const p = data.posts[i];
        setGenerationStep(`Rendering visual asset: ${p.scheduledDay || (i + 1)}...`);
        await generateGraphic(p.platformId, p.visualPrompt, i, data);
      }
    } catch (err: any) {
      if (err.message === "QUOTA_EXHAUSTED" || err.code === 429) {
        setIsQuotaRetry(true);
        setGenerationStep("Neural Engine Overloaded. Attempting autonomous recovery...");
        setTimeout(() => handleGenerate(), 3000);
      } else {
        setError(`Synthesis Error: ${err.message || "Connection timeout."}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedulePost = (postIdx: number, day: string) => {
    if (!result) return;
    const platformId = result.posts[postIdx].platformId;
    const autoTime = ALGO_TIMES[platformId] || '09:00 AM';

    setResult(prev => {
      if (!prev) return null;
      const updatedPosts = [...prev.posts];
      updatedPosts[postIdx] = { ...updatedPosts[postIdx], scheduledDay: day, scheduledTime: autoTime, status: 'scheduled' };
      const nextResult = { ...prev, posts: updatedPosts };
      if (onCampaignReady) onCampaignReady(nextResult);
      return nextResult;
    });
    setSchedulingIdx(null);
  };

  const deployToProduction = async (postIdx: number) => {
    if (!result) return;
    const post = result.posts[postIdx];
    const isConnected = connectedAccounts.some(acc => acc.platformId === post.platformId);
    if (!isConnected) { alert(`Establish handshake for ${post.platformId} in Channels.`); onNavigateToAuth(); return; }
    
    setResult(prev => {
      if (!prev) return null;
      const updated = [...prev.posts];
      updated[postIdx] = { ...updated[postIdx], status: 'posting' };
      return { ...prev, posts: updated };
    });

    try {
      const liveUrl = await executeProductionDeployment(post, (stage) => {
        setResult(prev => {
          if (!prev) return null;
          const updated = [...prev.posts];
          updated[postIdx].deploymentStage = stage;
          return { ...prev, posts: updated };
        });
      });
      setResult(prev => {
        if (!prev) return null;
        const updated = [...prev.posts];
        updated[postIdx] = { ...updated[postIdx], status: 'posted', liveUrl };
        return { ...prev, posts: updated };
      });
    } catch (err) {
      setResult(prev => {
        if (!prev) return null;
        const updated = [...prev.posts];
        updated[postIdx].status = 'failed';
        return { ...prev, posts: updated };
      });
    }
  };

  const handleDownload = async (postIdx: number) => {
    const post = result?.posts[postIdx];
    if (!post || !post.visualUrl) return;
    setIsDownloading(`${post.platformId}-${postIdx}`);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = post.visualUrl;
      await new Promise((resolve) => bgImg.onload = resolve);
      const EXPORT_SIZE = 1080;
      canvas.width = EXPORT_SIZE;
      canvas.height = EXPORT_SIZE;
      const previewWidth = containerRef.current?.offsetWidth || 512;
      const scaleFactor = EXPORT_SIZE / previewWidth;
      ctx.drawImage(bgImg, 0, 0, EXPORT_SIZE, EXPORT_SIZE);
      if (logo) {
        const logoImg = new Image();
        logoImg.src = logo;
        await new Promise((resolve) => logoImg.onload = resolve);
        const baseSize = post.designConfig.logoSize * scaleFactor;
        const imgRatio = logoImg.width / logoImg.height;
        let drawW = imgRatio >= 1 ? baseSize : baseSize * imgRatio;
        let drawH = imgRatio >= 1 ? baseSize / imgRatio : baseSize;
        ctx.drawImage(logoImg, (post.designConfig.logoX / 100) * EXPORT_SIZE - drawW / 2, (post.designConfig.logoY / 100) * EXPORT_SIZE - drawH / 2, drawW, drawH);
      }
      ctx.font = `800 ${post.designConfig.textSize * scaleFactor}px "Plus Jakarta Sans"`;
      ctx.fillStyle = 'white';
      ctx.textAlign = post.designConfig.textAlign as CanvasTextAlign;
      ctx.fillText(post.graphicHeadline, (post.designConfig.textX / 100) * EXPORT_SIZE, (post.designConfig.textY / 100) * EXPORT_SIZE);
      const link = document.createElement('a');
      link.download = `webvic-${post.platformId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } finally {
      setIsDownloading(null);
    }
  };

  const generateGraphic = async (platformId: string, visualPrompt: string | undefined, postIdx: number, currentResult?: GenerationResult) => {
    const activeResult = currentResult || result;
    if (!activeResult) return;
    setIsGeneratingImage(`${platformId}-${postIdx}`);
    try {
      const imageUrl = await generateImageForPost(visualPrompt || activeResult.posts[postIdx].content);
      setResult(prev => {
        const target = prev || activeResult;
        const updatedPosts = [...target!.posts];
        updatedPosts[postIdx].visualUrl = imageUrl;
        const nextResult = { ...target!, posts: updatedPosts };
        if (onCampaignReady) onCampaignReady(nextResult);
        return nextResult;
      });
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const updateDesignConfig = (postIdx: number, updates: Partial<DesignConfig>) => {
    setResult(prev => {
      if (!prev) return null;
      const updatedPosts = [...prev.posts];
      updatedPosts[postIdx].designConfig = { ...updatedPosts[postIdx].designConfig, ...updates };
      return { ...prev, posts: updatedPosts };
    });
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'logo' | 'text', postIdx: number) => {
    e.stopPropagation();
    setDragItem({ type, postIdx });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragItem || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      if (dragItem.type === 'logo') updateDesignConfig(dragItem.postIdx, { logoX: x, logoY: y, logoPosition: 'custom' });
      else updateDesignConfig(dragItem.postIdx, { textX: x, textY: y, textPosition: 'custom' });
    };
    const handleMouseUp = () => setDragItem(null);
    if (dragItem) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragItem]);

  return (
    <div className="py-12 md:py-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex flex-col xl:flex-row items-center justify-between gap-12 mb-20 md:mb-32">
        <div className="max-w-xl space-y-4 text-center xl:text-left">
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] text-glow">
            Design <span className="text-blue-500 italic">Studio</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-lg">Advanced brand synthesis with seamless single-channel propagation.</p>
        </div>

        <div className="w-full xl:flex-1 glass bento-card p-4 md:p-6 shadow-5xl ring-1 ring-white/10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="space-y-2">
              <label className="text-[10px] mono font-bold text-slate-500 uppercase tracking-[0.4em] ml-2">Identity</label>
              <input 
                type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} 
                placeholder="Company Name"
                className="w-full bg-slate-950/60 border border-white/5 rounded-[22px] px-8 py-5 text-xl text-white font-black input-glow outline-none transition-soft placeholder:text-slate-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] mono font-bold text-slate-500 uppercase tracking-[0.4em] ml-2">Marketing Hook</label>
              <input 
                type="text" value={manualTagline} onChange={(e) => setManualTagline(e.target.value)} 
                placeholder="Core Tagline"
                className="w-full bg-slate-950/60 border border-white/5 rounded-[22px] px-8 py-5 text-xl text-white font-black input-glow outline-none transition-soft placeholder:text-slate-800"
              />
            </div>
          </div>
          <div className="flex items-center gap-6 pl-4 md:border-l border-white/10 h-full py-2">
            <div className="space-y-2">
               <label className="text-[10px] mono font-bold text-slate-500 uppercase tracking-[0.4em] ml-2">Logo</label>
               <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 bg-slate-950 rounded-[28px] border border-white/5 flex items-center justify-center cursor-pointer hover:border-blue-500/40 transition-soft overflow-hidden group shadow-3xl ring-2 ring-white/5"
              >
                {logo ? <img src={logo} className="w-full h-full object-contain p-4" /> : <i className="fas fa-plus text-slate-800 text-2xl"></i>}
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if(f) { const r = new FileReader(); r.onload = () => setLogo(r.result as string); r.readAsDataURL(f); }
            }} />
          </div>
        </div>
      </div>

      <div className="mb-24 md:mb-40 space-y-8">
        <form onSubmit={handleGenerate} className="glass p-3 md:p-4 rounded-[48px] flex flex-col md:flex-row items-center gap-4 shadow-5xl max-w-7xl mx-auto ring-1 ring-white/10 group focus-within:ring-blue-500/20">
          
          {/* Transmission Channel Selector */}
          <div className="w-full md:w-56 px-6 border-r border-white/5">
            <label className="text-[8px] mono font-black text-slate-600 uppercase tracking-widest block mb-1 ml-2">Channel</label>
            <select 
              value={selectedPlatform} 
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full bg-transparent border-none text-white font-black uppercase text-xs tracking-widest focus:ring-0 cursor-pointer"
            >
              {PLATFORMS.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full relative">
            <i className="fas fa-link absolute left-10 top-1/2 -translate-y-1/2 text-slate-800 text-2xl group-focus-within:text-blue-500 transition-colors"></i>
            <input 
              type="text" value={url} onChange={(e) => setUrl(e.target.value)} disabled={isGenerating}
              placeholder="brand-domain.com"
              className="w-full bg-transparent border-none focus:ring-0 text-white py-8 pl-24 pr-8 text-2xl md:text-4xl font-black tracking-tighter placeholder:text-slate-900"
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button 
                type="button"
                onClick={() => setAutoPilotEnabled(!autoPilotEnabled)}
                className={`flex items-center gap-3 px-6 h-24 md:h-28 rounded-[36px] transition-all duration-500 border-2 ${autoPilotEnabled ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)]' : 'bg-slate-950/40 border-white/5 text-slate-600'}`}
             >
                <i className={`fas ${autoPilotEnabled ? 'fa-robot' : 'fa-user-gear'} text-xl`}></i>
                <div className="text-left">
                  <p className="text-[10px] mono font-black uppercase tracking-widest leading-none mb-1">Auto Pilot</p>
                  <p className="text-[11px] font-black uppercase tracking-tighter opacity-70">{autoPilotEnabled ? 'ENGAGED' : 'MANUAL'}</p>
                </div>
             </button>

             <button type="submit" disabled={isGenerating || !url} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 px-16 h-24 md:h-28 rounded-[36px] font-black text-white transition-soft flex items-center justify-center gap-6 shadow-3xl text-xl md:text-2xl">
              {isGenerating ? <i className="fas fa-atom fa-spin"></i> : <i className="fas fa-wand-sparkles"></i>}
              SYNTHESIZE
            </button>
          </div>
        </form>
        
        {/* Auto Pilot Notification restored and refined */}
        {autoPilotEnabled && (
           <p className="text-center text-[10px] mono font-bold text-indigo-500 uppercase tracking-[0.5em] animate-pulse">
             Neural Engine primed: System will generate a full 7-day daily cycle for {selectedPlatform}.
           </p>
        )}
      </div>

      {(isQuotaRetry || isGenerating) && (
        <div className="flex flex-col items-center justify-center py-40 space-y-10">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
            {isQuotaRetry && <div className="absolute inset-0 flex items-center justify-center text-blue-500 animate-pulse"><i className="fas fa-shield-halved text-2xl"></i></div>}
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-white uppercase tracking-[0.4em]">{generationStep}</h3>
            {isQuotaRetry && <p className="text-xs mono font-black text-blue-500 uppercase tracking-widest">Optimizing Throttling Cycles...</p>}
          </div>
        </div>
      )}

      {error && !isQuotaRetry && (
        <div className="mb-20 glass bento-card border-2 border-rose-500/30 p-12 text-center space-y-6">
           <i className="fas fa-triangle-exclamation text-4xl text-rose-500"></i>
           <h4 className="text-2xl font-black text-white uppercase">Neural Drift Detected</h4>
           <p className="text-slate-400 font-medium">{error}</p>
           <button onClick={() => setError(null)} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest border border-white/5">Acknowledge</button>
        </div>
      )}

      {result && (
        <div className="space-y-16 md:space-y-32">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 md:gap-24">
            {result.posts.map((post, postIdx) => (
              <div key={postIdx} className="glass bento-card p-10 md:p-16 lg:p-20 space-y-12 group hover:border-blue-500/20 transition-all duration-700 flex flex-col shadow-6xl ring-1 ring-white/5 relative">
                
                {schedulingIdx === postIdx && (
                  <div className="absolute inset-0 z-50 glass backdrop-blur-3xl rounded-[36px] p-10 flex flex-col items-center justify-center">
                    <button onClick={() => setSchedulingIdx(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
                    <h3 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase italic">Target Day</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-md">
                      {DAYS.map(day => (
                        <button key={day} onClick={() => handleSchedulePost(postIdx, day)} className="py-4 bg-slate-950/60 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">{day.substring(0, 3)}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-950 rounded-[22px] flex items-center justify-center text-blue-500 font-black border border-white/5 italic text-2xl">0{postIdx + 1}</div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                        {post.scheduledDay ? `${post.scheduledDay} @ ${post.scheduledTime}` : 'Production Asset'}
                      </h4>
                      <p className="text-[9px] mono font-bold text-slate-600 uppercase">{post.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {!autoPilotEnabled && (
                      <button onClick={() => setSchedulingIdx(postIdx)} className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center"><i className="fas fa-calendar-plus"></i></button>
                    )}
                    <button onClick={() => deployToProduction(postIdx)} className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center"><i className={`fas ${post.status === 'posting' ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i></button>
                    <button onClick={() => handleDownload(postIdx)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-slate-500 flex items-center justify-center"><i className="fas fa-download"></i></button>
                  </div>
                </div>

                <div ref={containerRef} className="relative aspect-square rounded-[60px] overflow-hidden bg-slate-950 border border-white/5 shadow-inner select-none group/preview">
                  {post.visualUrl ? (
                    <div className="w-full h-full relative">
                      <img src={post.visualUrl} className="w-full h-full object-cover" />
                      {logo && (
                        <div 
                          onMouseDown={(e) => handleMouseDown(e, 'logo', postIdx)}
                          className="absolute cursor-move z-20"
                          style={{ left: `${post.designConfig.logoX}%`, top: `${post.designConfig.logoY}%`, width: `${post.designConfig.logoSize}px`, transform: 'translate(-50%, -50%)' }}
                        >
                          <img src={logo} className="w-full h-auto drop-shadow-3xl" />
                        </div>
                      )}
                      <div 
                        onMouseDown={(e) => handleMouseDown(e, 'text', postIdx)}
                        className="absolute px-10 cursor-move w-full z-10"
                        style={{ left: `${post.designConfig.textX}%`, top: `${post.designConfig.textY}%`, textAlign: post.designConfig.textAlign as any, fontSize: `${post.designConfig.textSize}px`, fontWeight: 800, color: 'white', textShadow: '0 5px 20px rgba(0,0,0,0.8)', transform: 'translate(-50%, -50%)' }}
                      >
                        {post.graphicHeadline}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <i className="fas fa-atom fa-spin text-blue-500 text-3xl"></i>
                        <p className="text-[10px] mono font-black uppercase text-slate-600 tracking-widest">Synthesizing Visual...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <textarea 
                    value={post.content} 
                    onChange={(e) => { const updated = [...result.posts]; updated[postIdx].content = e.target.value; setResult({...result, posts: updated}); }}
                    className="w-full bg-slate-950/60 p-8 rounded-[32px] text-lg font-medium text-slate-300 border border-white/5 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none h-48"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="py-20 flex flex-col items-center gap-6">
            <button 
              onClick={onNavigateToSchedule}
              className="px-20 py-8 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-[40px] text-white font-black text-2xl uppercase tracking-widest shadow-5xl hover:scale-105 transition-all active:scale-95"
            >
              Propagate to Planner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCreator;
