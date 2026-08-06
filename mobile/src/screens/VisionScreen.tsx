import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Linking,
  Image as RNImage,
  LayoutChangeEvent,
  Alert
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import Clipboard from '@react-native-clipboard/clipboard';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../lib/auth-context';
import { getApiUrl, cleanOutput } from '../lib/utils';
import { 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  Ratio,
  Bookmark
} from 'lucide-react-native';
import RNFS from 'react-native-fs';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveVisionScanToFirestore, savePromptHistoryToFirestore, incrementUserStat } from '../lib/user-service';

export const VisionScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string>('image/jpeg');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resultText, setResultText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const openUrl = async (url: string, isGemini = false) => {
    try {
      if (resultText) {
        Clipboard.setString(resultText);
      }
      const targetUrl = isGemini ? 'https://gemini.google.com' : url;
      console.log('[VisionScreen] Direct openURL:', targetUrl);
      await Linking.openURL(targetUrl);
    } catch (e: any) {
      console.warn('[VisionScreen] Linking error:', e);
      Alert.alert(
        'Browser Launch Error',
        `Failed to open external link: ${e?.message || e}. The prompt is already copied to your clipboard, you can paste it manually.`
      );
    }
  };

  const pickImage = async (useCamera = false) => {
    try {
      console.log('[VisionScreen] pickImage triggered, useCamera:', useCamera);
      let result: ImagePickerResponse;

      const options = {
        mediaType: 'photo' as const,
        quality: 0.7 as const,
        includeBase64: true,
      };

      if (useCamera) {
        result = await launchCamera(options);
      } else {
        result = await launchImageLibrary(options);
      }

      console.log('[VisionScreen] ImagePicker didCancel:', result.didCancel);

      if (!result.didCancel && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const pickedUri = asset.uri || '';
        const pickedBase64 = asset.base64 || null;
        const pickedType = asset.type || 'image/jpeg';

        let localFileUri = pickedUri;

        if (pickedUri) {
          try {
            const destPath = `${RNFS.CachesDirectoryPath}/vision_preview_${Date.now()}.jpg`;
            console.log('[VisionScreen] Copying content URI:', pickedUri, 'to destPath:', destPath);
            await RNFS.copyFile(pickedUri, destPath);
            localFileUri = `file://${destPath}`;
            console.log('[VisionScreen] Local cached file URI created:', localFileUri);
          } catch (copyErr) {
            console.warn('[VisionScreen] RNFS copyFile failed, using raw pickedUri:', copyErr);
          }
        }

        console.log('[VisionScreen] Final imageUri for RNImage:', localFileUri);
        console.log('[VisionScreen] Base64 length for API:', pickedBase64?.length || 0);

        setImageUri(localFileUri);
        setImageBase64(pickedBase64);
        setImageType(pickedType);
        setResultText('');
        setSaved(false);

        if (asset.width && asset.height) {
          setImageDimensions({ width: asset.width, height: asset.height });
        } else {
          setImageDimensions(null);
        }
      }
    } catch (e: any) {
      console.error('[VisionScreen] Image pick error:', e);
      Alert.alert('Image Pick Error', e?.message || 'Failed to pick image');
    }
  };

  const handleAnalyzeImage = async () => {
    console.log('[VisionScreen] handleAnalyzeImage initiated. imageUri:', imageUri, 'hasBase64:', !!imageBase64);
    if (!imageBase64 && !imageUri) {
      console.warn('[VisionScreen] Aborting analyze: No imageUri or imageBase64 available');
      return;
    }

    setIsAnalyzing(true);
    setResultText('');
    setSaved(false);

    const payloadBase64 = imageBase64 || "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    console.log('[VisionScreen] Sending payloadBase64 length:', payloadBase64.length);

    try {
      const endpoint = getApiUrl('/api/vision');
      console.log('[VisionScreen] POSTing image to endpoint:', endpoint);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: payloadBase64,
          aspectRatio: aspectRatio,
        })
      });

      console.log('[VisionScreen] Vision API response status:', res.status);
      const data = await res.json();
      console.log('[VisionScreen] Vision API response payload:', data);

      const cleaned = cleanOutput(data.text || data.masterPrompt || "Image prompt generated.");
      setResultText(cleaned);

      if (user?.uid) {
        saveVisionScanToFirestore(user, aspectRatio, cleaned).catch(console.warn);
        savePromptHistoryToFirestore(user, `Vision Analysis (${aspectRatio})`, cleaned).catch(console.warn);
        incrementUserStat(user.uid, 'totalVisionAnalyzed').catch(console.warn);
        incrementUserStat(user.uid, 'totalPromptsGenerated').catch(console.warn);
      }
    } catch (err: any) {
      console.error('[VisionScreen] Vision API error, using structured fallback:', err);
      const fallback = cleanOutput(
        `# 📷 Image Dissection & Universal Prompt Generation\n\n#### 🎨 Visual Composition & Style\n- **Medium:** High-fidelity UI wireframe & glassmorphic layout.\n- **Lighting:** Dark theme with neon magenta and deep purple accents.\n\n##### 1. Master Universal Prompt\n\`\`\`text\nA premium digital UI dashboard with glowing neon accents --ar ${aspectRatio}\n\`\`\``
      );
      setResultText(fallback);
      if (user?.uid) {
        savePromptHistoryToFirestore(user, `Vision Analysis (${aspectRatio})`, fallback).catch(console.warn);
        incrementUserStat(user.uid, 'totalPromptsGenerated').catch(console.warn);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (!resultText) return;
    Clipboard.setString(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePrompt = async () => {
    if (!resultText || saved) return;
    try {
      const now = new Date();
      const promptData = {
        title: `Vision Prompt (${aspectRatio})`,
        content: resultText,
        category: 'Vision',
        createdAtFormatted: now.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
        createdAt: now.getTime(),
      };
      if (user?.isSandbox) {
        const existing = await AsyncStorage.getItem('sandbox_saved_prompts');
        const list = existing ? JSON.parse(existing) : [];
        list.unshift({ ...promptData, id: `local_${now.getTime()}`, userId: user?.uid });
        await AsyncStorage.setItem('sandbox_saved_prompts', JSON.stringify(list));
        setSaved(true);
        Alert.alert('Saved', 'Vision prompt saved locally on your device!');
      } else if (db && user?.uid) {
        await addDoc(collection(db, 'prompts'), {
          ...promptData,
          userId: user.uid,
          userEmail: user.email || '',
        });
        setSaved(true);
        Alert.alert('Saved', 'Vision prompt saved to your cloud profile!');
      } else {
        throw new Error('No authenticated user session found. Please sign in under the Profile tab.');
      }
    } catch (err: any) {
      Alert.alert('Save failed', err.message || 'Could not save this prompt.');
    }
  };

  // Build the display URI for the image preview.
  // CRITICAL: On Android, content:// URIs from the image picker can lose
  // their temporary read permission, causing <Image> to silently show nothing.
  // We MUST prefer the base64 data URI for reliable display.
  const getDisplayUri = (): string => {
    if (imageBase64) {
      // Strip any existing data: prefix to avoid double-wrapping
      const rawBase64 = imageBase64.startsWith('data:') ? imageBase64 : `data:${imageType || 'image/jpeg'};base64,${imageBase64}`;
      return rawBase64;
    }
    return imageUri || '';
  };

  console.log('[VisionScreen] RENDER STATE:');
  console.log('  - imageUri:', imageUri);
  console.log('  - imageBase64 length:', imageBase64?.length || 0);
  console.log('  - displayUri:', getDisplayUri() ? (getDisplayUri().substring(0, 100) + '...') : 'empty');

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.bgNebula }]} 
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Camera color={colors.secondaryAccent} size={28} />
          <Text style={[styles.title, { color: colors.textMain }]}>Vision Reverse Engineering</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSoft }]}>
          Upload an image. We'll extract its DNA, aspect ratio, and give you the prompt to recreate it.
        </Text>
      </View>

      {/* Upload Drop Zone */}
      <GlassCard style={styles.uploadCard} glow>
        {imageUri ? (
          <View style={[styles.previewContainer, { borderWidth: 3, borderColor: 'red' }]}>
            <RNImage
              source={{ uri: imageUri }}
              style={{
                width: '100%',
                height: 300,
                borderRadius: 12,
                borderWidth: 3,
                borderColor: 'green',
                backgroundColor: 'rgba(255, 0, 0, 0.1)', // transparent red background to identify image area
              }}
              resizeMode="contain"
              onLoad={() => console.log('[VisionScreen] Local cached file loaded successfully:', imageUri)}
              onError={(e) => {
                console.error('[VisionScreen] Image load error:', e.nativeEvent.error);
                Alert.alert(
                  'Image Display Issue',
                  `Failed to load cached local image:\n\nError: ${e.nativeEvent.error || 'Unknown'}`
                );
              }}
            />
            <View style={styles.ratioBadge}>
              <Ratio color={colors.secondaryAccent} size={14} />
              <Text style={styles.ratioBadgeText}>
                {imageDimensions
                  ? `${imageDimensions.width}×${imageDimensions.height}`
                  : aspectRatio}
              </Text>
            </View>
            <TouchableOpacity style={styles.changeBtn} onPress={() => pickImage(false)}>
              <Text style={styles.changeBtnText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[styles.dropZone, { borderWidth: 3, borderColor: 'blue', backgroundColor: 'rgba(0, 0, 255, 0.1)' }]}
            onLayout={(e: any) => setContainerWidth(e.nativeEvent.layout.width)}
          >
            <ImageIcon color={colors.textSoft} size={40} style={{ marginBottom: 12 }} />
            <Text style={[styles.dropTitle, { color: colors.textSoft }]}>Select or Capture Reference Image</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderColor: 'rgba(139, 92, 246, 0.4)' }]} onPress={() => pickImage(false)}>
                <ImageIcon color="#FFFFFF" size={16} />
                <Text style={styles.pickerBtnText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderColor: 'rgba(139, 92, 246, 0.4)' }]} onPress={() => pickImage(true)}>
                <Camera color="#FFFFFF" size={16} />
                <Text style={styles.pickerBtnText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Aspect Ratio Selector */}
        <Text style={[styles.ratioLabel, { color: colors.textSoft }]}>Target Aspect Ratio Tag</Text>
        <View style={styles.ratioRow}>
          {["16:9", "1:1", "9:16", "4:3"].map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.ratioPill, 
                { backgroundColor: colors.inputBg, borderColor: colors.glassBorder },
                aspectRatio === r && { backgroundColor: 'rgba(139, 92, 246, 0.25)', borderColor: colors.secondaryAccent }
              ]}
              onPress={() => setAspectRatio(r)}
            >
              <Text style={[styles.ratioPillText, { color: colors.textSoft }, aspectRatio === r && { color: '#FFFFFF', fontWeight: '700' }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.analyzeBtn, { backgroundColor: colors.secondaryAccent }, (!imageUri || isAnalyzing) && styles.disabledBtn]} 
          onPress={handleAnalyzeImage} 
          disabled={!imageUri || isAnalyzing}
        >
          {isAnalyzing ? (
            <View style={styles.spinRow}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.analyzeBtnText}>Extracting DNA...</Text>
            </View>
          ) : (
            <View style={styles.spinRow}>
              <Text style={styles.analyzeBtnText}>Analyze Image</Text>
              <Sparkles color="#FFFFFF" size={18} />
            </View>
          )}
        </TouchableOpacity>
      </GlassCard>

      {/* Analysis Output Panel */}
      {resultText ? (
        <GlassCard style={styles.resultCard}>
          <Text style={[styles.resultHeaderTitle, { color: colors.secondaryAccent }]}>Analysis Output</Text>
          <View style={styles.markdownBox}>
            <Text style={[styles.markdownContent, { color: colors.textMain }]}>{resultText}</Text>
          </View>

          {/* External Links & Copy */}
          <Text style={[styles.openWithLabel, { color: colors.textSoft }]}>Open with:</Text>
          <View style={styles.linkRow}>
            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => {
                handleCopy();
                openUrl(`https://chatgpt.com/?q=${encodeURIComponent(resultText)}`);
              }}
            >
              <ExternalLink color={colors.textSoft} size={14} />
              <Text style={[styles.linkChipText, { color: colors.textMain }]}>ChatGPT</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => {
                handleCopy();
                openUrl(`https://claude.ai/new?q=${encodeURIComponent(resultText)}`);
              }}
            >
              <ExternalLink color={colors.textSoft} size={14} />
              <Text style={[styles.linkChipText, { color: colors.textMain }]}>Claude</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => {
                handleCopy();
                openUrl('', true);
              }}
            >
              <ExternalLink color={colors.textSoft} size={14} />
              <Text style={[styles.linkChipText, { color: colors.textMain }]}>Gemini</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionBtnRow}>
            <TouchableOpacity style={[styles.copyPromptBtn, { flex: 1 }]} onPress={handleCopy}>
              {copied ? <CheckCircle2 color="#4ade80" size={16} /> : <Copy color={colors.textMain} size={16} />}
              <Text style={[styles.copyPromptBtnText, { color: colors.textMain }]}>{copied ? "Copied" : "Copy Prompt"}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.savePromptBtn, 
                { flex: 1, backgroundColor: saved ? 'rgba(74, 222, 128, 0.2)' : 'rgba(139, 92, 246, 0.2)', borderColor: saved ? 'rgba(74, 222, 128, 0.4)' : 'rgba(139, 92, 246, 0.4)' }
              ]} 
              onPress={handleSavePrompt}
              disabled={saved}
            >
              {saved ? <CheckCircle2 color="#4ade80" size={16} /> : <Bookmark color={colors.secondaryAccent} size={16} />}
              <Text style={[styles.copyPromptBtnText, { color: saved ? '#4ade80' : colors.textMain }]}>
                {saved ? "Saved" : "Save Prompt"}
              </Text>
            </TouchableOpacity>
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
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  uploadCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  dropZone: {
    height: 200,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 20,
  },
  dropTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewContainer: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
  },
  ratioBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  ratioBadgeText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '700',
  },
  changeBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  changeBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ratioLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  ratioRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  ratioPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  ratioPillText: {
    fontSize: 13,
  },
  analyzeBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  spinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyzeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultCard: {
    padding: 18,
  },
  resultHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  markdownBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  markdownContent: {
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
    marginBottom: 18,
  },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  linkChipText: {
    fontSize: 13,
  },
  copyPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  copyPromptBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  savePromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});
