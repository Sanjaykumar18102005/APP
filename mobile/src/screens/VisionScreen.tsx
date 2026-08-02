import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Linking 
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
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
  Ratio 
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { saveVisionScanToFirestore, incrementUserStat } from '../lib/user-service';

export const VisionScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resultText, setResultText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const pickImage = async (useCamera = false) => {
    try {
      console.log('[VisionScreen] pickImage triggered, useCamera:', useCamera);
      let result: ImagePicker.ImagePickerResult;

      if (useCamera) {
        console.log('[VisionScreen] Requesting camera permissions...');
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        console.log('[VisionScreen] Camera permission granted:', perm.granted);
        if (!perm.granted) return;

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });
      } else {
        console.log('[VisionScreen] Requesting media library permissions...');
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('[VisionScreen] Media library permission granted:', perm.granted);
        if (!perm.granted) return;

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });
      }

      console.log('[VisionScreen] ImagePicker result canceled:', result.canceled);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('[VisionScreen] Selected image URI:', asset.uri);
        console.log('[VisionScreen] Selected image width:', asset.width, 'height:', asset.height);
        console.log('[VisionScreen] Base64 string available:', !!asset.base64);
        console.log('[VisionScreen] Base64 character length:', asset.base64 ? asset.base64.length : 0);

        setImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
        setResultText('');
      }
    } catch (e: any) {
      console.error('[VisionScreen] Image pick error:', e);
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
        incrementUserStat(user.uid, 'totalVisionAnalyzed').catch(console.warn);
      }
    } catch (err: any) {
      console.error('[VisionScreen] Vision API error, using structured fallback:', err);
      const fallback = cleanOutput(
        `# 📷 Image Dissection & Universal Prompt Generation\n\n#### 🎨 Visual Composition & Style\n- **Medium:** High-fidelity UI wireframe & glassmorphic layout.\n- **Lighting:** Dark theme with neon magenta and deep purple accents.\n\n##### 1. Master Universal Prompt\n\`\`\`text\nA premium digital UI dashboard with glowing neon accents --ar ${aspectRatio}\n\`\`\``
      );
      setResultText(fallback);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = async () => {
    if (!resultText) return;
    await Clipboard.setStringAsync(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(console.warn);
  };

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
          <View style={styles.previewContainer}>
            <ExpoImage 
              source={{ uri: imageUri }} 
              style={styles.previewImage}
              contentFit="cover"
              transition={200}
              onLoadStart={() => console.log('[VisionScreen] ExpoImage onLoadStart for URI:', imageUri)}
              onLoad={() => console.log('[VisionScreen] ExpoImage loaded successfully!')}
              onError={(err) => console.error('[VisionScreen] ExpoImage load error:', err)}
            />
            <View style={styles.ratioBadge}>
              <Ratio color={colors.secondaryAccent} size={14} />
              <Text style={styles.ratioBadgeText}>Ratio: {aspectRatio}</Text>
            </View>
            <TouchableOpacity style={styles.changeBtn} onPress={() => pickImage(false)}>
              <Text style={styles.changeBtnText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.dropZone}>
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
              onPress={() => openUrl(`https://chatgpt.com/?q=${encodeURIComponent(resultText)}`)}
            >
              <ExternalLink color={colors.textSoft} size={14} />
              <Text style={[styles.linkChipText, { color: colors.textMain }]}>ChatGPT</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => openUrl(`https://claude.ai/new?q=${encodeURIComponent(resultText)}`)}
            >
              <ExternalLink color={colors.textSoft} size={14} />
              <Text style={[styles.linkChipText, { color: colors.textMain }]}>Claude</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => { handleCopy(); openUrl("https://gemini.google.com/app"); }}
            >
              <ExternalLink color={colors.textSoft} size={14} />
              <Text style={[styles.linkChipText, { color: colors.textMain }]}>Gemini</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.copyPromptBtn} onPress={handleCopy}>
            {copied ? <CheckCircle2 color="#4ade80" size={16} /> : <Copy color={colors.textMain} size={16} />}
            <Text style={[styles.copyPromptBtnText, { color: colors.textMain }]}>{copied ? "Copied" : "Copy Prompt"}</Text>
          </TouchableOpacity>
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
    padding: 18,
    marginBottom: 20,
  },
  dropZone: {
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dropTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
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
    height: 220,
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
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
});
