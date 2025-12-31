
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

interface PostCreatorProps {
  connectedAccounts: SocialAccount[];
  onNavigateToAuth: () => void;
}

const PostCreator: React.FC<PostCreatorProps> = ({ connectedAccounts, onNavigateToAuth }) => {
  const [url, setUrl] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualTagline, setManualTagline] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('linkedin');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(false);
  const [showAutoPilotConfirm, setShowAutoPilotConfirm] = useState(false);
  
  const [dragItem, setDragItem] = useState<{ type: 'logo' | 'text'; postIdx: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenKeyManager = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setError(null);
      setIsQuotaError(false);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setIsQuotaError(false);
    setIsGenerating(true);
    setResult(null);
    setGenerationStep("Analyzing Brand Assets...");
    try {
      const data = await analyzeAndGeneratePosts(
        url, 
        manualName ? { companyName: manualName, tagline: manualTagline } : undefined, 
        (status) => setGenerationStep(status),
        autoPilotEnabled
      );
      setResult(data);
      if (data.logoUrl && !logo) setLogo(data.logoUrl);
      if (data.companyName && !manualName) setManualName(data.companyName);
      if (data.tagline && !manualTagline) setManualTagline(data.tagline);

      // In Auto Pilot mode, we automatically synthesize visuals for ALL generated posts
      if (autoPilotEnabled) {
        setGenerationStep("Autopilot: Generating visual base for weekly campaign...");
        const synthesisPromises = data.posts.map((p, idx) => 
          generateGraphic(p.platformId, p.visualPrompt, idx, data)
        );
        await Promise.all(synthesisPromises);

        // After visuals are ready, simulate auto-posting for all connected channels
        setGenerationStep("Autopilot: Deploying scheduled campaign to linked channels...");
        for (let i = 0; i < data.posts.length; i++) {
          const post = data.posts[i];
          const isConnected = connectedAccounts.some(acc => acc.platformId === post.platformId);
          if (isConnected) {
            await deployToProduction(i, data);
          }
        }
      } else {
        const firstActivePost = data.posts.find(p => p.platformId === activeTab);
        if (firstActivePost) {
          const idx = data.posts.indexOf(firstActivePost);
          generateGraphic(firstActivePost.platformId, firstActivePost.visualPrompt, idx, data);
        }
      }
    } catch (err: any) {
      if (err.message === "QUOTA_EXHAUSTED" || err.code === 429) {
        setError("System Quota Exhausted: The engine is at capacity. Please provide a personal paid API key to continue.");
        setIsQuotaError(true);
      } else {
        setError(`Synthesis Error: ${err.message || "Engine timeout."}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const deployToProduction = async (postIdx: number, currentResult?: GenerationResult) => {
    const activeResult = currentResult || result;
    if (!activeResult) return;
    const post = activeResult.posts[postIdx];

    // Check if channel is connected for manual deployment
    const isConnected = connectedAccounts.some(acc => acc.platformId === post.platformId);
    if (!isConnected) {
      alert(`Channel for ${post.platformId} not linked. Please connect it in the Channels tab.`);
      onNavigateToAuth();
      return;
    }
    
    // Mark as posting
    setResult(prev => {
      const target = prev || activeResult;
      const updated = [...target.posts];
      updated[postIdx] = { ...updated[postIdx], status: 'posting' };
      return { ...target, posts: updated };
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
    } catch (err: any) {
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
        const lX = (post.designConfig.logoX / 100) * EXPORT_SIZE;
        const lY = (post.designConfig.logoY / 100) * EXPORT_SIZE;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 30;
        ctx.drawImage(logoImg, lX - drawW / 2, lY - drawH / 2, drawW, drawH);
        ctx.restore();
      }

      ctx.save();
      const tSize = post.designConfig.textSize * scaleFactor;
      ctx.font = `800 ${tSize}px "Plus Jakarta Sans"`;
      ctx.fillStyle = 'white';
      ctx.textAlign = post.designConfig.textAlign as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 20;
      const tX = (post.designConfig.textX / 100) * EXPORT_SIZE;
      const tY = (post.designConfig.textY / 100) * EXPORT_SIZE;
      
      const words = post.graphicHeadline.split(' ');
      let line = '';
      const lines = [];
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > EXPORT_SIZE * 0.9) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      const lineHeight = tSize * 1.1;
      let startY = tY - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach(l => {
        ctx.fillText(l.trim(), tX, startY);
        startY += lineHeight;
      });
      ctx.restore();

      const link = document.createElement('a');
      link.download = `webvic-flow-${post.platformId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(null);
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

  const generateGraphic = async (platformId: string, visualPrompt: string | undefined, postIdx: number, currentResult?: GenerationResult) => {
    const activeResult = currentResult || result;
    if (!activeResult) return;
    const uniqueId = `${platformId}-${postIdx}`;
    setIsGeneratingImage(uniqueId);
    try {
      const imageUrl = await generateImageForPost(visualPrompt || activeResult.posts[postIdx].content);
      setResult(prev => {
        const target = prev || activeResult;
        const updatedPosts = [...target!.posts];
        updatedPosts[postIdx].visualUrl = imageUrl;
        return { ...target!, posts: updatedPosts };
      });
    } catch (err: any) {
       if (err.message === "QUOTA_EXHAUSTED" || err.code === 429) {
        setError("Image Synthesis Failed: Quota reached. Upgrade to a personal key for unlimited design generation.");
        setIsQuotaError(true);
      }
      console.error(err);
    } finally {
      setIsGeneratingImage(null);
    }
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

  const toggleAutoPilot = () => {
    if (!autoPilotEnabled) {
      setShowAutoPilotConfirm(true);
    } else {
      setAutoPilotEnabled(false);
    }
  };

  return (
    <div className="py-12 md:py-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Dynamic Header & Identity Engine */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-12 mb-20 md:mb-32">
        <div className="max-w-xl space-y-4 text-center xl:text-left">
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] text-fluid-h1 text-glow">
            Design <span className="text-blue-500 italic">Studio</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-lg">Professional layout engine for multi-channel brand synthesis.</p>
        </div>

        {/* Brand Infrastructure Control Bar */}
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
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 bg-slate-950 rounded-[28px] border border-white/5 flex items-center justify-center cursor-pointer hover:border-blue-500/40 transition-soft overflow-hidden group shadow-3xl ring-2 ring-white/5"
            >
              {logo ? <img src={logo} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform" /> : <i className="fas fa-plus text-slate-800 text-2xl"></i>}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if(f) { const r = new FileReader(); r.onload = () => setLogo(r.result as string); r.readAsDataURL(f); }
            }} />
            <div className="space-y-1">
              <p className="text-[9px] mono font-black text-slate-600 uppercase tracking-widest">Global Asset</p>
              <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] hover:text-white transition-soft">Replace Logo</button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Sequence */}
      <div className="mb-24 md:mb-40 space-y-8">
        <form onSubmit={handleGenerate} className="glass p-3 md:p-4 rounded-[48px] flex flex-col md:flex-row items-center gap-4 shadow-5xl max-w-7xl mx-auto ring-1 ring-white/10 group focus-within:ring-blue-500/20">
          <div className="flex-1 w-full relative">
            <i className="fas fa-link absolute left-10 top-1/2 -translate-y-1/2 text-slate-800 text-2xl group-focus-within:text-blue-500 transition-colors"></i>
            <input 
              type="text" value={url} onChange={(e) => setUrl(e.target.value)} disabled={isGenerating}
              placeholder="brand-domain.com"
              className="w-full bg-transparent border-none focus:ring-0 text-white py-8 pl-24 pr-8 text-2xl md:text-4xl font-black tracking-tighter placeholder:text-slate-900"
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             {/* Auto Pilot Toggle */}
             <button 
                type="button"
                onClick={toggleAutoPilot}
                className={`flex items-center gap-3 px-6 h-24 md:h-28 rounded-[36px] transition-all duration-500 border-2 ${autoPilotEnabled ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)]' : 'bg-slate-950/40 border-white/5 text-slate-600'}`}
             >
                <i className={`fas ${autoPilotEnabled ? 'fa-robot' : 'fa-user-gear'} text-xl`}></i>
                <div className="text-left">
                  <p className="text-[10px] mono font-black uppercase tracking-widest leading-none mb-1">Auto Pilot</p>
                  <p className="text-[11px] font-black uppercase tracking-tighter opacity-70">{autoPilotEnabled ? 'ENGAGED' : 'MANUAL'}</p>
                </div>
             </button>

             <button type="submit" disabled={isGenerating || !url} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 px-16 h-24 md:h-28 rounded-[36px] font-black text-white transition-soft flex items-center justify-center gap-6 shadow-3xl shadow-blue-600/30 active:scale-95 text-xl md:text-2xl">
              {isGenerating ? <i className="fas fa-atom fa-spin"></i> : <i className="fas fa-wand-sparkles"></i>}
              {autoPilotEnabled ? 'SYNTHESIZE' : 'SYNTHESIZE'}
            </button>
          </div>
        </form>
        
        {autoPilotEnabled && (
           <p className="text-center text-[10px] mono font-bold text-indigo-500 uppercase tracking-[0.5em] animate-pulse">
             System will generate 6 posts (Mon-Sat) & auto-deploy to linked channels.
           </p>
        )}
      </div>

      {/* Quota Exhausted Alert */}
      {isQuotaError && (
        <div className="mb-20 animate-in slide-in-from-top-4 duration-500">
          <div className="glass-dark border-2 border-rose-500/30 rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-4xl ring-1 ring-rose-500/10">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 text-3xl">
              <i className="fas fa-gauge-circle-bolt"></i>
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h4 className="text-2xl font-black text-white uppercase tracking-tight">Enterprise Quota Exhausted</h4>
              <p className="text-slate-400 font-medium">The global shared engine is at its rate limit. For uninterrupted synthesis, please switch to a personal API key from a paid project.</p>
            </div>
            <button 
              onClick={handleOpenKeyManager}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-[0.2em] shadow-3xl transition-all active:scale-95 whitespace-nowrap"
            >
              UPGRADE ENGINE
            </button>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-40 space-y-10 animate-in zoom-in-95 duration-1000">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin shadow-[0_0_60px_#3b82f644]"></div>
            <i className={`fas ${autoPilotEnabled ? 'fa-robot' : 'fa-brain-circuit'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 text-xl animate-pulse`}></i>
          </div>
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-black text-white uppercase tracking-[0.4em]">{generationStep}</h3>
            <p className="text-slate-600 mono text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Establishing Secure Handshake...</p>
          </div>
        </div>
      )}

      {error && !isQuotaError && (
        <div className="mb-20 p-8 glass border-2 border-rose-500/20 rounded-[36px] text-center">
           <p className="text-rose-500 font-bold uppercase tracking-widest mb-4">Pipeline Interruption</p>
           <p className="text-slate-300 font-medium">{error}</p>
        </div>
      )}

      {/* Editor Hub */}
      {result && (
        <div className="space-y-16 md:space-y-32">
          {/* Channel Selectors */}
          <div className="flex items-center justify-center sticky top-[100px] z-[60] pointer-events-none">
            <div className="glass p-2.5 rounded-full flex flex-wrap justify-center gap-2 shadow-5xl pointer-events-auto ring-1 ring-white/10 backdrop-blur-3xl">
              {PLATFORMS.map(p => {
                const count = result.posts.filter(pr => pr.platformId === p.id).length;
                return (
                  <button 
                    key={p.id} onClick={() => setActiveTab(p.id)}
                    className={`px-8 md:px-10 py-4 md:py-5 rounded-full flex items-center gap-4 transition-all duration-500 font-black text-[11px] uppercase tracking-widest ${activeTab === p.id ? `${p.color} text-white shadow-2xl scale-105` : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                  >
                    <i className={`fab ${p.icon} text-base`}></i> 
                    {p.name}
                    {count > 0 && <span className="ml-1 opacity-50">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 md:gap-24">
            {result.posts.map((post, postIdx) => (
              post.platformId === activeTab && (
                <div key={`${post.platformId}-${postIdx}`} className="glass bento-card p-10 md:p-16 lg:p-20 space-y-12 md:space-y-20 group hover:border-blue-500/20 transition-all duration-700 flex flex-col shadow-6xl ring-1 ring-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-950 rounded-[22px] flex items-center justify-center text-blue-500 font-black border border-white/5 shadow-inner italic text-2xl">0{postIdx + 1}</div>
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                          {post.scheduledDay ? `${post.scheduledDay} Deployment` : 'Studio Pipeline'}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${post.status === 'posted' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'} animate-pulse`}></span>
                          <p className="text-[9px] mono font-bold text-slate-600 uppercase tracking-widest">
                            {post.status === 'posted' ? 'Successfully Propagated' : post.scheduledTime ? `Scheduled: ${post.scheduledTime}` : 'Active Synthesis'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {post.liveUrl && (
                        <a href={post.liveUrl} target="_blank" rel="noopener noreferrer" className="w-16 h-16 md:w-20 md:h-20 rounded-[26px] bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:bg-emerald-600 hover:text-white transition-soft shadow-2xl">
                          <i className="fas fa-external-link-alt text-xl"></i>
                        </a>
                      )}
                      
                      {/* Manual Deployment (Send) Icon */}
                      {!autoPilotEnabled && (
                        <button 
                          onClick={() => deployToProduction(postIdx)}
                          disabled={post.status === 'posting' || post.status === 'posted' || !post.visualUrl}
                          className={`w-16 h-16 md:w-20 md:h-20 rounded-[26px] border flex items-center justify-center transition-soft shadow-2xl ${
                            post.status === 'posted'
                              ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500'
                              : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-blue-600/10'
                          }`}
                        >
                          <i className={`fas ${post.status === 'posting' ? 'fa-spinner fa-spin' : post.status === 'posted' ? 'fa-check' : 'fa-paper-plane'} text-xl`}></i>
                        </button>
                      )}

                      <button 
                        onClick={() => handleDownload(postIdx)} disabled={!post.visualUrl || isDownloading === `${post.platformId}-${postIdx}`}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-[26px] bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-blue-600/10 transition-soft shadow-2xl"
                      >
                        <i className={`fas ${isDownloading === `${post.platformId}-${postIdx}` ? 'fa-spinner fa-spin' : 'fa-download'} text-xl`}></i>
                      </button>
                    </div>
                  </div>

                  <div ref={containerRef} className="relative aspect-square rounded-[60px] overflow-hidden bg-slate-950 border border-white/5 shadow-inner ring-1 ring-white/5 select-none group/preview">
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
                          style={{ left: `${post.designConfig.textX}%`, top: `${post.designConfig.textY}%`, textAlign: post.designConfig.textAlign as any, fontSize: `${post.designConfig.textSize}px`, fontWeight: 800, color: 'white', textShadow: '0 10px 40px rgba(0,0,0,0.9)', transform: 'translate(-50%, -50%)', maxWidth: '96%' }}
                        >
                          {post.graphicHeadline}
                        </div>
                        <button onClick={() => generateGraphic(post.platformId, post.visualPrompt, postIdx)} className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 opacity-0 group-hover/preview:opacity-100 transition-all hover:bg-blue-600 shadow-4xl active:scale-90">
                          <i className={`fas ${isGeneratingImage === `${post.platformId}-${postIdx}` ? 'fa-sync fa-spin' : 'fa-palette'} text-lg`}></i>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <button onClick={() => generateGraphic(post.platformId, post.visualPrompt, postIdx)} className="px-12 py-6 bg-blue-600 text-white rounded-full font-black text-[12px] uppercase tracking-widest shadow-3xl hover:bg-blue-500 transition-soft active:scale-95">Synthesize Base</button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-slate-950/40 rounded-[48px] p-8 md:p-12 border border-white/5 shadow-inner">
                      <div className="space-y-8">
                        <label className="text-[10px] mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3"><i className="fas fa-expand text-blue-500"></i> Logo Scale</label>
                        <input type="range" min="20" max="400" value={post.designConfig.logoSize} onChange={(e) => updateDesignConfig(postIdx, { logoSize: Number(e.target.value) })} className="w-full h-1.5 bg-slate-900 accent-blue-600 rounded-full appearance-none" />
                      </div>
                      <div className="space-y-8">
                        <label className="text-[10px] mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3"><i className="fas fa-text-height text-blue-500"></i> Text Scale</label>
                        <input type="range" min="10" max="120" value={post.designConfig.textSize} onChange={(e) => updateDesignConfig(postIdx, { textSize: Number(e.target.value) })} className="w-full h-1.5 bg-slate-900 accent-blue-600 rounded-full appearance-none" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <label className="text-[11px] mono font-black text-slate-600 uppercase tracking-[0.4em] ml-2">Final Production Copy</label>
                      <textarea 
                        value={post.content} 
                        onChange={(e) => { const updated = [...result.posts]; updated[postIdx].content = e.target.value; setResult({...result, posts: updated}); }}
                        className="w-full bg-slate-950/60 p-10 rounded-[40px] text-lg font-medium leading-relaxed text-slate-300 border border-white/5 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none h-56 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Auto Pilot Confirmation Modal */}
      {showAutoPilotConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-[48px] p-10 md:p-16 max-w-xl w-full shadow-6xl glass relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            
            <div className="w-24 h-24 bg-indigo-600/20 border border-indigo-500/30 rounded-[32px] flex items-center justify-center text-indigo-500 text-4xl mb-10 shadow-3xl mx-auto ring-4 ring-indigo-600/5">
              <i className="fas fa-robot animate-pulse-soft"></i>
            </div>

            <h2 className="text-3xl font-black text-white mb-6 tracking-tight">Activate Auto Pilot?</h2>
            
            <div className="space-y-6 mb-12">
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Auto Pilot mode automates your entire weekly social media presence. 
                By enabling this, the engine will synthesize <span className="text-white font-black underline decoration-indigo-500 decoration-2">6 unique posts</span> per platform, 
                generate bespoke visual assets for each, and schedule them for optimal deployment 
                from <span className="text-white font-black italic">Monday through Saturday</span> across all your authorized channels.
              </p>
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 text-[10px] mono font-black text-indigo-400 uppercase tracking-[0.3em]">
                Full Week • Auto-Synthesis • Linked Deployment
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => { setAutoPilotEnabled(true); setShowAutoPilotConfirm(false); }}
                className="flex-1 py-6 bg-white text-slate-950 rounded-[24px] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all active:scale-95 shadow-3xl flex items-center justify-center gap-4"
              >
                <i className="fas fa-bolt"></i>
                Enable Auto Pilot
              </button>
              <button 
                onClick={() => setShowAutoPilotConfirm(false)}
                className="flex-1 py-6 bg-slate-950 text-slate-500 rounded-[24px] font-black uppercase tracking-[0.2em] hover:text-white transition-all active:scale-95 border border-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCreator;
