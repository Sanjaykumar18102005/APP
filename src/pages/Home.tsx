import { Sparkles, Image, Mic, PenTool, ArrowRight, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

export function Home() {
  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto h-full flex flex-col">
      <header className="mb-12 mt-4 md:mt-0">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-display font-bold mb-4 neon-text"
        >
          PromptGlow
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-text-soft text-lg md:text-xl font-light max-w-lg"
        >
          Your AI command center. <br className="hidden md:block"/>
          Transform abstract ideas into perfect prompts.
        </motion.p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/builder">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-panel p-6 flex flex-col h-full bg-gradient-to-br from-glass-surface to-primary-accent/10 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-primary-accent/20 flex items-center justify-center mb-6 border border-primary-accent/30 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-primary-accent" />
            </div>
            <h2 className="text-2xl font-display font-semibold mb-2">Refine Prompt</h2>
            <p className="text-text-soft font-light text-sm mb-6 flex-1">
              Start with a vague idea and let our AI guide you through an adaptive branching process to create a world-class prompt.
            </p>
            <div className="flex items-center text-primary-accent text-sm font-medium">
              Start Building <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </Link>

        <Link to="/vision">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-panel p-6 flex flex-col h-full bg-gradient-to-br from-glass-surface to-secondary-accent/10 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-secondary-accent/20 flex items-center justify-center mb-6 border border-secondary-accent/30 group-hover:scale-110 transition-transform">
              <Image className="w-6 h-6 text-secondary-accent" />
            </div>
            <h2 className="text-2xl font-display font-semibold mb-2">Reverse Engineer Image</h2>
            <p className="text-text-soft font-light text-sm mb-6 flex-1">
              Upload an image and we'll analyze it using Gemini Vision to generate the exact Midjourney or Stable Diffusion prompt.
            </p>
            <div className="flex items-center text-secondary-accent text-sm font-medium">
              Try Vision <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </Link>
        
        <Link to="/voice">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-panel p-6 flex items-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mr-4 border border-green-500/30">
              <Mic className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold">Voice Prompting</h3>
              <p className="text-xs text-text-soft">Draft prompts by talking aloud</p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-soft group-hover:translate-x-1 transition-transform" />
          </motion.div>
        </Link>
        <Link to="/chat">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-panel p-6 flex items-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-4 border border-blue-500/30">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold">Normal Chat mode</h3>
              <p className="text-xs text-text-soft">Direct AI assistant access</p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-soft group-hover:translate-x-1 transition-transform" />
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
