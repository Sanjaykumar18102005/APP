import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { MarkdownView } from '../components/MarkdownView';
import { getApiUrl } from '../config/api';
import { Sparkles, Check, Copy, RefreshCw } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { incrementUserStat, savePromptHistoryToFirestore } from '../lib/user-service';

export const GlowScreen = ({ route }: any) => {
  const initialIdeaParam = route?.params?.initialIdea || '';
  const [idea, setIdea] = useState(initialIdeaParam);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [finalPrompt, setFinalPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialIdeaParam) {
      setIdea(initialIdeaParam);
    }
  }, [initialIdeaParam]);

  const handleStartWizard = async () => {
    if (!idea.trim()) {
      Alert.alert("Input Required", "Please enter an initial idea to build a prompt.");
      return;
    }
    setLoading(true);
    setAnswers([]);
    setFinalPrompt('');
    setCurrentQuestion(null);

    try {
      const res = await fetch(getApiUrl('/api/prompt-builder/question'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialIdea: idea, answers: [] })
      });
      const data = await res.json();
      setCurrentQuestion(data);
    } catch (err: any) {
      console.warn("Glow question fetch error:", err);
      setCurrentQuestion({
        question: "What primary tone and strategic style should the prompt adopt?",
        options: ["Highly professional & corporate", "Creative & story-driven", "Technical & line-by-line", "Ultra-concise bullet points"]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (option: string) => {
    const updatedAnswers = [...answers, { q: currentQuestion.question, a: option }];
    setAnswers(updatedAnswers);
    setLoading(true);

    if (updatedAnswers.length >= 3) {
      // Synthesize Final Prompt
      try {
        const res = await fetch(getApiUrl('/api/prompt-builder/final-prompt'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initialIdea: idea, answers: updatedAnswers })
        });
        const data = await res.json();
        const synthesized = data.prompt || data.text || "Prompt template generated successfully.";
        setFinalPrompt(synthesized);
        setCurrentQuestion(null);

        // Firestore sync
        incrementUserStat('sandbox_guest_user', 'totalPromptsGenerated').catch(console.warn);
      } catch (err: any) {
        console.warn("Final prompt fetch error:", err);
        setFinalPrompt(`# PROMPT TEMPLATE: EXPERT CORE ARCHITECT 🚀\n\n## Role:\nYou are a world-class prompt engineer assigned to: "${idea}"\n\n## Context:\nSelected option: ${option}\n\n## Protocol:\nProvide a clean, structured solution with full code and actionable steps.`);
      } finally {
        setLoading(false);
      }
    } else {
      // Next Question
      try {
        const res = await fetch(getApiUrl('/api/prompt-builder/question'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initialIdea: idea, answers: updatedAnswers })
        });
        const data = await res.json();
        setCurrentQuestion(data);
      } catch (err) {
        setCurrentQuestion({
          question: "What length or format constraint is required?",
          options: ["Markdown with bullet points", "Raw clean code block only", "Deep comprehensive walkthrough guide"]
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopyPrompt = async () => {
    await Clipboard.setStringAsync(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Prompt Architect (Glow)</Text>
      <Text style={styles.subtitle}>Refine your idea through 3 dynamic AI questions.</Text>

      {/* Idea Input */}
      <GlassCard style={styles.card}>
        <Text style={styles.label}>Initial Idea / Core Concept</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Design a landing page for an organic food startup..."
          placeholderTextColor="#6b7280"
          value={idea}
          onChangeText={setIdea}
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={handleStartWizard} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Sparkles color="#ffffff" size={18} />
              <Text style={styles.buttonText}>Generate Clarifying Questions</Text>
            </>
          )}
        </TouchableOpacity>
      </GlassCard>

      {/* Question Steps */}
      {currentQuestion && (
        <GlassCard style={styles.card} borderColor="rgba(168, 85, 247, 0.4)">
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>QUESTION {answers.length + 1} OF 3</Text>
          </View>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          
          <View style={styles.optionsList}>
            {(currentQuestion.options || []).map((opt: string, idx: number) => (
              <TouchableOpacity key={idx} style={styles.optionButton} onPress={() => handleSelectOption(opt)}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>
      )}

      {/* Final Prompt Output */}
      {finalPrompt ? (
        <GlassCard style={styles.card} borderColor="rgba(236, 72, 153, 0.5)">
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Generated Master Prompt</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyPrompt}>
              {copied ? <Check color="#10b981" size={16} /> : <Copy color="#ffffff" size={16} />}
              <Text style={styles.copyText}>{copied ? "Copied!" : "Copy"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.markdownBox}>
            <MarkdownView content={finalPrompt} />
          </View>
        </GlassCard>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#ec4899',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#a855f7',
  },
  questionText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 14,
    lineHeight: 22,
  },
  optionsList: {
    gap: 8,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionText: {
    fontSize: 13,
    color: '#e5e7eb',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 4,
  },
  markdownBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
