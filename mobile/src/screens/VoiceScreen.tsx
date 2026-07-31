import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { Mic, MicOff, Sparkles } from 'lucide-react-native';

export const VoiceScreen = ({ navigation }: any) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setTranscript("Design an ultra-modern dark mode landing page for an AI agent platform with magenta glowing glass cards.");
    } else {
      setIsRecording(true);
      setTranscript("Listening... Speak your prompt idea clearly.");
    }
  };

  const handleSendToGlow = () => {
    if (!transcript || isRecording) return;
    navigation.navigate('Glow', { initialIdea: transcript });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Voice Input Mode</Text>
      <Text style={styles.subtitle}>Speak your prompt concepts naturally to auto-generate blueprints.</Text>

      <GlassCard style={styles.micCard}>
        <TouchableOpacity
          style={[styles.micCircle, isRecording && styles.micCircleActive]}
          onPress={toggleRecording}
        >
          {isRecording ? <MicOff color="#ffffff" size={40} /> : <Mic color="#ffffff" size={40} />}
        </TouchableOpacity>

        <Text style={styles.statusText}>
          {isRecording ? "Recording Live Audio..." : "Tap Microphone to Speak"}
        </Text>
      </GlassCard>

      {/* Live Transcript Display */}
      {transcript ? (
        <GlassCard style={styles.card} borderColor="rgba(16, 185, 129, 0.4)">
          <Text style={styles.transcriptLabel}>Live Speech Transcript</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>

          {!isRecording && (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendToGlow}>
              <Sparkles color="#ffffff" size={16} />
              <Text style={styles.sendBtnText}>Send to Prompt Architect (Glow)</Text>
            </TouchableOpacity>
          )}
        </GlassCard>
      ) : null}
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
    marginBottom: 20,
  },
  micCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  micCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  micCircleActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  card: {
    marginBottom: 16,
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 6,
  },
  transcriptText: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 20,
    marginBottom: 14,
  },
  sendBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});
