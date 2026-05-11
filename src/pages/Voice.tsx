import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export function Voice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error(event.error);
      if (event.error === 'not-allowed') {
        setError("Microphone permission denied. Please allow microphone access.");
        setIsListening(false);
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setError("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRefine = () => {
     navigate('/builder', { state: { idea: transcript } });
  };

  return (
    <div className="p-6 md:p-12 max-w-3xl mx-auto min-h-[80vh] flex flex-col justify-center items-center text-center">
      <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 neon-text">Voice Composer</h1>
      <p className="text-text-soft mb-12">Speak your raw idea aloud. We'll capture it and refine it into a perfect prompt.</p>
      
      <div className="relative mb-12">
         {isListening && (
           <>
             <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
             <div className="absolute inset-2 bg-green-400/40 rounded-full animate-pulse" />
           </>
         )}
         
         <button 
           onClick={toggleListening}
           className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
             isListening 
               ? 'bg-green-500/20 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.4)]' 
               : 'bg-glass-surface border-glass-border hover:border-text-soft'
           }`}
         >
           {isListening ? (
             <Mic className="w-12 h-12 text-green-400" />
           ) : (
             <MicOff className="w-12 h-12 text-text-soft" />
           )}
         </button>
      </div>

      {error && (
        <div className="text-red-400 mb-6 bg-red-400/10 px-4 py-3 rounded-xl border border-red-400/20 text-sm">
          {error}
        </div>
      )}

      <div className="w-full min-h-[160px] glass-panel p-6 mb-8 text-left text-lg relative group overflow-hidden">
         {!transcript && !isListening && <span className="text-text-soft opacity-50">Tap the microphone to start speaking...</span>}
         {!transcript && isListening && <span className="text-text-soft opacity-50 animate-pulse">Listening...</span>}
         {transcript && <p className="text-[var(--text-main)] relative z-10 leading-relaxed max-h-[40vh] overflow-y-auto custom-scrollbar">{transcript}</p>}
         
         {isListening && (
            <div className="absolute bottom-4 right-4 flex gap-1 items-end h-4 opacity-50">
               <div className="w-1 bg-green-400/60 rounded-full animate-[pulse_1s_ease-in-out_infinite]" style={{ height: '40%' }} />
               <div className="w-1 bg-green-400/60 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" style={{ height: '80%' }} />
               <div className="w-1 bg-green-400/60 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" style={{ height: '60%' }} />
               <div className="w-1 bg-green-400/60 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" style={{ height: '100%' }} />
            </div>
         )}
      </div>

      <AnimatePresence>
         {transcript && !isListening && (
           <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0 }}
           >
             <button 
               onClick={handleRefine}
               className="bg-primary-accent hover:bg-primary-accent/80 text-[var(--text-main)] rounded-xl px-8 py-4 font-semibold transition-all shadow-[0_0_15px_rgba(255,0,122,0.5)] flex items-center gap-2"
             >
               Refine This Prompt <Sparkles className="w-5 h-5" />
             </button>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
