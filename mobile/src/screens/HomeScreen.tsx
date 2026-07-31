import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { Sparkles, Camera, Mic, MessageSquare, ArrowRight } from 'lucide-react-native';

export const HomeScreen = ({ navigation }: any) => {
  const [idea, setIdea] = useState('');

  const handleStartPrompting = () => {
    if (!idea.trim()) return;
    navigation.navigate('Glow', { initialIdea: idea });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Banner */}
      <GlassCard borderColor="rgba(236, 72, 153, 0.4)" style={styles.heroCard}>
        <View style={styles.badgeRow}>
          <Sparkles size={14} color="#ec4899" />
          <Text style={styles.badgeText}>AI PROMPT ARCHITECT</Text>
        </View>
        <Text style={styles.heroTitle}>Master Prompt Engineering with AI</Text>
        <Text style={styles.heroSub}>
          Transform raw ideas into high-fidelity AI prompts. Powered by your AWS Gemma 4 GPU model.
        </Text>
      </GlassCard>

      {/* Quick Input Launcher */}
      <GlassCard style={styles.inputCard}>
        <Text style={styles.inputLabel}>What do you want to create or ask?</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Design a landing page for an organic food startup..."
          placeholderTextColor="#6b7280"
          value={idea}
          onChangeText={setIdea}
          multiline
        />
        <TouchableOpacity style={styles.glowButton} onPress={handleStartPrompting}>
          <Text style={styles.glowButtonText}>Build Prompt with Glow</Text>
          <ArrowRight color="#ffffff" size={18} />
        </TouchableOpacity>
      </GlassCard>

      {/* Feature Grid */}
      <Text style={styles.sectionHeader}>Explore Features</Text>

      <TouchableOpacity onPress={() => navigation.navigate('Glow')}>
        <GlassCard style={styles.featureCard} borderColor="rgba(236, 72, 153, 0.25)">
          <View style={[styles.featureIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
            <Sparkles color="#ec4899" size={24} />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Prompt Builder (Glow)</Text>
            <Text style={styles.featureSub}>3-step dynamic question wizard to synthesize expert prompts.</Text>
          </View>
        </GlassCard>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Vision')}>
        <GlassCard style={styles.featureCard} borderColor="rgba(168, 85, 247, 0.25)">
          <View style={[styles.featureIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
            <Camera color="#a855f7" size={24} />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Vision Reverse Engineering</Text>
            <Text style={styles.featureSub}>Upload UI references to extract universal Midjourney/DALL-E prompts.</Text>
          </View>
        </GlassCard>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
        <GlassCard style={styles.featureCard} borderColor="rgba(59, 130, 246, 0.25)">
          <View style={[styles.featureIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <MessageSquare color="#3b82f6" size={24} />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Workspace Copilot Chat</Text>
            <Text style={styles.featureSub}>Chat directly with your AWS-hosted Gemma 4 12B model.</Text>
          </View>
        </GlassCard>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Voice')}>
        <GlassCard style={styles.featureCard} borderColor="rgba(16, 185, 129, 0.25)">
          <View style={[styles.featureIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Mic color="#10b981" size={24} />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Voice Input Mode</Text>
            <Text style={styles.featureSub}>Speak your prompt ideas naturally with live audio transcription.</Text>
          </View>
        </GlassCard>
      </TouchableOpacity>

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
  heroCard: {
    marginBottom: 16,
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ec4899',
    marginLeft: 6,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  inputCard: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 10,
  },
  textInput: {
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
  glowButton: {
    backgroundColor: '#ec4899',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
});
