import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../theme/ThemeContext';
import { Mic, MicOff, Sparkles, XCircle } from 'lucide-react-native';
import { getApiUrl } from '../lib/utils';

export const VoiceScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    // Request microphone permissions on mount
    (async () => {
      try {
        const { granted } = await Audio.requestPermissionsAsync();
        if (granted) {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
        }
      } catch (e) {
        console.warn('Audio permission error:', e);
      }
    })();

    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Denied', 'Microphone access is required to use Voice Composer.');
        return;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (e: any) {
      console.warn('Start recording error:', e);
      Alert.alert('Recording Error', e.message || 'Could not access microphone.');
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (!recordingRef.current) return;

    setIsRecording(false);
    setIsTranscribing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        setIsTranscribing(false);
        return;
      }

      // Read audio file as base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';

          const res = await fetch(getApiUrl('/api/transcribe'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64, mimeType }),
          });

          const data = await res.json();
          if (data.text) {
            setTranscript((prev) => (prev ? `${prev} ${data.text}` : data.text));
          } else if (data.error) {
            Alert.alert('Transcription Notice', data.error);
          }
        } catch (err: any) {
          console.warn('Transcription error:', err);
          Alert.alert('Notice', 'Voice captured. Type or refine your prompt below.');
        } finally {
          setIsTranscribing(false);
        }
      };

      reader.onerror = () => {
        setIsTranscribing(false);
      };

      reader.readAsDataURL(blob);
    } catch (e: any) {
      console.warn('Stop recording error:', e);
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecordingAndTranscribe();
    } else {
      startRecording();
    }
  };

  const handleClear = () => {
    setTranscript('');
  };

  const handleRefine = () => {
    if (!transcript.trim()) return;
    navigation.navigate('Glow', {
      initialIdea: transcript.trim(),
      initialPrompt: transcript.trim(),
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
          Tap mic to start recording. Tap again to stop and transcribe into a prompt.
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
                ? 'rgba(239, 68, 68, 0.15)'
                : isTranscribing
                ? 'rgba(139, 92, 246, 0.15)'
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
                Listening to live voice input... (Tap to stop)
              </Text>
            </>
          )}
          {isTranscribing && (
            <Text style={[styles.recordingText, { color: colors.secondaryAccent }]}>
              Transcribing audio with AI...
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
          {transcript.length > 0 && (
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
              : isTranscribing
              ? 'Transcribing audio...'
              : 'Tap microphone or type your voice prompt here...'
          }
          placeholderTextColor={colors.textMuted}
          value={transcript}
          onChangeText={setTranscript}
          multiline
          editable={!isRecording && !isTranscribing}
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
