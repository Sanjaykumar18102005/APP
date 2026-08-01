import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  ActivityIndicator
} from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../theme/ThemeContext';
import { Mic, MicOff, Sparkles, XCircle, Volume2 } from 'lucide-react-native';

export const VoiceScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isRecordingText, setIsRecordingText] = useState(false);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      setIsRecordingText(false);
    } else {
      setIsListening(true);
      setIsRecordingText(true);
      // Only set initial sample if transcript is completely empty
      setTranscript(prev => prev || "Creating a high-converting dark neon landing page layout...");
    }
  };

  const handleClear = () => {
    setTranscript('');
    setIsListening(false);
  };

  const handleRefine = () => {
    if (!transcript.trim()) return;
    navigation.navigate('Glow', { 
      initialIdea: transcript.trim(),
      initialPrompt: transcript.trim()
    });
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.bgNebula }]} 
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textMain }]}>Voice Composer</Text>
        <Text style={[styles.subtitle, { color: colors.textSoft }]}>
          Speak your raw idea aloud. We'll capture it and refine it into a perfect prompt.
        </Text>
      </View>

      {/* Mic Button Circle with Pulsing Effect */}
      <View style={styles.micWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.micCircle,
            { 
              backgroundColor: isListening ? 'rgba(34, 197, 94, 0.15)' : colors.glassSurface,
              borderColor: isListening ? '#22c55e' : colors.glassBorder 
            }
          ]}
          onPress={toggleListening}
        >
          {isListening ? (
            <Mic color="#22c55e" size={48} />
          ) : (
            <MicOff color={colors.textSoft} size={48} />
          )}
        </TouchableOpacity>

        {isListening && (
          <View style={styles.recordingStatusRow}>
            <View style={styles.redPulseDot} />
            <Text style={styles.recordingText}>Listening to live voice input...</Text>
          </View>
        )}
      </View>

      {/* Live Speech & Editable Transcript Panel */}
      <GlassCard style={styles.transcriptCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.transcriptLabel, { color: colors.textSoft }]}>
            LIVE SPEECH & USER INPUT
          </Text>
          {transcript.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <XCircle color={colors.textSoft} size={18} />
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={[styles.transcriptInput, { color: colors.textMain }]}
          placeholder={isListening ? "Listening to your voice..." : "Tap microphone or type your voice prompt here..."}
          placeholderTextColor={colors.textMuted}
          value={transcript}
          onChangeText={setTranscript}
          multiline
        />
      </GlassCard>

      {/* Refine Button */}
      {transcript.trim() ? (
        <TouchableOpacity 
          style={[styles.refineBtn, { backgroundColor: colors.primaryAccent }]} 
          onPress={handleRefine}
        >
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
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  micWrapper: {
    alignItems: 'center',
    marginBottom: 28,
  },
  micCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  redPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  recordingText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  transcriptCard: {
    width: '100%',
    padding: 18,
    marginBottom: 24,
    minHeight: 160,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transcriptLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  transcriptInput: {
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  refineBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  refineBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
