import { useState } from 'react';
import { Camera, Image as ImageIcon, UploadCloud, Sparkles, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getGemini } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';

export function Vision() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult("");
    }
  };

  const analyzeImage = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        // Split data:image/jpeg;base64,...
        const base64EncodedString = base64data.split(',')[1];
        
        try {
          const ai = getGemini();
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64EncodedString
                  }
                },
                {
                  text: `Analyze this image in deep technical detail. Provide a breakdown of its visual components, lighting, art style, and camera settings (if it looks like a photo). Then, provide two production-ready prompts that could recreate it: 1) A Midjourney prompt, and 2) A Stable Diffusion prompt. Output in cleanly formatted markdown.`
                }
              ]
            }
          });
          
          setResult(response.text || "Could not analyze the image.");
        } catch (err: any) {
          console.error("Vision Error:", err);
          setResult(`Error contacting AI server: ${err.message || 'Unknown Error'}`);
        } finally {
          setIsAnalyzing(false);
        }
      };
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen py-12 md:py-24">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold mb-4 neon-text flex items-center gap-3">
          <Camera className="w-8 h-8 text-secondary-accent" />
          Vision Reverse Engineering
        </h1>
        <p className="text-text-soft">Upload an image. We'll extract its DNA and give you the prompt to recreate it.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="glass-panel p-2">
             <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-glass-border border-dashed rounded-xl cursor-pointer hover:bg-white/5 hover:border-secondary-accent/50 transition-colors relative overflow-hidden group">
                {preview ? (
                  <>
                    <img src={preview} alt="Upload preview" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-surface/80 to-transparent" />
                    <div className="absolute bottom-4 flex items-center gap-2 text-white font-medium z-10 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full">
                      <UploadCloud className="w-4 h-4" /> Change Image
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-12 h-12 text-text-soft mb-4 group-hover:text-secondary-accent transition-colors" />
                    <p className="mb-2 text-sm text-text-soft font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-text-soft/60">SVG, PNG, JPG or GIF</p>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
             </label>
          </div>

          <button 
            onClick={analyzeImage}
            disabled={!file || isAnalyzing}
            className="w-full bg-secondary-accent hover:bg-secondary-accent/80 text-[var(--text-main)] rounded-xl px-6 py-4 font-semibold transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Extracting DNA...
              </>
            ) : (
              <>
                Analyze Image <Sparkles className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        <div className="glass-panel p-6 h-full min-h-[400px] max-h-[80vh] overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {!result && !isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center h-full text-text-soft"
              >
                <div className="w-16 h-16 rounded-full bg-glass-surface flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 opacity-50" />
                </div>
                <p>Output will appear here</p>
              </motion.div>
            )}
            
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col h-full"
              >
                <div className="flex-1 overflow-auto custom-scrollbar markdown-body prose prose-slate dark:prose-invert prose-p:text-[var(--text-soft)] prose-headings:text-[var(--text-main)] prose-a:text-secondary-accent max-w-none text-sm mb-4">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
                
                <div className="pt-4 border-t border-glass-border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-text-soft text-sm font-medium mr-1">Open with:</span>
                      <a 
                        href={`https://chatgpt.com/?q=${encodeURIComponent(result)}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="glass-panel px-3 py-2 flex items-center gap-1.5 hover:bg-[var(--hover-bg)] transition-colors text-sm rounded-xl"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-text-soft" /> ChatGPT
                      </a>
                      <a 
                        href={`https://claude.ai/new?q=${encodeURIComponent(result)}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="glass-panel px-3 py-2 flex items-center gap-1.5 hover:bg-[var(--hover-bg)] transition-colors text-sm rounded-xl"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-text-soft" /> Claude
                      </a>
                      <a 
                        href="https://gemini.google.com/app" 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={() => { navigator.clipboard.writeText(result); }} 
                        className="glass-panel px-3 py-2 flex items-center gap-1.5 hover:bg-[var(--hover-bg)] transition-colors text-sm rounded-xl" 
                        title="Copies prompt to clipboard and opens Gemini"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-text-soft" /> Gemini
                      </a>
                    </div>
                    
                    <button 
                      onClick={handleCopy}
                      className="glass-panel px-4 py-2 flex items-center justify-center gap-2 hover:bg-[var(--hover-bg)] transition-colors text-sm rounded-xl flex-1 sm:flex-none"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-400"/> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy Prompt"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
