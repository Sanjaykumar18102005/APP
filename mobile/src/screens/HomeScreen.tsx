import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { Sparkles, Image, Mic, MessageSquare, ArrowRight } from 'lucide-react-native';
import { TOKENS } from '../theme/tokens';

export const HomeScreen = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>PromptGlow</Text>
        <Text style={styles.subtitle}>
          Your AI command center.{'\n'}
          Transform abstract ideas into perfect prompts.
        </Text>
      </View>

      {/* Grid of 4 Feature Cards */}
      <View style={styles.grid}>
        {/* Card 1: Refine Prompt */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Glow')}
        >
          <GlassCard style={styles.mainCard} pinkGlow>
            <View style={[styles.iconCircle, styles.pinkCircle]}>
              <Sparkles color={TOKENS.colors.primaryAccent} size={24} />
            </View>
            <Text style={styles.cardTitle}>Refine Prompt</Text>
            <Text style={styles.cardDesc}>
              Start with a vague idea and let our AI guide you through an adaptive branching process to create a world-class prompt.
            </Text>
            <View style={styles.actionRow}>
              <Text style={[styles.actionText, { color: TOKENS.colors.primaryAccent }]}>Start Building</Text>
              <ArrowRight color={TOKENS.colors.primaryAccent} size={16} style={{ marginLeft: 6 }} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Card 2: Reverse Engineer Image */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Vision')}
        >
          <GlassCard style={styles.mainCard} glow>
            <View style={[styles.iconCircle, styles.purpleCircle]}>
              <Image color={TOKENS.colors.secondaryAccent} size={24} />
            </View>
            <Text style={styles.cardTitle}>Reverse Engineer Image</Text>
            <Text style={styles.cardDesc}>
              Upload an image and we'll analyze it using Gemini Vision to generate the exact Midjourney or Stable Diffusion prompt.
            </Text>
            <View style={styles.actionRow}>
              <Text style={[styles.actionText, { color: TOKENS.colors.secondaryAccent }]}>Try Vision</Text>
              <ArrowRight color={TOKENS.colors.secondaryAccent} size={16} style={{ marginLeft: 6 }} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Card 3: Voice Prompting */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Voice')}
        >
          <GlassCard style={styles.smallCard}>
            <View style={styles.smallRow}>
              <View style={[styles.smallIconCircle, styles.greenCircle]}>
                <Mic color="#22c55e" size={20} />
              </View>
              <View style={styles.smallTextContainer}>
                <Text style={styles.smallTitle}>Voice Prompting</Text>
                <Text style={styles.smallDesc}>Draft prompts by talking aloud</Text>
              </View>
              <ArrowRight color={TOKENS.colors.textSoft} size={18} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Card 4: Normal Chat mode */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Chat')}
        >
          <GlassCard style={styles.smallCard}>
            <View style={styles.smallRow}>
              <View style={[styles.smallIconCircle, styles.blueCircle]}>
                <MessageSquare color="#3b82f6" size={20} />
              </View>
              <View style={styles.smallTextContainer}>
                <Text style={styles.smallTitle}>Normal Chat mode</Text>
                <Text style={styles.smallDesc}>Direct AI assistant access</Text>
              </View>
              <ArrowRight color={TOKENS.colors.textSoft} size={18} />
            </View>
          </GlassCard>
        </TouchableOpacity>
      </View>

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
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: TOKENS.colors.textMain,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: TOKENS.colors.textSoft,
    lineHeight: 24,
    fontWeight: '300',
  },
  grid: {
    gap: 18,
  },
  mainCard: {
    padding: 22,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: TOKENS.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  pinkCircle: {
    backgroundColor: 'rgba(255, 0, 122, 0.15)',
    borderColor: 'rgba(255, 0, 122, 0.3)',
  },
  purpleCircle: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TOKENS.colors.textMain,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: TOKENS.colors.textSoft,
    lineHeight: 20,
    fontWeight: '300',
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  smallCard: {
    padding: 16,
  },
  smallRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallIconCircle: {
    width: 40,
    height: 40,
    borderRadius: TOKENS.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
  },
  greenCircle: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  blueCircle: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  smallTextContainer: {
    flex: 1,
  },
  smallTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TOKENS.colors.textMain,
    marginBottom: 2,
  },
  smallDesc: {
    fontSize: 12,
    color: TOKENS.colors.textSoft,
  },
});
