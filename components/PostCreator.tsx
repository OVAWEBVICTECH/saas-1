
import React, { useState, useRef } from 'react';
import { analyzeAndGeneratePosts, executeProductionDeployment, refinePosts, generateImageForPost } from '../services/geminiService';
import { GenerationResult, SocialPost, SocialPlatform, SocialAccount } from '../types';

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
  const [isScrapedLogo, setIsScrapedLogo] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('linkedin');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkAuth = async () => {
    if (!(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
        setIsScrapedLogo(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setIsGenerating(true);
    setResult(null);
    setGenerationStep("Analyzing Brand Assets...");
    try {
      await checkAuth();
      const data = await analyzeAndGeneratePosts(url, manualName ? { companyName: manualName, tagline: manualTagline } : undefined, (status) => setGenerationStep(status));
      setResult(data);
      if (data.logoUrl && !logo) { setLogo(data.logoUrl); setIsScrapedLogo(true); }
      if (data.companyName && !manualName) setManualName(data.companyName);
      if (data.tagline && !manualTagline) setManualTagline(data.tagline);
    } catch (err: any) {
      setError(err.message || "Synthesis failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !result) return;
    setIsRefining(true);
    try {
      await checkAuth();
      const refinedData = await refinePosts(result, chatMessage);
      setResult(refinedData);
      setChatMessage('');
    } catch (err: any) {
      setError("Refinement failed.");
    } finally {
      setIsRefining(false);
    }
  };

  const generateGraphic = async (platformId: string, content: string, visualPrompt: string | undefined, postIdxInFlatList: number) => {
    const uniqueId = `${platformId}-${postIdxInFlatList}`;
    setIsGeneratingImage(uniqueId);
    try {
      await checkAuth();
      const imageUrl = await generateImageForPost(visualPrompt || content, content, logo || undefined);
      setResult(prev => {
        if (!prev) return null;
        const updatedPosts = [...prev.posts];
        updatedPosts[postIdxInFlatList].visualUrl = imageUrl;
        return { ...prev, posts: updatedPosts };
      });
    } catch (err) {
      setError("Graphic synthesis failed.");
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const deployToProduction = async (postIdxInFlatList: number) => {
    if (!result) return;
    const post = result.posts[postIdxInFlatList];
    
    // Check if account is actually connected
    const account = connectedAccounts.find(a => a.platformId === post.platformId);
    if (!account) return;

    setResult(prev => {
      if (!prev) return null;
      const updated = [...prev.posts];
      updated[postIdxInFlatList] = { ...updated[postIdxInFlatList], status: 'posting' };
      return { ...prev, posts: updated };
    });

    try {
      const liveUrl = await executeProductionDeployment(post, (stage) => {
        setResult(prev => {
          if (!prev) return null;
          const updated = [...prev.posts];
          updated[postIdxInFlatList].deploymentStage = stage;
          return { ...prev, posts: updated };
        });
      });

      setResult(prev => {
        if (!prev) return null;
        const updated = [...prev.posts];
        updated[postIdxInFlatList] = { ...updated[postIdxInFlatList], status: 'posted', liveUrl };
        return { ...prev, posts: updated };
      });
    } catch (err) {
      setResult(prev => {
        if (!prev) return null;
        const updated = [...prev.posts];
        updated[postIdxInFlatList].status = 'failed';
        return { ...prev, posts: updated };
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 md:py-16 fade-in-up">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between mb-16 md:mb-24 gap-12">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
            Campaign <span className="text-blue-500 text-glow">Synthesis</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed">Cross-platform deployment engine with integrated visual AI for enterprise social ecosystems.</p>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-8 md:p-10 rounded-[40px] flex flex-col sm:flex-row gap-8 glass shadow-3xl flex-1">
           <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] mono font-bold uppercase tracking-widest text-slate-500">Brand Identity</p>
                  <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Company Name" className="bg-slate-950/80 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none w-full" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] mono font-bold uppercase tracking-widest text-slate-500">Marketing Hook</p>
                  <input type="text" value={manualTagline} onChange={(e) => setManualTagline(e.target.value)} placeholder="Tagline" className="bg-slate-950/80 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none w-full" />
                </div>
              </div>
           </div>

           <div className="flex items-center gap-6 sm:border-l border-white/5 sm:pl-10">
              <div onClick={() => fileInputRef.current?.click()} className={`w-16 h-16 md:w-20 md:h-20 bg-slate-950 border-2 ${isScrapedLogo ? 'border-emerald-500/30' : 'border-white/5'} rounded-3xl flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden relative shadow-2xl`}>
                  {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain p-3" /> : <i className="fas fa-plus text-slate-600 text-xl"></i>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
              <div>
                <p className="text-[10px] mono font-bold uppercase tracking-widest text-slate-500 mb-1">Visual DNA</p>
                <button onClick={() => fileInputRef.current?.click()} className="text-xs font-extrabold text-blue-500 uppercase tracking-widest">Update Assets</button>
              </div>
           </div>
        </div>
      </div>

      <div className="relative mb-20 max-w-5xl">
        <form onSubmit={handleGenerate} className={`bg-slate-900/60 border ${isGenerating ? 'border-blue-500/50 ring-4 ring-blue-500/10' : error ? 'border-rose-500/50' : 'border-white/5'} rounded-[32px] p-3 md:p-4 flex flex-col sm:flex-row items-center glass shadow-2xl gap-3`}>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} disabled={isGenerating} placeholder="brand-domain.com" className="w-full flex-1 bg-transparent border-none focus:ring-0 text-white py-4 md:py-6 px-4 text-xl md:text-2xl font-bold tracking-tight" />
          <button type="submit" disabled={isGenerating || !url} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 h-16 md:h-20 px-10 md:px-16 rounded-[24px] font-black text-base md:text-xl transition-all flex items-center justify-center gap-4 shadow-blue-600/20 active:scale-95 whitespace-nowrap">
            {isGenerating ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
            Generate
          </button>
        </form>
        {error && <div className="mt-6 px-8 py-4 bg-rose-500/10 border border-rose-500/20 rounded-[20px] text-rose-500 text-sm font-bold flex items-center gap-4 animate-in fade-in"><i className="fas fa-exclamation-triangle"></i>{error}</div>}
      </div>

      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 md:py-32 space-y-12 animate-in fade-in duration-700 text-center">
            <div className="w-24 h-24 border-[8px] border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
            <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight">{generationStep}</h3>
        </div>
      )}

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-48">
          <div className="flex flex-col xl:flex-row items-center xl:justify-between gap-10 mb-16 border-b border-white/5 pb-16">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">{result.companyName} <span className="text-slate-500 text-xl font-bold ml-4">Campaign Core</span></h2>
              <div className="flex items-center gap-2.5 bg-slate-950/60 p-2 rounded-[28px] border border-white/5 glass shadow-2xl">
                 {PLATFORMS.map(p => (
                   <button key={p.id} onClick={() => setActiveTab(p.id)} className={`px-6 py-3.5 rounded-[20px] flex items-center gap-3 transition-all font-black text-[10px] md:text-xs uppercase tracking-widest ${activeTab === p.id ? `${p.color} text-white shadow-xl` : 'text-slate-500 hover:text-slate-300'}`}>
                     <i className={`fab ${p.icon}`}></i> {p.name}
                   </button>
                 ))}
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {result.posts
              .map((post, originalIndex) => ({ post, originalIndex }))
              .filter(({ post }) => post.platformId === activeTab)
              .map(({ post, originalIndex }, idx) => {
                const account = connectedAccounts.find(a => a.platformId === post.platformId);
                const isConnected = !!account;
                const isImgLoading = isGeneratingImage === `${post.platformId}-${originalIndex}`;

                return (
                  <div key={originalIndex} className={`bg-slate-900/40 border-2 ${isConnected ? 'border-white/5' : 'border-rose-500/10'} rounded-[48px] md:rounded-[64px] p-8 md:p-14 flex flex-col glass shadow-3xl animate-in fade-in duration-700 relative overflow-hidden group`}>
                    
                    {!isConnected && (
                      <div className="absolute inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="bg-slate-900 border border-white/10 p-10 rounded-[40px] text-center shadow-4xl glass max-w-xs mx-auto ring-1 ring-rose-500/20">
                          <i className="fas fa-lock text-rose-500 text-3xl mb-6"></i>
                          <p className="text-white font-black uppercase tracking-widest text-xs mb-3">API Connection Required</p>
                          <p className="text-slate-500 text-sm mb-8 font-medium">Link your {post.platformId} pipeline in the Social Hub to deploy.</p>
                          <button onClick={onNavigateToAuth} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Link Pipeline</button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-10 md:mb-14 relative z-10">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center text-blue-500 mono font-black text-lg shadow-2xl">0{idx + 1}</div>
                        <div>
                          <h4 className="font-black text-white uppercase tracking-widest text-[10px] mb-1">Variation</h4>
                          <span className="text-[10px] font-bold text-slate-500 mono uppercase tracking-widest">{idx === 0 ? 'Performance' : 'Brand Story'}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deployToProduction(originalIndex)}
                        disabled={post.status === 'posted' || post.status === 'posting' || !isConnected}
                        className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[32px] flex items-center justify-center transition-all shadow-2xl active:scale-95 ${
                          post.status === 'draft' ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20' :
                          post.status === 'posting' ? 'bg-blue-600/50 animate-pulse' : 'bg-emerald-600 text-white shadow-emerald-500/20'
                        }`}
                      >
                        {post.status === 'draft' ? <i className="fas fa-paper-plane text-base md:text-xl"></i> : 
                         post.status === 'posting' ? <i className="fas fa-sync fa-spin text-base md:text-xl"></i> : <i className="fas fa-check text-base md:text-xl"></i>}
                      </button>
                    </div>

                    <div className="relative aspect-square mb-10 bg-slate-950 rounded-[32px] md:rounded-[48px] overflow-hidden border border-white/5 flex items-center justify-center shadow-3xl">
                      {post.visualUrl ? (
                        <>
                          <img src={post.visualUrl} alt="Asset" className="w-full h-full object-cover" />
                          <button onClick={() => generateGraphic(post.platformId, post.content, post.visualPrompt, originalIndex)} className="absolute top-6 right-6 bg-slate-950/80 backdrop-blur-xl text-white w-12 h-12 rounded-full flex items-center justify-center border border-white/20 shadow-2xl z-10"><i className={`fas ${isImgLoading ? 'fa-sync fa-spin' : 'fa-arrows-rotate'}`}></i></button>
                        </>
                      ) : (
                        <div className="text-center p-10">
                          <button onClick={() => generateGraphic(post.platformId, post.content, post.visualPrompt, originalIndex)} className="px-10 py-5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-[24px] font-black text-xs uppercase tracking-widest border border-white/5 transition-all shadow-2xl glass">
                            {isImgLoading ? 'Synthesizing...' : 'Synthesize Visual'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 bg-slate-950/40 border border-white/5 rounded-[32px] p-8 md:p-12 mb-10 text-base md:text-xl font-medium glass leading-relaxed">
                      {post.content}
                    </div>

                    {post.status === 'posting' && (
                      <div className="mb-8 space-y-4 animate-in fade-in">
                        <div className="flex justify-between text-[10px] mono font-black text-blue-500 uppercase tracking-widest">
                          <span>Status: Executing Protocol</span>
                          <span>{post.deploymentStage?.toUpperCase() || 'INITIALIZING'}</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                           <div className="bg-blue-600 h-full transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]" style={{ width: post.deploymentStage === 'handshake' ? '25%' : post.deploymentStage === 'upload' ? '50%' : post.deploymentStage === 'propagate' ? '75%' : post.deploymentStage === 'verify' ? '95%' : '5%' }}></div>
                        </div>
                      </div>
                    )}

                    {post.status === 'posted' && (
                      <div className="mb-10 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] mono font-black text-emerald-500 uppercase tracking-widest">Live Deployment Verified</p>
                          <i className="fas fa-check-circle text-emerald-500"></i>
                        </div>
                        <a href={post.liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-2 truncate">
                          <i className="fas fa-external-link-alt text-[10px]"></i>
                          {post.liveUrl}
                        </a>
                      </div>
                    )}

                    {!isConnected ? null : (
                      <div className="flex items-center gap-4 text-slate-500 pt-8 border-t border-white/5">
                        <img src={account.avatarUrl} className="w-8 h-8 rounded-xl object-cover" alt="Profile" />
                        <span className="text-[10px] mono font-bold uppercase tracking-widest">Session: {account.handle}</span>
                      </div>
                    )}
                  </div>
                );
            })}
          </div>

          <div className="fixed bottom-32 lg:bottom-12 left-0 right-0 px-6 md:px-12 z-[100] max-w-5xl mx-auto pointer-events-none">
             <form onSubmit={handleRefine} className="bg-slate-950/80 backdrop-blur-3xl border border-white/5 rounded-[32px] md:rounded-[56px] p-2.5 flex items-center shadow-4xl ring-1 ring-white/10 pointer-events-auto group/refine hover:ring-blue-500/30 transition-all">
                <div className="hidden xs:flex pl-8 md:pl-12 pr-4 text-blue-500"><i className={`fas ${isRefining ? 'fa-circle-notch fa-spin' : 'fa-sparkles'} text-2xl`}></i></div>
                <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder={`Instruct campaign adjustments...`} className="flex-1 bg-transparent border-none focus:ring-0 text-white py-5 md:py-8 px-4 font-bold text-base md:text-2xl placeholder:text-slate-600 tracking-tight" />
                <button type="submit" disabled={isRefining || !chatMessage.trim()} className="bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-20 px-8 md:px-16 py-4 md:py-7 rounded-[24px] md:rounded-[44px] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 whitespace-nowrap">{isRefining ? 'Optimizing' : 'Optimize'}</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCreator;
