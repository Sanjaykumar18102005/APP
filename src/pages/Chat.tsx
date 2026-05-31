import { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { getApiUrl } from '../lib/utils';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello! I am your AI assistant in PromptGlow. You can chat with me normally here, brainstorm ideas, or ask for coding help!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages,
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', content: data.text || "Error: Empty response" }]);
      
    } catch (err: any) {
      console.error("Chat Error:", err);
      let errorMessage = `AI Error: ${err.message || 'Unknown server error.'}`;
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen md:h-screen pt-4 md:py-8 px-4 max-w-4xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
          <Sparkles className="w-5 h-5 text-blue-400" />
        </div>
        <div>
           <h1 className="text-2xl font-display font-bold">Workspace Chat</h1>
        </div>
      </div>

      <div className="flex-1 glass-panel overflow-hidden flex flex-col relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i}
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 border ${
                  msg.role === 'user' ? 'bg-bg-surface border-white/10' : 'bg-primary-accent/20 border-primary-accent/30'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-text-soft" /> : <Sparkles className="w-4 h-4 text-primary-accent" />}
                </div>
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' ? 'bg-bg-surface border border-glass-border text-[var(--text-main)]' : 'bg-primary-accent/10 border border-primary-accent/20 text-[var(--text-main)]'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  ) : (
                    <div className="markdown-body prose prose-slate dark:prose-invert prose-p:leading-relaxed max-w-none text-sm prose-a:text-primary-accent">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-primary-accent/20 border border-primary-accent/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary-accent" />
                 </div>
                 <div className="p-4 rounded-2xl bg-primary-accent/5 border border-primary-accent/10 flex items-center gap-1.5 h-[52px]">
                    <div className="w-1.5 h-1.5 bg-primary-accent/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary-accent/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary-accent/60 rounded-full animate-bounce"></div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 bg-bg-surface/80 backdrop-blur-md border-t border-glass-border">
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full bg-[var(--hover-bg)] border border-glass-border rounded-xl px-4 py-4 pr-12 outline-none focus:border-primary-accent/50 transition-colors placeholder:text-text-soft text-sm text-[var(--text-main)]"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center bg-primary-accent text-white rounded-lg hover:bg-primary-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 ml-[-2px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
