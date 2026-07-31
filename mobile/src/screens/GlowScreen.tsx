import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Linking 
} from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { TOKENS } from '../theme/tokens';
import { getApiUrl } from '../config/api';
import { 
  Brain, 
  Sparkles, 
  Copy, 
  CheckCircle2, 
  ChevronRight, 
  Save, 
  ExternalLink 
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

enum Phase {
  INIT,
  ANALYZING,
  QUESTION,
  GENERATING,
  RESULT
}

export const GlowScreen = ({ route }: any) => {
  const initialIdeaParam = route?.params?.initialIdea || '';
  const [phase, setPhase] = useState<Phase>(Phase.INIT);
  const [initialIdea, setInitialIdea] = useState(initialIdeaParam);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<{ q: string; a: string }[]>([]);
  const [finalPrompt, setFinalPrompt] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialIdeaParam) {
      setInitialIdea(initialIdeaParam);
    }
  }, [initialIdeaParam]);

  const requestNextQuestion = async (currentAnswers: { q: string; a: string }[]) => {
    setPhase(Phase.ANALYZING);
    setError(null);
    try {
      const response = await fetch(getApiUrl('/api/prompt-builder/question'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialIdea, answers: currentAnswers })
      });
      const data = await response.json();
      setCurrentQuestion(data);
      setPhase(Phase.QUESTION);
    } catch (err: any) {
      setCurrentQuestion({
        question: "What primary tone and strategic style should the prompt adopt?",
        options: [
          "Highly professional & corporate",
          "Creative & story-driven",
          "Technical & line-by-line",
          "Ultra-concise bullet points"
        ]
      });
      setPhase(Phase.QUESTION);
    }
  };

  const generateFinalPrompt = async (currentAnswers: { q: string; a: string }[]) => {
    setPhase(Phase.GENERATING);
    setError(null);
    try {
      const response = await fetch(getApiUrl('/api/prompt-builder/final-prompt'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialIdea, answers: currentAnswers })
      });
      const data = await response.json();
      setFinalPrompt(data.text || data.prompt || "Failed to generate prompt.");
      setPhase(Phase.RESULT);
    } catch (err: any) {
      setFinalPrompt(
        `# EXPERT PROMPT SPECIFICATION 🚀\n\n## Objective:\nCreate an optimized solution for: "${initialIdea}"\n\n## System Architecture & Constraints:\n- Style: High-fidelity expert output\n- Protocol: Strict markdown with detailed breakdown and examples.`
      );
      setPhase(Phase.RESULT);
    }
  };

  const startRefinement = () => {
    if (!initialIdea.trim()) return;
    setAnswers([]);
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

  const handleCopy = async () => {
    await Clipboard.setStringAsync(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(console.warn);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {phase === Phase.INIT && (
        <View style={styles.initContainer}>
          <View style={styles.iconHeaderCircle}>
            <Brain color={TOKENS.colors.primaryAccent} size={32} />
          </View>
          <Text style={styles.mainTitle}>PromptGlow Mode</Text>
          <Text style={styles.mainSub}>Enter your raw, unpolished idea. We'll turn it into gold.</Text>

          <GlassCard style={styles.inputBox} pinkGlow>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Write a cold email..."
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={initialIdea}
              onChangeText={setInitialIdea}
              multiline
            />
            <TouchableOpacity 
              style={[styles.glowBtn, !initialIdea.trim() && styles.disabledBtn]} 
              onPress={startRefinement}
              disabled={!initialIdea.trim()}
            >
              <Text style={styles.glowBtnText}>Glow</Text>
              <Sparkles color="#FFFFFF" size={18} />
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}

      {(phase === Phase.ANALYZING || phase === Phase.GENERATING) && (
        <View style={styles.loadingContainer}>
          <View style={styles.spinnerWrapper}>
            <ActivityIndicator size="large" color={TOKENS.colors.primaryAccent} />
          </View>
          <Text style={styles.loadingTitle}>
            {phase === Phase.ANALYZING ? "Analyzing context..." : "Crafting your ultimate prompt..."}
          </Text>
          <Text style={styles.loadingSub}>
            {phase === Phase.ANALYZING ? "Adapting neural pathways" : "Synchronizing intent and constraints"}
          </Text>
        </View>
      )}

      {phase === Phase.QUESTION && currentQuestion && (
        <View style={styles.questionContainer}>
          <View style={styles.stepRow}>
            <View style={styles.pinkLine} />
            <Text style={styles.stepText}>QUESTION {answers.length + 1} OF 3</Text>
          </View>

          <Text style={styles.questionTitle}>{currentQuestion.question}</Text>

          <View style={styles.optionsStack}>
            {(currentQuestion.options || []).map((opt: string, i: number) => (
              <TouchableOpacity key={i} activeOpacity={0.7} onPress={() => handleAnswerSelect(opt)}>
                <GlassCard style={styles.optionCard}>
                  <Text style={styles.optionText}>{opt}</Text>
                  <ChevronRight color={TOKENS.colors.primaryAccent} size={20} />
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {phase === Phase.RESULT && (
        <View style={styles.resultContainer}>
          <View style={styles.successHeader}>
            <View style={styles.checkCircle}>
              <CheckCircle2 color="#4ade80" size={22} />
            </View>
            <View>
              <Text style={styles.resultTitle}>Prompt Generated</Text>
              <Text style={styles.resultSub}>Ready to use in any LLM.</Text>
            </View>
          </View>

          <GlassCard style={styles.promptBox}>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              {copied ? <CheckCircle2 color="#4ade80" size={14} /> : <Copy color={TOKENS.colors.textSoft} size={14} />}
              <Text style={[styles.copyBtnText, copied && { color: '#4ade80' }]}>
                {copied ? "Copied" : "Copy"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.promptText}>{finalPrompt}</Text>
          </GlassCard>

          {/* External Links */}
          <Text style={styles.openWithLabel}>Open with:</Text>
          <View style={styles.linkRow}>
            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => openUrl(`https://chatgpt.com/?q=${encodeURIComponent(finalPrompt)}`)}
            >
              <ExternalLink color={TOKENS.colors.textSoft} size={14} />
              <Text style={styles.linkChipText}>ChatGPT</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => openUrl(`https://claude.ai/new?q=${encodeURIComponent(finalPrompt)}`)}
            >
              <ExternalLink color={TOKENS.colors.textSoft} size={14} />
              <Text style={styles.linkChipText}>Claude</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => { handleCopy(); openUrl("https://gemini.google.com/app"); }}
            >
              <ExternalLink color={TOKENS.colors.textSoft} size={14} />
              <Text style={styles.linkChipText}>Gemini</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionFooter}>
            <TouchableOpacity 
              style={styles.saveBtn}
              onPress={() => setSaved(true)}
              disabled={saved}
            >
              <Save color={saved ? "#4ade80" : TOKENS.colors.textMain} size={16} />
              <Text style={styles.saveBtnText}>{saved ? "Saved" : "Save Prompt"}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                setPhase(Phase.INIT);
                setInitialIdea("");
                setAnswers([]);
                setFinalPrompt("");
                setSaved(false);
              }}
            >
              <Text style={styles.startOverText}>Start Over</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.colors.bgNebula,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  initContainer: {
    alignItems: 'center',
  },
  iconHeaderCircle: {
    width: 64,
    height: 64,
    borderRadius: TOKENS.borderRadius.full,
    backgroundColor: 'rgba(255, 0, 122, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 122, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: TOKENS.colors.textMain,
    marginBottom: 8,
  },
  mainSub: {
    fontSize: 14,
    color: TOKENS.colors.textSoft,
    textAlign: 'center',
    marginBottom: 28,
  },
  inputBox: {
    width: '100%',
    padding: 16,
  },
  textInput: {
    color: TOKENS.colors.textMain,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  glowBtn: {
    backgroundColor: TOKENS.colors.primaryAccent,
    borderRadius: TOKENS.borderRadius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...TOKENS.shadows.pinkGlow,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  glowBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  spinnerWrapper: {
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TOKENS.colors.textMain,
    marginBottom: 8,
  },
  loadingSub: {
    fontSize: 14,
    color: TOKENS.colors.textSoft,
  },
  questionContainer: {
    width: '100%',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  pinkLine: {
    width: 32,
    height: 3,
    backgroundColor: TOKENS.colors.primaryAccent,
    borderRadius: 99,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: TOKENS.colors.textSoft,
    letterSpacing: 1,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TOKENS.colors.textMain,
    marginBottom: 24,
    lineHeight: 32,
  },
  optionsStack: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  optionText: {
    fontSize: 15,
    color: TOKENS.colors.textMain,
    flex: 1,
    paddingRight: 10,
  },
  resultContainer: {
    width: '100%',
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: TOKENS.borderRadius.full,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TOKENS.colors.textMain,
  },
  resultSub: {
    fontSize: 13,
    color: TOKENS.colors.textSoft,
  },
  promptBox: {
    padding: 18,
    marginBottom: 20,
    position: 'relative',
  },
  copyBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: TOKENS.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  copyBtnText: {
    fontSize: 12,
    color: TOKENS.colors.textSoft,
  },
  promptText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: TOKENS.colors.textMain,
    lineHeight: 20,
  },
  openWithLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TOKENS.colors.textSoft,
    marginBottom: 10,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: TOKENS.borderRadius.md,
    backgroundColor: TOKENS.colors.glassSurface,
    borderWidth: 1,
    borderColor: TOKENS.colors.glassBorder,
  },
  linkChipText: {
    fontSize: 13,
    color: TOKENS.colors.textMain,
  },
  actionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: TOKENS.borderRadius.md,
    backgroundColor: TOKENS.colors.glassSurface,
    borderWidth: 1,
    borderColor: TOKENS.colors.glassBorder,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.colors.textMain,
  },
  startOverText: {
    fontSize: 14,
    color: TOKENS.colors.textSoft,
    fontWeight: '600',
  },
});
