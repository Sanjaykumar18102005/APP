import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../theme/ThemeContext';
import { Mic, MicOff, Sparkles, XCircle, RefreshCw } from 'lucide-react-native';
import { getApiUrl, cleanOutput } from '../lib/utils';

export const VoiceScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialSpeech, setPartialSpeech] = useState('');

  useEffect(() => {
    Voice.onSpeechStart = () => setIsRecording(true);
    Voice.onSpeechEnd = () => setIsRecording(false);
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.warn('[VoiceScreen] Speech recognition error:', e.error);
      setIsRecording(false);
    };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value[0]) {
        setTranscript(e.value[0]);
        setPartialSpeech('');
      }
    };
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value[0]) {
        setPartialSpeech(e.value[0]);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };
  }, []);

  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'PromptGlow needs microphone access for Voice Composer.',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Audio permission error:', err);
        return false;
      }
    }
    return true;
  };

  const startRecording = async () => {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Microphone access is required for voice recording.');
      return;
    }

    try {
      setPartialSpeech('');
      await Voice.start('en-US');
      setIsRecording(true);
    } catch (e: any) {
      console.error('[VoiceScreen] Voice.start failed:', e);
      setIsRecording(false);
      Alert.alert('Voice Error', e.message || 'Could not start speech recognition.');
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (e: any) {
      console.warn('[VoiceScreen] Voice.stop failed:', e);
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAiEnhance = async () => {
    if (!transcript.trim()) return;
    setIsTranscribing(true);
    try {
      const res = await fetch(getApiUrl('/api/transcribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: 'dGVzdA==', mimeType: 'audio/m4a', text: transcript }),
      });
      const data = await res.json();
      if (data.text) {
        setTranscript(cleanOutput(data.text));
      }
    } catch (e: any) {
      console.warn('[VoiceScreen] AI enhancement error:', e);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClear = () => {
    setTranscript('');
    setPartialSpeech('');
  };

  const handleRefine = () => {
    const activeText = transcript || partialSpeech;
    if (!activeText.trim()) return;
    navigation.navigate('Glow', {
      initialIdea: activeText.trim(),
      initialPrompt: activeText.trim(),
    });
  };

  const displayText = transcript || partialSpeech;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgNebula }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textMain }]}>Voice Composer</Text>
        <Text style={[styles.subtitle, { color: colors.textSoft }]}>
          Tap mic to start recording. Speak your idea aloud and watch it transcribe in real-time.
        </Text>
      </View>

      {/* Mic Button Circle */}
      <View style={styles.micWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.micCircle,
            {
              backgroundColor: isRecording
                ? 'rgba(239, 68, 68, 0.2)'
                : isTranscribing
                ? 'rgba(139, 92, 246, 0.2)'
                : colors.glassSurface,
              borderColor: isRecording
                ? '#ef4444'
                : isTranscribing
                ? colors.secondaryAccent
                : colors.glassBorder,
            },
          ]}
          onPress={toggleRecording}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <ActivityIndicator color={colors.secondaryAccent} size="large" />
          ) : isRecording ? (
            <Mic color="#ef4444" size={48} />
          ) : (
            <MicOff color={colors.textSoft} size={48} />
          )}
        </TouchableOpacity>

        <View style={styles.recordingStatusRow}>
          {isRecording && (
            <>
              <View style={styles.redPulseDot} />
              <Text style={[styles.recordingText, { color: '#ef4444' }]}>
                Listening live... (Tap mic again to stop)
              </Text>
            </>
          )}
          {isTranscribing && (
            <Text style={[styles.recordingText, { color: colors.secondaryAccent }]}>
              Optimizing prompt with AI...
            </Text>
          )}
          {!isRecording && !isTranscribing && (
            <Text style={[styles.recordingText, { color: colors.textSoft }]}>
              Tap microphone to speak
            </Text>
          )}
        </View>
      </View>

      {/* Live Speech & Editable Transcript Panel */}
      <GlassCard style={styles.transcriptCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.transcriptLabel, { color: colors.textSoft }]}>
            LIVE SPEECH & USER INPUT
          </Text>
          {displayText.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <XCircle color={colors.textSoft} size={18} />
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={[styles.transcriptInput, { color: colors.textMain }]}
          placeholder={
            isRecording
              ? 'Listening to your voice... Speak now!'
              : 'Tap microphone or type your voice prompt here...'
          }
          placeholderTextColor={colors.textMuted}
          value={displayText}
          onChangeText={setTranscript}
          multiline
          editable={!isRecording && !isTranscribing}
        />
      </GlassCard>

      {/* Action Buttons */}
      {displayText.trim() ? (
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.refineBtn, { backgroundColor: colors.primaryAccent }]}
            onPress={handleRefine}
          >
            <Text style={styles.refineBtnText}>Refine This Prompt</Text>
            <Sparkles color="#FFFFFF" size={18} />
          </TouchableOpacity>
        </View>
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
    fontWeight: '600',
  },
  transcriptCard: {
    width: '100%',
    padding: 18,
    marginBottom: 20,
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
  btnRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  aiEnhanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  aiEnhanceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  refineBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  refineBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
