import { useState } from 'react';
import { Camera, Image as ImageIcon, UploadCloud, Sparkles, ExternalLink, Copy, CheckCircle2, Ratio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { getApiUrl, cleanOutput } from '../lib/utils';
import { useAuth } from '../lib/auth-context';
import { incrementUserStat, saveVisionScanToFirestore } from '../lib/user-service';

export function Vision() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number; ratio: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateRatio = (w: number, h: number): string => {
    if (!w || !h) return "16:9";
    const r = w / h;
    const standardRatios = [
      { name: "1:1", val: 1 },
      { name: "16:9", val: 16 / 9 },
      { name: "9:16", val: 9 / 16 },
      { name: "4:3", val: 4 / 3 },
      { name: "3:4", val: 3 / 4 },
      { name: "3:2", val: 3 / 2 },
      { name: "2:3", val: 2 / 3 },
      { name: "21:9", val: 21 / 9 },
    ];
    let closest = standardRatios[0];
    let minDiff = Math.abs(r - closest.val);
    for (const item of standardRatios) {
      const diff = Math.abs(r - item.val);
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }
    return closest.name;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setResult("");

      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const ratio = calculateRatio(w, h);
        setDimensions({ width: w, height: h, ratio });
      };
      img.src = objectUrl;
    }
  };

  const analyzeImage = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64EncodedString = base64data.split(',')[1];
        
        try {
          const response = await fetch(getApiUrl('/api/vision'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64EncodedString,
              mimeType: file.type,
              aspectRatio: dimensions?.ratio || "16:9",
              resolution: dimensions ? `${dimensions.width}x${dimensions.height}` : undefined
            })
          });

          if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            throw new Error(errJson.error || `Server returned status ${response.status}`);
          }

          const data = await response.json();
          const cleanedText = cleanOutput(data.text || "Could not analyze the image.");
          setResult(cleanedText);
          if (user?.uid) {
            incrementUserStat(user.uid, 'totalVisionAnalyzed').catch(console.warn);
            saveVisionScanToFirestore(user, dimensions?.ratio || "16:9", cleanedText).catch(console.warn);
          }
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
        <p className="text-text-soft">Upload an image. We'll extract its DNA, aspect ratio, and give you the prompt to recreate it.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="glass-panel p-2">
             <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-glass-border border-dashed rounded-xl cursor-pointer hover:bg-white/5 hover:border-secondary-accent/50 transition-colors relative overflow-hidden group">
                {preview ? (
                  <>
                    <img src={preview} alt="Upload preview" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-surface/80 to-transparent" />
                    {dimensions && (
                      <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-xs text-secondary-accent font-mono border border-secondary-accent/30 flex items-center gap-1.5 shadow-lg">
                        <Ratio className="w-3.5 h-3.5" />
                        <span>Ratio: <strong>{dimensions.ratio}</strong> ({dimensions.width}×{dimensions.height})</span>
                      </div>
                    )}
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
