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
import * as FileSystem from 'expo-file-system/legacy';
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
    // Request microphone permissions on mount & setup audio mode
    (async () => {
      try {
        console.log('[VoiceScreen] Requesting microphone permissions on mount...');
        const perm = await Audio.requestPermissionsAsync();
        console.log('[VoiceScreen] Permission status on mount:', perm.status, 'granted:', perm.granted);
        if (perm.granted) {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
        }
      } catch (e) {
        console.warn('[VoiceScreen] Audio permission error on mount:', e);
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
      console.log('[VoiceScreen] Requesting recording permission...');
      const perm = await Audio.requestPermissionsAsync();
      console.log('[VoiceScreen] Permission granted:', perm.granted);
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Microphone access is required to use Voice Composer.');
        return;
      }

      if (recordingRef.current) {
        console.log('[VoiceScreen] Cleaning up existing recording reference...');
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }

      console.log('[VoiceScreen] Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      console.log('[VoiceScreen] Preparing to record with m4a / webm options...');
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

      const status = await recording.getStatusAsync();
      console.log('[VoiceScreen] Recording started successfully. Status:', status);

      setIsRecording(true);
    } catch (e: any) {
      console.error('[VoiceScreen] Start recording failed:', e);
      Alert.alert('Recording Error', e.message || 'Could not start microphone recording.');
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (!recordingRef.current) {
      console.warn('[VoiceScreen] stopRecordingAndTranscribe called with no active recordingRef');
      setIsRecording(false);
      return;
    }

    setIsRecording(false);
    setIsTranscribing(true);

    try {
      console.log('[VoiceScreen] Stopping and unloading recording...');
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      console.log('[VoiceScreen] Recorded file URI:', uri);

      if (!uri) {
        console.error('[VoiceScreen] Error: Recorded file URI is null or empty!');
        Alert.alert('Recording Error', 'Failed to retrieve recorded audio file URI.');
        setIsTranscribing(false);
        return;
      }

      // Verify file existence and non-zero size using FileSystem
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('[VoiceScreen] Recorded file info:', fileInfo);

      if (!fileInfo.exists) {
        console.error('[VoiceScreen] Error: Recorded audio file does not exist at URI:', uri);
        Alert.alert('Recording Error', 'Recorded audio file does not exist on disk.');
        setIsTranscribing(false);
        return;
      }

      if ('size' in fileInfo && fileInfo.size === 0) {
        console.error('[VoiceScreen] Error: Recorded audio file size is 0 bytes!');
        Alert.alert('Recording Error', 'Recorded audio file is empty (0 bytes).');
        setIsTranscribing(false);
        return;
      }

      // Read audio file directly into Base64 string via FileSystem
      console.log('[VoiceScreen] Reading file as Base64 via FileSystem...');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('[VoiceScreen] Audio Base64 character length:', base64.length);

      const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';
      const apiUrl = getApiUrl('/api/transcribe');
      console.log('[VoiceScreen] Sending Base64 audio payload to API endpoint:', apiUrl);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64, mimeType }),
      });

      console.log('[VoiceScreen] Server response status:', res.status);
      const data = await res.json();
      console.log('[VoiceScreen] Server response payload:', data);

      if (data.text) {
        console.log('[VoiceScreen] Transcription received successfully:', data.text);
        setTranscript((prev) => (prev ? `${prev} ${data.text}` : data.text));
      } else if (data.error) {
        console.warn('[VoiceScreen] Server returned error:', data.error);
        Alert.alert('Transcription Notice', data.error);
      } else {
        console.warn('[VoiceScreen] No text field in server response:', data);
      }
    } catch (e: any) {
      console.error('[VoiceScreen] stopRecordingAndTranscribe exception:', e);
      Alert.alert('Transcription Error', e.message || 'Failed to process voice recording.');
    } finally {
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
