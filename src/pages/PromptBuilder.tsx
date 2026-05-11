import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ArrowRight, Sparkles, Copy, CheckCircle2, ChevronRight, Save, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getGemini } from '../lib/gemini';
import { Type } from '@google/genai';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/utils';

type Question = {
  question: string;
  options: string[];
};

enum Phase {
  INIT,
  ANALYZING,
  QUESTION,
  GENERATING,
  RESULT
}

export function PromptBuilder() {
  const location = useLocation();
  const [phase, setPhase] = useState<Phase>(Phase.INIT);
  const [initialIdea, setInitialIdea] = useState(location.state?.idea || "");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{q: string, a: string}[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const stepsToGo = 3 - answers.length; // We want 3 Adaptive Questions minimum

  useEffect(() => {
    if (phase === Phase.RESULT && finalPrompt) {
      const history = JSON.parse(localStorage.getItem('prompt_history') || '[]');
      if (history.length === 0 || history[0].prompt !== finalPrompt) {
        history.unshift({ idea: initialIdea, prompt: finalPrompt, date: new Date().toISOString() });
        localStorage.setItem('prompt_history', JSON.stringify(history.slice(0, 20)));
      }
    }
  }, [phase, finalPrompt, initialIdea]);

  const requestNextQuestion = async (currentAnswers: {q: string, a: string}[]) => {
    setPhase(Phase.ANALYZING);
    try {
      const ai = getGemini();
      
      const historyStr = currentAnswers.map(ans => `Q: ${ans.q}\nA: ${ans.a}`).join('\n\n');
      
      const prompt = `You are an expert Prompt Engineer AI Copilot. 
The user wants to write a highly optimized prompt starting from this vague idea: "${initialIdea}"

They have already provided these clarifications:
${historyStr}

Please generate ONE multiple-choice question to further clarify their intent, format, constraints, or tone. The goal is to build the ultimate prompt.
Provide 3-5 distinct options for the question.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["question", "options"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      setCurrentQuestion(data);
      setPhase(Phase.QUESTION);
      
    } catch (err) {
      console.error(err);
      // Fallback
      setPhase(Phase.INIT);
    }
  };

  const generateFinalPrompt = async (currentAnswers: {q: string, a: string}[]) => {
    setPhase(Phase.GENERATING);
    try {
      const ai = getGemini();
      const historyStr = currentAnswers.map(ans => `Q: ${ans.q}\nA: ${ans.a}`).join('\n\n');
      
      const prompt = `You are a world-class prompt engineer. Write an extremely high quality, detailed prompt based on this initial idea and clarification context:
Initial idea: "${initialIdea}"
Context:
${historyStr}

The output Must strictly only be the generated Prompt Text itself.
Use roles, task descriptions, contexts, constraints, and format requirements as needed to make it world class.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setFinalPrompt(response.text || "Failed to generate prompt.");
      setPhase(Phase.RESULT);
    } catch (err) {
      console.error(err);
      setPhase(Phase.INIT);
    }
  };

  const startRefinement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialIdea.trim()) return;
    requestNextQuestion([]);
  };

  const handleAnswerSelect = (option: string) => {
    if (!currentQuestion) return;
    const newAnswers = [...answers, { q: currentQuestion.question, a: option }];
    setAnswers(newAnswers);
    
    if (newAnswers.length >= 3) {
      generateFinalPrompt(newAnswers);
    } else {
      requestNextQuestion(newAnswers);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!auth.currentUser || saved) return;
    try {
      await addDoc(collection(db, "prompts"), {
        userId: auth.currentUser.uid,
        title: initialIdea.substring(0, 90) || "Untitled Prompt",
        content: finalPrompt.substring(0, 9900),
        category: "Generated",
        createdAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "prompts");
      console.error(err);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-3xl mx-auto min-h-screen flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {phase === Phase.INIT && (
          <motion.div 
            key="init"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
          >
            <div className="mb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-accent/10 border border-primary-accent/30 mx-auto flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-primary-accent" />
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 neon-text break-words">PromptGlow Mode</h1>
              <p className="text-text-soft">Enter your raw, unpolished idea. We'll turn it into gold.</p>
            </div>
            
            <form onSubmit={startRefinement} className="relative">
              <div className="glass-panel p-2 flex items-center">
                <input 
                  autoFocus
                  type="text" 
                  value={initialIdea}
                  onChange={e => setInitialIdea(e.target.value)}
                  placeholder="e.g. Write a cold email..."
                  className="flex-1 min-w-0 w-full bg-transparent border-none text-[var(--text-main)] px-4 py-3 outline-none placeholder:text-[var(--text-main)]/30 text-sm sm:text-base"
                />
                <button 
                  type="submit"
                  disabled={!initialIdea.trim()}
                  className="bg-primary-accent hover:bg-primary-accent/80 text-white rounded-xl px-4 sm:px-6 py-3 font-semibold transition-all shadow-[0_0_15px_rgba(255,0,122,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                >
                  <span className="hidden sm:inline">Glow</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {(phase === Phase.ANALYZING || phase === Phase.GENERATING) && (
          <motion.div 
            key="analyzing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 bg-primary-accent/20 rounded-full animate-ping" />
              <div className="absolute inset-2 bg-secondary-accent/40 rounded-full animate-pulse" />
              <div className="absolute inset-4 glass-panel flex items-center justify-center rounded-full z-10">
                <Brain className="w-8 h-8 text-[var(--text-main)] animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-display font-semibold mb-2">
              {phase === Phase.ANALYZING ? "Analyzing context..." : "Crafting your ultimate prompt..."}
            </h2>
            <p className="text-text-soft">
               {phase === Phase.ANALYZING ? "Adapting neural pathways" : "Synchronizing intent and constraints"}
            </p>
          </motion.div>
        )}

        {phase === Phase.QUESTION && currentQuestion && (
          <motion.div 
            key="question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            className="w-full"
          >
            <div className="flex items-center gap-3 mb-8 text-sm text-text-soft uppercase tracking-wider font-semibold">
              <div className="h-[2px] w-8 bg-primary-accent rounded-full" />
              Question {answers.length + 1} of 3
            </div>
            
            <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight mb-8">
              {currentQuestion.question}
            </h2>
            
            <div className="space-y-3">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswerSelect(opt)}
                  className="w-full text-left p-5 glass-panel hover:bg-white/5 border border-glass-border hover:border-primary-accent/40 transition-all group flex justify-between items-center"
                >
                  <span className="text-lg">{opt}</span>
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:text-primary-accent transition-all transform group-hover:translate-x-2" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {phase === Phase.RESULT && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full py-8"
          >
             <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">Prompt Generated</h2>
                <p className="text-text-soft text-sm">Ready to use in any LLM.</p>
              </div>
            </div>

            <div className="relative glass-panel p-6 pt-12 mb-6 font-mono text-sm leading-relaxed text-[var(--text-main)] whitespace-pre-wrap max-h-[50vh] overflow-y-auto custom-scrollbar">
              <button 
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-sans text-text-soft hover:text-[var(--text-main)]"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400"/> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              {finalPrompt}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-text-soft text-sm font-medium mr-1">Open with:</span>
                <a 
                  href={`https://chatgpt.com/?q=${encodeURIComponent(finalPrompt)}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="glass-panel px-3 py-2 flex items-center gap-1.5 hover:bg-white/10 transition-colors text-sm rounded-xl"
                >
                   <ExternalLink className="w-3.5 h-3.5 text-text-soft" /> ChatGPT
                </a>
                <a 
                  href={`https://claude.ai/new?q=${encodeURIComponent(finalPrompt)}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="glass-panel px-3 py-2 flex items-center gap-1.5 hover:bg-white/10 transition-colors text-sm rounded-xl"
                >
                   <ExternalLink className="w-3.5 h-3.5 text-text-soft" /> Claude
                </a>
                <a 
                  href="https://gemini.google.com/app" 
                  target="_blank" 
                  rel="noreferrer" 
                  onClick={(e) => { handleCopy(); }} 
                  className="glass-panel px-3 py-2 flex items-center gap-1.5 hover:bg-white/10 transition-colors text-sm rounded-xl" 
                  title="Copies prompt to clipboard and opens Gemini"
                >
                   <ExternalLink className="w-3.5 h-3.5 text-text-soft" /> Gemini
                </a>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {auth.currentUser && (
                  <button 
                    onClick={handleSave}
                    disabled={saved}
                    className="glass-panel px-4 py-2 flex items-center justify-center gap-2 hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50 text-sm rounded-xl flex-1 sm:flex-none"
                  >
                    {saved ? <CheckCircle2 className="w-4 h-4 text-green-400"/> : <Save className="w-4 h-4" />}
                    {saved ? "Saved" : "Save Prompt"}
                  </button>
                )}
                <button 
                  onClick={() => {
                    setPhase(Phase.INIT);
                    setInitialIdea("");
                    setAnswers([]);
                    setFinalPrompt("");
                    setSaved(false);
                    setCopied(false);
                  }}
                  className="text-text-soft hover:text-[var(--text-main)] px-2 py-2 text-sm font-medium transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
