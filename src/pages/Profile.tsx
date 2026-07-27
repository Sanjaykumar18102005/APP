import { useEffect, useState } from 'react';
import { User, LogOut, LayoutList, History, Settings, CreditCard, ChevronLeft, Copy, Check, Trash2, X, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { isFirebaseConfigured, db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { UserDocData } from '../lib/user-service';

type ViewMode = 'main' | 'saved' | 'history' | 'settings' | 'subscription';

export function Profile() {
  const { user, loginWithGoogle, loginAsGuest, logout } = useAuth();
  const [view, setView] = useState<ViewMode>('main');
  const [prompts, setPrompts] = useState<any[]>([]);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [userDoc, setUserDoc] = useState<UserDocData | null>(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [selectedItem, setSelectedItem] = useState<{ id?: string; title: string; content: string; category?: string; date?: string; type: 'saved' | 'history' } | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (user?.uid) {
      fetchPrompts(user.uid);
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid && db && !user.isSandbox) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          setUserDoc(snap.data() as UserDocData);
        }
      }, (err) => {
        console.warn("Realtime user doc error:", err);
      });

      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const fetchPrompts = async (uid: string) => {
    setLoading(true);
    if (user?.isSandbox) {
      const sandboxPrompts = JSON.parse(localStorage.getItem('sandbox_saved_prompts') || '[]');
      setPrompts(sandboxPrompts);
      setLoading(false);
      return;
    }

    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, "prompts"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory since we might not have an index for createdAt desc
      fetched.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPrompts(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = () => {
    const h = JSON.parse(localStorage.getItem('prompt_history') || '[]');
    setHistoryItems(h);
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = async () => {
     try {
       await logout();
       setView('main');
     } catch (e) {
       console.error(e);
     }
  };

  const handleCopyText = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeletePrompt = async (id?: string) => {
    if (!id) return;
    if (user?.isSandbox) {
      const sandboxPrompts = JSON.parse(localStorage.getItem('sandbox_saved_prompts') || '[]');
      const updated = sandboxPrompts.filter((p: any) => p.id !== id);
      localStorage.setItem('sandbox_saved_prompts', JSON.stringify(updated));
      setPrompts(updated);
      setSelectedItem(null);
      return;
    }
    if (!db) return;
    try {
      await deleteDoc(doc(db, "prompts", id));
      setPrompts(prev => prev.filter(p => p.id !== id));
      setSelectedItem(null);
    } catch (err) {
      console.error("Failed to delete prompt:", err);
    }
  };

  const renderContent = () => {
    if (view === 'saved') {
       return (
         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <button onClick={() => setView('main')} className="flex items-center gap-2 text-text-soft hover:text-[var(--text-main)] mb-4 cursor-pointer">
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display font-bold">Saved Prompts</h3>
              <span className="text-xs text-text-soft bg-glass-surface px-3 py-1 rounded-full border border-glass-border">
                {prompts.length} {prompts.length === 1 ? 'Prompt' : 'Prompts'}
              </span>
            </div>
            {loading ? <p className="text-text-soft">Loading...</p> : (
              prompts.length === 0 ? <p className="text-text-soft">No saved prompts yet.</p> : (
                <div className="grid gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                  {prompts.map(p => {
                    const formattedDate = p.createdAtFormatted || (p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleString() : '');
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedItem({ id: p.id, title: p.title || 'Untitled Prompt', content: p.content, category: p.category, date: formattedDate, type: 'saved' })}
                        className="glass-panel p-5 cursor-pointer hover:border-primary-accent/50 transition-all hover:scale-[1.01] group relative"
                      >
                         <div className="flex items-start justify-between gap-4 mb-2">
                           <h4 className="font-semibold text-base group-hover:text-primary-accent transition-colors line-clamp-1">{p.title || 'Untitled Prompt'}</h4>
                           <div className="flex items-center gap-2 shrink-0">
                             <button
                               onClick={(e) => handleCopyText(p.content, e)}
                               title="Copy Prompt"
                               className="p-1.5 rounded-lg bg-glass-surface hover:bg-glass-border text-text-soft hover:text-[var(--text-main)] transition-colors"
                             >
                               <Copy className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                         <p className="text-xs text-text-soft font-mono line-clamp-3 mb-3 leading-relaxed">{p.content}</p>
                         <div className="flex items-center justify-between text-[11px] text-text-soft/80 font-mono">
                           <span>{p.category || 'Generated'}</span>
                           <span>{formattedDate}</span>
                         </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
         </motion.div>
       );
    }

    if (view === 'history') {
      return (
         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <button onClick={() => setView('main')} className="flex items-center gap-2 text-text-soft hover:text-[var(--text-main)] mb-4 cursor-pointer">
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display font-bold">Recent History</h3>
              <span className="text-xs text-text-soft bg-glass-surface px-3 py-1 rounded-full border border-glass-border">
                {historyItems.length} {historyItems.length === 1 ? 'Session' : 'Sessions'}
              </span>
            </div>
            {historyItems.length === 0 ? (
              <div className="glass-panel p-8 text-center text-text-soft">
                No recent prompts generated locally.
              </div>
            ) : (
              <div className="grid gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {historyItems.map((h, i) => {
                  const dateStr = h.date ? new Date(h.date).toLocaleString() : '';
                  return (
                    <div 
                      key={i} 
                      onClick={() => setSelectedItem({ title: h.idea || 'Generated Prompt', content: h.prompt, date: dateStr, type: 'history' })}
                      className="glass-panel p-5 cursor-pointer hover:border-purple-500/50 transition-all hover:scale-[1.01] group relative"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="font-semibold text-base group-hover:text-purple-400 transition-colors line-clamp-1">{h.idea || 'Generated Prompt'}</h4>
                        <button
                          onClick={(e) => handleCopyText(h.prompt, e)}
                          title="Copy Prompt"
                          className="p-1.5 rounded-lg bg-glass-surface hover:bg-glass-border text-text-soft hover:text-[var(--text-main)] transition-colors shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-text-soft font-mono line-clamp-3 mb-3 leading-relaxed">{h.prompt}</p>
                      <span className="text-[10px] text-text-soft/80 font-mono">{dateStr}</span>
                    </div>
                  );
                })}
              </div>
            )}
         </motion.div>
      )
    }

    if (view === 'settings') {
      return (
         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <button onClick={() => setView('main')} className="flex items-center gap-2 text-text-soft hover:text-[var(--text-main)] mb-4">
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <h3 className="text-2xl font-display font-bold mb-6">Settings</h3>
            <div className="glass-panel p-6 space-y-6">
               <div>
                 <h4 className="font-medium mb-3">Theme</h4>
                 <div className="flex gap-4">
                   {['system', 'dark', 'light'].map(t => (
                     <button 
                       key={t}
                       onClick={() => setTheme(t)}
                       className={`px-4 py-2 rounded-lg text-sm transition-colors border ${theme === t ? 'border-primary-accent bg-primary-accent/10 text-[var(--text-main)]' : 'border-glass-border hover:bg-[var(--text-main)]/5 text-text-soft'}`}
                     >
                       <span className="capitalize">{t}</span>
                     </button>
                   ))}
                 </div>
               </div>
               <div className="border-t border-glass-border pt-6">
                 <h4 className="font-medium mb-3 text-text-soft">Account</h4>
                 <button onClick={handleSignOut} className="px-4 py-2 rounded-lg text-sm border border-glass-border text-text-soft hover:bg-[var(--text-main)]/5 transition-colors flex items-center gap-2">
                   <LogOut className="w-4 h-4" /> Sign Out
                 </button>
               </div>
            </div>
         </motion.div>
      )
    }

    if (view === 'subscription') {
      return (
         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <button onClick={() => setView('main')} className="flex items-center gap-2 text-text-soft hover:text-[var(--text-main)] mb-4">
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <h3 className="text-2xl font-display font-bold mb-6">Subscription</h3>
            <div className="glass-panel p-6 bg-gradient-to-br from-glass-surface to-secondary-accent/10 border-secondary-accent/30">
               <div className="w-12 h-12 rounded-full bg-secondary-accent/20 flex items-center justify-center mb-4">
                 <SparklesBackground />
               </div>
               <h4 className="text-xl font-bold mb-2">PromptGlow Free</h4>
               <p className="text-sm text-text-soft mb-6">You are currently on the free plan with basic limits.</p>
               
               <button className="w-full bg-secondary-accent hover:bg-secondary-accent/80 text-[var(--text-main)] rounded-xl py-3 font-semibold transition-all">
                 Pro Plan: ₹10 for next 10 prompts (Pay as you go)
               </button>
            </div>
         </motion.div>
      )
    }

    return (
       <motion.div 
         initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
         className="space-y-6"
       >
          <div className="glass-panel p-8 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
               <SparklesBackground />
             </div>
             {user?.photoURL ? (
               <img src={user.photoURL} alt={user.displayName || "User"} className="w-20 h-20 rounded-full border-2 border-primary-accent shrink-0" />
             ) : (
               <div className="w-20 h-20 rounded-full bg-primary-accent/20 flex items-center justify-center border-2 border-primary-accent shrink-0">
                 <User className="w-8 h-8 text-primary-accent" />
               </div>
             )}
             <div className="z-10 flex-1 min-w-0 space-y-1">
               <div className="flex items-center gap-3">
                 <h2 className="text-xl md:text-2xl font-display font-bold break-words">{user?.displayName || "Explorer"}</h2>
                 <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-accent/20 text-secondary-accent border border-secondary-accent/30 uppercase tracking-wider">
                   {userDoc?.plan || 'Free'} Plan
                 </span>
               </div>
               <p className="text-text-soft text-xs md:text-sm truncate">{user?.email}</p>
               {userDoc?.lastActiveAtFormatted && (
                 <p className="text-[11px] text-text-soft/80 font-mono pt-1">
                   Last active: {userDoc.lastActiveAtFormatted}
                 </p>
               )}
             </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-panel p-4 text-center">
              <span className="text-2xl font-bold font-mono text-primary-accent">{Math.max(userDoc?.totalPromptsGenerated || 0, prompts.length)}</span>
              <p className="text-[11px] text-text-soft uppercase tracking-wider font-medium mt-1">Prompts</p>
            </div>
            <div className="glass-panel p-4 text-center">
              <span className="text-2xl font-bold font-mono text-blue-400">{userDoc?.totalChats || 0}</span>
              <p className="text-[11px] text-text-soft uppercase tracking-wider font-medium mt-1">Chats</p>
            </div>
            <div className="glass-panel p-4 text-center">
              <span className="text-2xl font-bold font-mono text-secondary-accent">{userDoc?.totalVisionAnalyzed || 0}</span>
              <p className="text-[11px] text-text-soft uppercase tracking-wider font-medium mt-1">Vision Scans</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div onClick={() => setView('saved')} className="glass-panel p-6 flex items-center group cursor-pointer hover:border-blue-500/50 transition-colors">
               <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 mr-4 group-hover:scale-110 transition-transform">
                 <LayoutList className="w-6 h-6 text-blue-400" />
               </div>
               <div>
                  <h3 className="font-semibold text-lg">Saved Prompts</h3>
                  <p className="text-xs text-text-soft">Manage your collection</p>
               </div>
             </div>

             <div onClick={() => { loadHistory(); setView('history'); }} className="glass-panel p-6 flex items-center group cursor-pointer hover:border-purple-500/50 transition-colors">
               <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 mr-4 group-hover:scale-110 transition-transform">
                 <History className="w-6 h-6 text-purple-400" />
               </div>
               <div>
                  <h3 className="font-semibold text-lg">Recent History</h3>
                  <p className="text-xs text-text-soft">Your generated context</p>
               </div>
             </div>

             <div onClick={() => setView('subscription')} className="glass-panel p-6 flex items-center group cursor-pointer hover:border-amber-500/50 transition-colors">
               <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 mr-4 group-hover:scale-110 transition-transform">
                 <CreditCard className="w-6 h-6 text-amber-400" />
               </div>
               <div>
                  <h3 className="font-semibold text-lg">Subscription</h3>
                  <p className="text-xs text-text-soft">Manage your plan</p>
               </div>
             </div>

             <div onClick={() => setView('settings')} className="glass-panel p-6 flex items-center group cursor-pointer hover:border-gray-400/50 transition-colors">
               <div className="w-12 h-12 bg-gray-500/10 rounded-xl flex items-center justify-center border border-gray-500/20 mr-4 group-hover:scale-110 transition-transform">
                 <Settings className="w-6 h-6 text-gray-400" />
               </div>
               <div>
                  <h3 className="font-semibold text-lg">Settings</h3>
                  <p className="text-xs text-text-soft">App preferences</p>
               </div>
             </div>
          </div>
       </motion.div>
    );
  };

  return (
    <div className="p-6 md:p-12 max-w-2xl mx-auto h-full flex flex-col justify-center min-h-[80vh]">
      {!user ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-10 text-center flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-bg-surface rounded-full flex items-center justify-center border border-glass-border mb-6">
            <User className="w-10 h-10 text-text-soft" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-2">Welcome to PromptGlow</h2>
          <p className="text-text-soft mb-8">Sign in to save your prompts, sync your history, and access premium AI features.</p>
          
          <button 
            onClick={handleLogin}
            className="bg-white text-black font-semibold rounded-xl px-8 py-3 w-full hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mb-3 cursor-pointer"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
            Continue with Google
          </button>
          
          <button 
            onClick={loginAsGuest}
            className="bg-[var(--hover-bg)] text-[var(--text-main)] border border-glass-border font-semibold rounded-xl px-8 py-3 w-full hover:bg-[var(--hover-bg)]/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            Sign in as Sandbox Guest
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <div key={view} className="w-full">
            {renderContent()}
          </div>
        </AnimatePresence>
      )}

      {selectedItem && (
        <AnimatePresence>
          <div 
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel w-full max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden relative shadow-2xl border border-glass-border bg-[var(--bg-surface)]"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 mb-4 border-b border-glass-border">
                <div className="space-y-1 pr-6">
                  <h3 className="text-xl font-bold font-display break-words">{selectedItem.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-text-soft">
                    {selectedItem.category && (
                      <span className="px-2 py-0.5 rounded bg-primary-accent/10 text-primary-accent border border-primary-accent/20">
                        {selectedItem.category}
                      </span>
                    )}
                    {selectedItem.date && <span>{selectedItem.date}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-lg bg-glass-surface hover:bg-glass-border text-text-soft hover:text-[var(--text-main)] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 rounded-xl bg-black/40 border border-glass-border font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap select-text mb-6">
                <div className="markdown-body">
                  <ReactMarkdown>{selectedItem.content}</ReactMarkdown>
                </div>
              </div>

              {/* Footer / Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                {selectedItem.type === 'saved' && selectedItem.id ? (
                  <button
                    onClick={() => handleDeletePrompt(selectedItem.id)}
                    className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-xs md:text-sm font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Prompt
                  </button>
                ) : <div />}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCopyText(selectedItem.content)}
                    className="px-5 py-2.5 rounded-xl bg-primary-accent hover:bg-primary-accent/90 text-white font-semibold transition-all shadow-lg flex items-center gap-2 text-xs md:text-sm cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

function SparklesBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary-accent w-full h-full">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  );
}
