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
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../lib/auth-context';
import { getApiUrl, cleanOutput } from '../lib/utils';
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
import { savePromptHistoryToFirestore, incrementUserStat } from '../lib/user-service';

enum Phase {
  INIT,
  ANALYZING,
  QUESTION,
  GENERATING,
  RESULT
}

export const GlowScreen = ({ route }: any) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const initialIdeaParam = route?.params?.initialIdea || '';
  const [phase, setPhase] = useState<Phase>(Phase.INIT);
  const [initialIdea, setInitialIdea] = useState(initialIdeaParam);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<{ q: string; a: string }[]>([]);
  const [finalPrompt, setFinalPrompt] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialIdeaParam) {
      setInitialIdea(initialIdeaParam);
    }
  }, [initialIdeaParam]);

  const requestNextQuestion = async (currentAnswers: { q: string; a: string }[]) => {
    setPhase(Phase.ANALYZING);
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
    try {
      const response = await fetch(getApiUrl('/api/prompt-builder/final-prompt'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialIdea, answers: currentAnswers })
      });
      const data = await response.json();
      const cleaned = cleanOutput(data.text || data.prompt || "Failed to generate prompt.");
      setFinalPrompt(cleaned);
      setPhase(Phase.RESULT);

      if (user?.uid) {
        savePromptHistoryToFirestore(user, initialIdea, cleaned, currentAnswers).catch(console.warn);
        incrementUserStat(user.uid, 'totalPromptsGenerated').catch(console.warn);
      }
    } catch (err: any) {
      const fallback = cleanOutput(
        `# EXPERT PROMPT SPECIFICATION 🚀\n\n## Objective:\nCreate an optimized solution for: "${initialIdea}"\n\n## System Architecture & Constraints:\n- Style: High-fidelity expert output\n- Protocol: Strict markdown with detailed breakdown and examples.`
      );
      setFinalPrompt(fallback);
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
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.bgNebula }]} 
      contentContainerStyle={styles.content}
    >
      {phase === Phase.INIT && (
        <View style={styles.initContainer}>
          <View style={styles.iconHeaderCircle}>
            <Brain color={colors.primaryAccent} size={32} />
          </View>
          <Text style={[styles.mainTitle, { color: colors.textMain }]}>PromptGlow Mode</Text>
          <Text style={[styles.mainSub, { color: colors.textSoft }]}>Enter your raw, unpolished idea. We'll turn it into gold.</Text>

          <GlassCard style={styles.inputBox} pinkGlow>
            <TextInput
              style={[styles.textInput, { color: colors.textMain }]}
              placeholder="e.g. Write a cold email..."
              placeholderTextColor={colors.textMuted}
              value={initialIdea}
              onChangeText={setInitialIdea}
              multiline
            />
            <TouchableOpacity 
              style={[styles.glowBtn, { backgroundColor: colors.primaryAccent }, !initialIdea.trim() && styles.disabledBtn]} 
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
          <ActivityIndicator size="large" color={colors.primaryAccent} style={{ marginBottom: 20 }} />
          <Text style={[styles.loadingTitle, { color: colors.textMain }]}>
            {phase === Phase.ANALYZING ? "Analyzing context..." : "Crafting your ultimate prompt..."}
          </Text>
          <Text style={[styles.loadingSub, { color: colors.textSoft }]}>
            {phase === Phase.ANALYZING ? "Adapting neural pathways" : "Synchronizing intent and constraints"}
          </Text>
        </View>
      )}

      {phase === Phase.QUESTION && currentQuestion && (
        <View style={styles.questionContainer}>
          <View style={styles.stepRow}>
            <View style={[styles.pinkLine, { backgroundColor: colors.primaryAccent }]} />
            <Text style={[styles.stepText, { color: colors.textSoft }]}>QUESTION {answers.length + 1} OF 3</Text>
          </View>

          <Text style={[styles.questionTitle, { color: colors.textMain }]}>{currentQuestion.question}</Text>

          <View style={styles.optionsStack}>
            {(currentQuestion.options || []).map((opt: string, i: number) => (
              <TouchableOpacity key={i} activeOpacity={0.7} onPress={() => handleAnswerSelect(opt)}>
                <GlassCard style={styles.optionCard}>
                  <Text style={[styles.optionText, { color: colors.textMain }]}>{opt}</Text>
                  <ChevronRight color={colors.primaryAccent} size={20} />
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
              <Text style={[styles.resultTitle, { color: colors.textMain }]}>Prompt Generated</Text>
              <Text style={[styles.resultSub, { color: colors.textSoft }]}>Ready to use in any LLM.</Text>
            </View>
          </View>

          <GlassCard style={styles.promptBox}>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              {copied ? <CheckCircle2 color="#4ade80" size={14} /> : <Copy color={colors.textSoft} size={14} />}
              <Text style={[styles.copyBtnText, { color: colors.textSoft }, copied && { color: '#4ade80' }]}>
                {copied ? "Copied" : "Copy"}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.promptText, { color: colors.textMain }]}>{finalPrompt}</Text>
          </GlassCard>

          {/* External Links */}
          <Text style={[styles.openWithLabel, { color: colors.textSoft }]}>Open with:</Text>
          <View style={styles.linkRow}>
            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => openUrl(`https://chatgpt.com/?q=${encodeURIComponent(finalPrompt)}`)}
            >
              <ExternalLink color={colors.textSoft} size={14} />
              <Text style={[styles.linkChipText, { color: colors.textMain }]}>ChatGPT</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => openUrl(`https://claude.ai/new?q=${encodeURIComponent(finalPrompt)}`)}
            >
              <ExternalLink color={colors.textSoft} size={14} />
              <Text style={[styles.linkChipText, { color: colors.textMain }]}>Claude</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => { handleCopy(); openUrl("https://gemini.google.com/app"); }}
            >
              <ExternalLink color={colors.textSoft} size={14} />
              <Text style={[styles.linkChipText, { color: colors.textMain }]}>Gemini</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionFooter}>
            <TouchableOpacity 
              style={styles.saveBtn}
              onPress={() => setSaved(true)}
              disabled={saved}
            >
              <Save color={saved ? "#4ade80" : colors.textMain} size={16} />
              <Text style={[styles.saveBtnText, { color: colors.textMain }]}>{saved ? "Saved" : "Save Prompt"}</Text>
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
              <Text style={[styles.startOverText, { color: colors.textSoft }]}>Start Over</Text>
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
    borderRadius: 32,
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
    marginBottom: 8,
  },
  mainSub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
  },
  inputBox: {
    width: '100%',
    padding: 16,
  },
  textInput: {
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  glowBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  loadingSub: {
    fontSize: 14,
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
    borderRadius: 99,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
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
    borderRadius: 22,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  resultSub: {
    fontSize: 13,
  },
  promptBox: {
    padding: 18,
    marginBottom: 20,
  },
  copyBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  copyBtnText: {
    fontSize: 12,
  },
  promptText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  openWithLabel: {
    fontSize: 13,
    fontWeight: '600',
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  linkChipText: {
    fontSize: 13,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  startOverText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
