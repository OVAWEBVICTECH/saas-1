
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
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('linkedin');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  
  const [dragItem, setDragItem] = useState<{ type: 'logo' | 'text'; postIdx: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setIsGenerating(true);
    setResult(null);
    setGenerationStep("Analyzing Brand Assets...");
    try {
      const data = await analyzeAndGeneratePosts(url, manualName ? { companyName: manualName, tagline: manualTagline } : undefined, (status) => setGenerationStep(status));
      setResult(data);
      if (data.logoUrl && !logo) setLogo(data.logoUrl);
      if (data.companyName && !manualName) setManualName(data.companyName);
      if (data.tagline && !manualTagline) setManualTagline(data.tagline);

      const firstActivePost = data.posts.find(p => p.platformId === activeTab);
      if (firstActivePost) {
        const idx = data.posts.indexOf(firstActivePost);
        generateGraphic(firstActivePost.platformId, firstActivePost.visualPrompt, idx, data);
      }
    } catch (err: any) {
      setError(`Synthesis Error: ${err.message || "Engine timeout."}`);
    } finally {
      setIsGenerating(false);
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

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = post.visualUrl;

      await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = reject;
      });

      const EXPORT_SIZE = 1080;
      canvas.width = EXPORT_SIZE;
      canvas.height = EXPORT_SIZE;

      const previewWidth = containerRef.current?.offsetWidth || 512;
      const scaleFactor = EXPORT_SIZE / previewWidth;

      ctx.drawImage(bgImg, 0, 0, EXPORT_SIZE, EXPORT_SIZE);

      if (logo) {
        const logoImg = new Image();
        logoImg.src = logo;
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
        
        const imgRatio = logoImg.width / logoImg.height;
        const baseSize = post.designConfig.logoSize * scaleFactor;
        
        let drawW, drawH;
        if (imgRatio >= 1) {
          drawW = baseSize;
          drawH = baseSize / imgRatio;
        } else {
          drawH = baseSize;
          drawW = baseSize * imgRatio;
        }

        const lX = (post.designConfig.logoX / 100) * EXPORT_SIZE;
        const lY = (post.designConfig.logoY / 100) * EXPORT_SIZE;
        
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 25 * scaleFactor;
        ctx.shadowOffsetY = 8 * scaleFactor;
        ctx.drawImage(logoImg, lX - drawW / 2, lY - drawH / 2, drawW, drawH);
        ctx.restore();
      }

      const tX = (post.designConfig.textX / 100) * EXPORT_SIZE;
      const tY = (post.designConfig.textY / 100) * EXPORT_SIZE;
      const tSize = post.designConfig.textSize * scaleFactor;

      ctx.save();
      ctx.font = `800 ${tSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = 'white';
      ctx.textAlign = post.designConfig.textAlign as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 20 * scaleFactor;
      ctx.shadowOffsetY = 6 * scaleFactor;

      const maxWidth = EXPORT_SIZE * 0.88;
      const words = post.graphicHeadline.split(' ');
      let line = '';
      const lines = [];
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      const lineHeight = tSize * 1.15;
      const totalHeight = lines.length * lineHeight;
      let startY = tY - (totalHeight / 2) + (lineHeight / 2);

      lines.forEach(l => {
        ctx.fillText(l.trim(), tX, startY);
        startY += lineHeight;
      });
      ctx.restore();

      const link = document.createElement('a');
      link.download = `webvic-design-${post.platformId}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error("Studio Export error:", err);
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

  const setPresetPosition = (postIdx: number, type: 'logo' | 'text', pos: string) => {
    if (type === 'logo') {
      let x = 15, y = 15;
      if (pos === 'top-right') { x = 85; y = 15; }
      if (pos === 'bottom-left') { x = 15; y = 85; }
      if (pos === 'bottom-right') { x = 85; y = 85; }
      updateDesignConfig(postIdx, { logoPosition: pos as any, logoX: x, logoY: y });
    } else {
      let y = 50;
      if (pos === 'top') y = 20;
      if (pos === 'bottom') y = 80;
      updateDesignConfig(postIdx, { textPosition: pos as any, textY: y, textX: 50 });
    }
  };

  const handleUpdateContent = (postIdx: number, newContent: string) => {
    setResult(prev => {
      if (!prev) return null;
      const updatedPosts = [...prev.posts];
      updatedPosts[postIdx].content = newContent;
      return { ...prev, posts: updatedPosts };
    });
  };

  const handleUpdateHeadline = (postIdx: number, newHeadline: string) => {
    setResult(prev => {
      if (!prev) return null;
      const updatedPosts = [...prev.posts];
      updatedPosts[postIdx].graphicHeadline = newHeadline;
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
        if (!target) return null;
        const updatedPosts = [...target.posts];
        updatedPosts[postIdx].visualUrl = imageUrl;
        return { ...target, posts: updatedPosts };
      });
    } catch (err: any) {
      console.error("Design synthesis error:", err);
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const deployToProduction = async (postIdx: number) => {
    if (!result) return;
    const post = result.posts[postIdx];
    const account = connectedAccounts.find(a => a.platformId === post.platformId);
    if (!account) { onNavigateToAuth(); return; }

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

      if (dragItem.type === 'logo') {
        updateDesignConfig(dragItem.postIdx, { logoX: x, logoY: y, logoPosition: 'custom' });
      } else {
        updateDesignConfig(dragItem.postIdx, { textX: x, textY: y, textPosition: 'custom' });
      }
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
    <div className="py-10 md:py-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header & Brand Context - Redesigned to be more spacious */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-12 mb-16 md:mb-24">
        <div className="max-w-2xl space-y-4 text-center xl:text-left shrink-0">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none">
            Design <span className="text-blue-500 italic drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]">Studio</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl lg:text-2xl font-medium tracking-tight">Professional layout engine for multi-channel brand synthesis.</p>
        </div>

        {/* Global Brand Controls - Expanded width and better breathing room */}
        <div className="glass bento-card p-10 md:p-14 flex flex-col md:flex-row items-stretch gap-12 flex-1 shadow-4xl border-white/10 ring-1 ring-white/5 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1">
            <div className="space-y-4">
              <label className="text-[11px] mono font-black text-slate-500 uppercase tracking-[0.4em] ml-1">Brand Identity</label>
              <input 
                type="text" 
                value={manualName} 
                onChange={(e) => setManualName(e.target.value)} 
                placeholder="Company Name" 
                className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-8 py-6 text-xl text-white font-black focus:ring-4 focus:ring-blue-500/20 outline-none transition-soft placeholder:text-slate-800 shadow-inner" 
              />
            </div>
            <div className="space-y-4">
              <label className="text-[11px] mono font-black text-slate-500 uppercase tracking-[0.4em] ml-1">Marketing Hook</label>
              <input 
                type="text" 
                value={manualTagline} 
                onChange={(e) => setManualTagline(e.target.value)} 
                placeholder="Core Tagline" 
                className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-8 py-6 text-xl text-white font-black focus:ring-4 focus:ring-blue-500/20 outline-none transition-soft placeholder:text-slate-800 shadow-inner" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-10 pl-0 md:pl-14 border-t md:border-t-0 md:border-l border-white/10 pt-10 md:pt-0 shrink-0 justify-center md:justify-start">
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className="w-28 h-28 bg-slate-950 rounded-[32px] border border-white/10 flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-soft overflow-hidden group shadow-3xl ring-2 ring-white/5"
            >
              {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110" /> : <i className="fas fa-plus text-slate-700 text-2xl"></i>}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if(f) { const r = new FileReader(); r.onload = () => setLogo(r.result as string); r.readAsDataURL(f); }
            }} />
            <div className="space-y-2">
              <p className="text-[11px] mono font-black text-slate-600 uppercase tracking-[0.3em]">Global Asset</p>
              <button onClick={() => fileInputRef.current?.click()} className="text-[11px] font-black text-blue-500 uppercase tracking-widest hover:text-white transition-soft py-1">Replace Logo</button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action */}
      <div className="mb-24 md:mb-32">
        <form onSubmit={handleGenerate} className="glass p-4 md:p-5 rounded-[48px] flex flex-col sm:flex-row items-center gap-5 shadow-5xl max-w-6xl mx-auto ring-1 ring-white/10">
          <div className="flex-1 w-full relative">
            <i className="fas fa-link absolute left-10 top-1/2 -translate-y-1/2 text-slate-700 text-2xl"></i>
            <input 
              type="text" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              disabled={isGenerating} 
              placeholder="brand-source-domain.com" 
              className="w-full bg-transparent border-none focus:ring-0 text-white py-8 pl-20 pr-8 text-2xl md:text-4xl font-black tracking-tighter placeholder:text-slate-800" 
            />
          </div>
          <button type="submit" disabled={isGenerating || !url} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 px-14 h-24 md:h-28 rounded-[36px] font-black text-white transition-soft flex items-center justify-center gap-5 shadow-2xl shadow-blue-600/30 active:scale-95 text-xl md:text-2xl">
            {isGenerating ? <i className="fas fa-atom fa-spin"></i> : <i className="fas fa-wand-sparkles"></i>}
            SYNTHESIZE
          </button>
        </form>
      </div>

      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-40 text-center space-y-8 animate-in zoom-in-95 duration-700">
            <div className="w-20 h-20 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin shadow-[0_0_40px_rgba(59,130,246,0.3)]"></div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-[0.3em]">{generationStep}</h3>
              <p className="text-slate-600 mono text-xs font-bold uppercase tracking-widest animate-pulse">Establishing secure neural handshake...</p>
            </div>
        </div>
      )}

      {/* Editor & Preview Grid */}
      {result && (
        <div className="space-y-16 md:space-y-24">
          {/* Tab Navigation */}
          <div className="flex items-center justify-center sticky top-[100px] z-[50] pointer-events-none">
            <div className="glass p-2.5 rounded-full flex flex-wrap justify-center gap-2 shadow-4xl pointer-events-auto ring-1 ring-white/10">
              {PLATFORMS.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => setActiveTab(p.id)} 
                  className={`px-8 md:px-10 py-4 md:py-5 rounded-full flex items-center gap-4 transition-soft font-black text-[11px] uppercase tracking-[0.15em] ${activeTab === p.id ? `${p.color} text-white shadow-2xl scale-105` : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  <i className={`fab ${p.icon} text-base md:text-lg`}></i> {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 md:gap-20">
            {result.posts.map((post, postIdx) => (
              post.platformId === activeTab && (
                <div key={`${post.platformId}-${postIdx}`} className="glass bento-card p-10 md:p-16 lg:p-20 space-y-14 md:space-y-20 group hover:border-blue-500/20 transition-soft flex flex-col shadow-5xl ring-1 ring-white/5">
                  
                  {/* Studio Interface Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-950 rounded-[22px] flex items-center justify-center text-blue-500 font-black border border-white/10 shadow-inner italic text-2xl">0{postIdx + 1}</div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Studio Pipeline</h4>
                        <div className="flex items-center gap-2">
                           <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-soft shadow-[0_0_10px_#10b981]"></span>
                           <p className="text-[10px] mono font-bold text-slate-500 uppercase tracking-widest">Active Editing Session</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleDownload(postIdx)}
                        disabled={!post.visualUrl || isDownloading === `${post.platformId}-${postIdx}`}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/30 transition-soft shadow-2xl"
                        title="Export Asset"
                      >
                        <i className={`fas ${isDownloading === `${post.platformId}-${postIdx}` ? 'fa-spinner fa-spin' : 'fa-download'} text-xl`}></i>
                      </button>
                      <button 
                        onClick={() => deployToProduction(postIdx)} 
                        disabled={post.status === 'posting'}
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-[24px] flex items-center justify-center transition-soft shadow-2xl ${post.status === 'draft' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-emerald-600 text-white ring-4 ring-emerald-500/10'}`}
                      >
                        <i className={`fas ${post.status === 'posting' ? 'fa-spinner fa-spin' : post.status === 'posted' ? 'fa-check-double' : 'fa-rocket'} text-xl`}></i>
                      </button>
                    </div>
                  </div>

                  {/* PREVIEW CONTAINER */}
                  <div 
                    ref={containerRef}
                    className="relative aspect-square rounded-[60px] overflow-hidden bg-slate-950 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] select-none cursor-default group/preview ring-1 ring-white/5"
                  >
                    {post.visualUrl ? (
                      <div className="w-full h-full relative overflow-hidden">
                        <img src={post.visualUrl} alt="Visual Base" className="w-full h-full object-cover pointer-events-none" />
                        
                        {/* DRAGGABLE LOGO */}
                        {logo && (
                          <div 
                            onMouseDown={(e) => handleMouseDown(e, 'logo', postIdx)}
                            className={`absolute transition-none cursor-move group/asset z-20 ${dragItem?.type === 'logo' ? 'ring-2 ring-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]' : ''}`}
                            style={{ 
                              left: `${post.designConfig.logoX}%`,
                              top: `${post.designConfig.logoY}%`,
                              width: `${post.designConfig.logoSize}px`,
                              height: 'auto',
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <img src={logo} alt="Logo Layer" className="w-full h-auto object-contain filter drop-shadow-[0_15px_40px_rgba(0,0,0,0.9)] pointer-events-none" />
                            <div className="absolute inset-[-15px] border-2 border-dashed border-transparent group-hover/asset:border-blue-500/50 rounded-2xl pointer-events-none"></div>
                          </div>
                        )}

                        {/* DRAGGABLE HEADLINE */}
                        <div 
                          onMouseDown={(e) => handleMouseDown(e, 'text', postIdx)}
                          className={`absolute px-12 transition-none cursor-move w-full group/asset z-10 ${dragItem?.type === 'text' ? 'ring-2 ring-blue-500/30' : ''}`}
                          style={{ 
                            left: `${post.designConfig.textX}%`,
                            top: `${post.designConfig.textY}%`,
                            textAlign: post.designConfig.textAlign as any,
                            fontSize: `${post.designConfig.textSize}px`,
                            fontWeight: 800,
                            lineHeight: 1.05,
                            color: 'white',
                            textShadow: '0 10px 40px rgba(0,0,0,0.95), 0 0 60px rgba(0,0,0,0.5)',
                            transform: 'translate(-50%, -50%)',
                            maxWidth: '94%'
                          }}
                        >
                          {post.graphicHeadline}
                          <div className="absolute inset-[-25px] border-2 border-dashed border-transparent group-hover/asset:border-blue-500/30 rounded-[40px] pointer-events-none -mx-4"></div>
                        </div>

                        {/* Synthesis Control Overlays */}
                        <div className="absolute bottom-12 right-12 flex flex-col gap-5 opacity-0 group-hover/preview:opacity-100 transition-soft z-30">
                           <button onClick={() => generateGraphic(post.platformId, post.visualPrompt, postIdx)} className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-blue-600 shadow-4xl active:scale-90 transition-soft">
                              <i className={`fas ${isGeneratingImage === `${post.platformId}-${postIdx}` ? 'fa-sync fa-spin' : 'fa-palette'} text-xl`}></i>
                           </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900/30">
                        <button onClick={() => generateGraphic(post.platformId, post.visualPrompt, postIdx)} className="px-14 py-8 bg-blue-600 text-white rounded-[32px] font-black text-[13px] uppercase tracking-[0.4em] shadow-4xl hover:bg-blue-500 active:scale-95 transition-soft">
                          Synthesize Visual Base
                        </button>
                      </div>
                    )}
                  </div>

                  {/* STUDIO CONTROL PANELS */}
                  <div className="space-y-10 md:space-y-14">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 bg-slate-950/50 rounded-[50px] p-10 md:p-14 border border-white/10 glass shadow-inner">
                      {/* Logo Mastering */}
                      <div className="space-y-10 pb-10 md:pb-0 md:border-r border-white/5 pr-0 md:pr-14">
                        <div className="space-y-8">
                          <h5 className="text-[12px] mono font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
                            <i className="fas fa-bullseye text-blue-500"></i> Logo Presets
                          </h5>
                          <div className="flex gap-4">
                            {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
                              <button 
                                key={pos}
                                onClick={() => setPresetPosition(postIdx, 'logo', pos)}
                                className={`w-14 h-14 md:w-16 md:h-16 rounded-[22px] border-2 flex items-center justify-center transition-soft ${post.designConfig.logoPosition === pos ? 'bg-blue-600 border-blue-400 text-white shadow-xl' : 'bg-slate-900 border-white/5 text-slate-600 hover:border-white/10'}`}
                              >
                                <i className={`fas fa-square text-[10px] ${pos.includes('top') ? 'mb-auto' : 'mt-auto'} ${pos.includes('left') ? 'mr-auto' : 'ml-auto'} p-3`}></i>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-8">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[12px] mono font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
                              <i className="fas fa-expand-arrows-alt text-blue-500"></i> Logo Scale
                            </h5>
                            <span className="text-[11px] mono text-blue-500 font-bold bg-blue-500/10 px-4 py-1.5 rounded-xl border border-blue-500/20">{post.designConfig.logoSize}px</span>
                          </div>
                          <input 
                            type="range" min="20" max="450" step="1" 
                            value={post.designConfig.logoSize} 
                            onChange={(e) => updateDesignConfig(postIdx, { logoSize: Number(e.target.value) })}
                            className="w-full accent-blue-600 h-2 bg-slate-900 rounded-full appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Typography Mastering */}
                      <div className="space-y-10">
                        <div className="space-y-8">
                          <h5 className="text-[12px] mono font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
                            <i className="fas fa-align-justify text-blue-500"></i> Text Alignment
                          </h5>
                          <div className="flex gap-4">
                            {(['left', 'center', 'right'] as const).map(align => (
                              <button 
                                key={align}
                                onClick={() => updateDesignConfig(postIdx, { textAlign: align })}
                                className={`w-14 h-14 md:w-16 md:h-16 rounded-[22px] border-2 flex items-center justify-center transition-soft ${post.designConfig.textAlign === align ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-105' : 'bg-slate-900 border-white/5 text-slate-600 hover:border-white/10'}`}
                              >
                                <i className={`fas fa-align-${align} text-lg`}></i>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-8">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[12px] mono font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
                              <i className="fas fa-text-size text-blue-500"></i> Text Fluidity
                            </h5>
                            <span className="text-[11px] mono text-blue-500 font-bold bg-blue-500/10 px-4 py-1.5 rounded-xl border border-blue-500/20">{post.designConfig.textSize}px</span>
                          </div>
                          <input 
                            type="range" min="12" max="140" step="1" 
                            value={post.designConfig.textSize} 
                            onChange={(e) => updateDesignConfig(postIdx, { textSize: Number(e.target.value) })}
                            className="w-full accent-blue-600 h-2 bg-slate-900 rounded-full appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Content Mastering */}
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <label className="text-[12px] mono font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-4 ml-2">
                          <i className="fas fa-font text-blue-500"></i> Visual Headline Hook
                        </label>
                        <input 
                          type="text"
                          value={post.graphicHeadline}
                          onChange={(e) => handleUpdateHeadline(postIdx, e.target.value)}
                          className="w-full bg-slate-950/70 px-12 py-8 rounded-[36px] text-2xl md:text-3xl font-black text-white border border-white/10 focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 outline-none transition-soft shadow-inner"
                        />
                      </div>

                      <div className="space-y-6">
                        <label className="text-[12px] mono font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-4 ml-2">
                          <i className="fas fa-quote-left text-blue-500"></i> Deployment Copy
                        </label>
                        <textarea 
                          value={post.content}
                          onChange={(e) => handleUpdateContent(postIdx, e.target.value)}
                          className="w-full bg-slate-950/70 p-12 rounded-[48px] text-xl font-medium leading-relaxed text-slate-300 border border-white/10 focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 outline-none resize-none h-60 transition-soft shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCreator;
