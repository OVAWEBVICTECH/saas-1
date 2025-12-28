
import React, { useState } from 'react';
import { SocialPlatform, SocialAccount } from '../types';
import { validateSocialHandle } from '../services/geminiService';

const PLATFORMS: SocialPlatform[] = [
  { id: 'linkedin', name: 'LinkedIn', icon: 'fa-linkedin-in', color: 'bg-[#0077B5]', connected: false },
  { id: 'facebook', name: 'Facebook', icon: 'fa-facebook-f', color: 'bg-[#1877F2]', connected: false },
  { id: 'instagram', name: 'Instagram', icon: 'fa-instagram', color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', connected: false },
  { id: 'threads', name: 'Threads', icon: 'fa-at', color: 'bg-black', connected: false },
  { id: 'twitter', name: 'Twitter / X', icon: 'fa-x-twitter', color: 'bg-black', connected: false },
];

interface SocialHubProps {
  connectedAccounts: SocialAccount[];
  onConnect: (account: SocialAccount) => void;
  onDisconnect: (platformId: string) => void;
}

const SocialHub: React.FC<SocialHubProps> = ({ connectedAccounts, onConnect, onDisconnect }) => {
  const [authPlatform, setAuthPlatform] = useState<SocialPlatform | null>(null);
  const [handleInput, setHandleInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartAuth = (platform: SocialPlatform) => {
    setAuthPlatform(platform);
    setHandleInput('');
    setError(null);
  };

  const handleCompleteAuth = async () => {
    if (!handleInput.trim() || !authPlatform) return;
    setIsVerifying(true);
    setError(null);
    try {
      const account = await validateSocialHandle(authPlatform.id, handleInput, "Brand X");
      onConnect(account);
      setAuthPlatform(null);
    } catch (err) {
      setError("Verification failed. Handshake timed out.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 md:py-24 fade-in-up">
      <div className="mb-16 md:mb-24 text-center md:text-left">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight text-gradient">Channel Infrastructure</h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">Establish secure API handshakes and manage production-ready social pipelines.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {PLATFORMS.map((platform) => {
          const account = connectedAccounts.find(a => a.platformId === platform.id);
          const isConnected = !!account;

          return (
            <div key={platform.id} className={`bg-slate-900/40 border-2 ${isConnected ? 'border-blue-500/30' : 'border-white/5'} rounded-[48px] p-10 transition-all hover:scale-[1.02] group relative overflow-hidden glass shadow-3xl`}>
              <div className="flex items-start justify-between mb-12">
                <div className={`w-16 h-16 md:w-20 md:h-20 ${platform.color} rounded-[24px] md:rounded-[28px] flex items-center justify-center text-white text-3xl md:text-4xl shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                  <i className={`fab ${platform.icon}`}></i>
                </div>
                {isConnected ? (
                  <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] mono font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    Active Pipeline
                  </div>
                ) : (
                  <div className="px-4 py-1.5 rounded-full bg-slate-950 text-slate-600 border border-white/5 text-[10px] mono font-black uppercase tracking-widest">
                    Unauthorized
                  </div>
                )}
              </div>

              {isConnected ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center gap-5">
                    <img src={account.avatarUrl} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="Avatar" />
                    <div className="min-w-0">
                      <p className="text-lg font-black text-white truncate">{account.profileName}</p>
                      <p className="text-xs font-bold mono text-blue-500 tracking-widest">@{account.handle}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] mono font-black text-slate-500 uppercase tracking-widest mb-1">Followers</p>
                      <p className="text-white font-black">{account.followers}</p>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] mono font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-emerald-500 font-black flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDisconnect(platform.id)}
                    className="w-full py-4 bg-slate-950 hover:bg-rose-500/10 hover:text-rose-500 text-slate-600 rounded-2xl text-[10px] mono font-black border border-white/5 hover:border-rose-500/30 transition-all uppercase tracking-widest"
                  >
                    Revoke Access
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-white tracking-tight">{platform.name}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">Authorization required to establish a secure production pipeline.</p>
                  <button 
                    onClick={() => handleStartAuth(platform)}
                    className="w-full py-5 md:py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] md:rounded-[32px] font-black text-xs md:text-sm uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-4 active:scale-95"
                  >
                    <i className="fas fa-link"></i>
                    Authorize API
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mock OAuth Modal */}
      {authPlatform && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-[48px] p-10 md:p-14 max-w-lg w-full shadow-4xl glass relative overflow-hidden">
             <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
             <button onClick={() => setAuthPlatform(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white">
               <i className="fas fa-times text-xl"></i>
             </button>
             <div className={`w-20 h-20 ${authPlatform.color} rounded-3xl flex items-center justify-center text-white text-4xl mb-8 shadow-2xl mx-auto`}>
               <i className={`fab ${authPlatform.icon}`}></i>
             </div>
             <h2 className="text-3xl font-black text-white text-center mb-3">Link {authPlatform.name}</h2>
             <p className="text-slate-500 text-center mb-10 font-medium">Grant NexusAI production access to deploy content and retrieve analytics.</p>
             
             <div className="space-y-6 mb-10">
                <div className="space-y-2">
                  <p className="text-[10px] mono font-bold text-slate-500 uppercase tracking-widest">Profile Handle</p>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 font-bold">@</span>
                    <input 
                      type="text" 
                      value={handleInput}
                      onChange={(e) => setHandleInput(e.target.value)}
                      placeholder="username"
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-10 pr-5 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                {error && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">{error}</p>}
             </div>

             <button 
               onClick={handleCompleteAuth}
               disabled={isVerifying || !handleInput.trim()}
               className="w-full py-6 bg-white text-slate-950 rounded-[24px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4 shadow-3xl"
             >
               {isVerifying ? (
                 <>
                   <i className="fas fa-circle-notch fa-spin"></i>
                   Verifying API...
                 </>
               ) : (
                 <>
                   Establish Handshake
                   <i className="fas fa-arrow-right"></i>
                 </>
               )}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialHub;
