import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { TOKENS } from '../theme/tokens';
import { Mic, MicOff, Sparkles } from 'lucide-react-native';

export const VoiceScreen = ({ navigation }: any) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setTranscript("Design a responsive dark-mode landing page with floating neon glassmorphic cards and interactive prompt builder.");
    }
  };

  const handleRefine = () => {
    navigation.navigate('Glow', { initialIdea: transcript });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Composer</Text>
        <Text style={styles.subtitle}>
          Speak your raw idea aloud. We'll capture it and refine it into a perfect prompt.
        </Text>
      </View>

      {/* Mic Button Circle */}
      <View style={styles.micWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.micCircle, isListening && styles.micCircleActive]}
          onPress={toggleListening}
        >
          {isListening ? (
            <Mic color="#22c55e" size={48} />
          ) : (
            <MicOff color={TOKENS.colors.textSoft} size={48} />
          )}
        </TouchableOpacity>
      </View>

      {/* Transcript Panel */}
      <GlassCard style={styles.transcriptCard}>
        <Text style={styles.transcriptLabel}>Live Speech Transcript</Text>
        <TextInput
          style={styles.transcriptInput}
          placeholder={isListening ? "Listening..." : "Tap the microphone to start speaking..."}
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          value={transcript}
          onChangeText={setTranscript}
          multiline
        />
      </GlassCard>

      {/* Refine Button */}
      {transcript.trim() ? (
        <TouchableOpacity style={styles.refineBtn} onPress={handleRefine}>
          <Text style={styles.refineBtnText}>Refine This Prompt</Text>
          <Sparkles color="#FFFFFF" size={18} />
        </TouchableOpacity>
      ) : null}

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
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: TOKENS.colors.textMain,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.colors.textSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  micWrapper: {
    marginBottom: 32,
  },
  micCircle: {
    width: 120,
    height: 120,
    borderRadius: TOKENS.borderRadius.full,
    backgroundColor: TOKENS.colors.glassSurface,
    borderWidth: 2,
    borderColor: TOKENS.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micCircleActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  transcriptCard: {
    width: '100%',
    padding: 18,
    marginBottom: 24,
    minHeight: 160,
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.colors.textSoft,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transcriptInput: {
    color: TOKENS.colors.textMain,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  refineBtn: {
    width: '100%',
    backgroundColor: TOKENS.colors.primaryAccent,
    borderRadius: TOKENS.borderRadius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...TOKENS.shadows.pinkGlow,
  },
  refineBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
