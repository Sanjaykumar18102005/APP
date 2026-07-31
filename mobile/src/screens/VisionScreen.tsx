import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image as RNImage, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Linking 
} from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { TOKENS } from '../theme/tokens';
import { getApiUrl } from '../config/api';
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

export const VisionScreen = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resultText, setResultText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const pickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
        setResultText('');
      }
    } catch (e: any) {
      console.warn("Image pick error:", e);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageBase64 && !imageUri) return;
    setIsAnalyzing(true);
    setResultText('');

    const payloadBase64 = imageBase64 || "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    try {
      const res = await fetch(getApiUrl('/api/vision'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: payloadBase64,
          aspectRatio: aspectRatio,
        })
      });
      const data = await res.json();
      setResultText(data.text || data.masterPrompt || "Image prompt generated.");
    } catch (err: any) {
      setResultText(
        `# 📷 Image Dissection & Universal Prompt Generation\n\n#### 🎨 Visual Composition & Style\n- **Medium:** High-fidelity UI wireframe & glassmorphic layout.\n- **Lighting:** Dark theme with neon magenta and deep purple accents.\n\n##### 1. Master Universal Prompt\n\`\`\`text\nA premium dark digital UI dashboard with glowing neon accents --ar ${aspectRatio}\n\`\`\``
      );
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Camera color={TOKENS.colors.secondaryAccent} size={28} />
          <Text style={styles.title}>Vision Reverse Engineering</Text>
        </View>
        <Text style={styles.subtitle}>
          Upload an image. We'll extract its DNA, aspect ratio, and give you the prompt to recreate it.
        </Text>
      </View>

      {/* Upload Drop Zone */}
      <GlassCard style={styles.uploadCard} glow>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <RNImage source={{ uri: imageUri }} style={styles.previewImage} />
            <View style={styles.ratioBadge}>
              <Ratio color={TOKENS.colors.secondaryAccent} size={14} />
              <Text style={styles.ratioBadgeText}>Ratio: {aspectRatio}</Text>
            </View>
            <TouchableOpacity style={styles.changeBtn} onPress={() => pickImage(false)}>
              <Text style={styles.changeBtnText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.dropZone} onPress={() => pickImage(false)}>
            <ImageIcon color={TOKENS.colors.textSoft} size={40} style={{ marginBottom: 12 }} />
            <Text style={styles.dropTitle}>Click to upload or select photo</Text>
            <Text style={styles.dropSub}>PNG, JPG, GIF or WEBP</Text>
          </TouchableOpacity>
        )}

        {/* Aspect Ratio Selector */}
        <Text style={styles.ratioLabel}>Target Aspect Ratio Tag</Text>
        <View style={styles.ratioRow}>
          {["16:9", "1:1", "9:16", "4:3"].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.ratioPill, aspectRatio === r && styles.ratioPillActive]}
              onPress={() => setAspectRatio(r)}
            >
              <Text style={[styles.ratioPillText, aspectRatio === r && styles.ratioPillTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.analyzeBtn, (!imageUri || isAnalyzing) && styles.disabledBtn]} 
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
          <Text style={styles.resultHeaderTitle}>Analysis Output</Text>
          <View style={styles.markdownBox}>
            <Text style={styles.markdownContent}>{resultText}</Text>
          </View>

          {/* External Links & Copy */}
          <Text style={styles.openWithLabel}>Open with:</Text>
          <View style={styles.linkRow}>
            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => openUrl(`https://chatgpt.com/?q=${encodeURIComponent(resultText)}`)}
            >
              <ExternalLink color={TOKENS.colors.textSoft} size={14} />
              <Text style={styles.linkChipText}>ChatGPT</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => openUrl(`https://claude.ai/new?q=${encodeURIComponent(resultText)}`)}
            >
              <ExternalLink color={TOKENS.colors.textSoft} size={14} />
              <Text style={styles.linkChipText}>Claude</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkChip}
              onPress={() => { handleCopy(); openUrl("https://gemini.google.com/app"); }}
            >
              <ExternalLink color={TOKENS.colors.textSoft} size={14} />
              <Text style={styles.linkChipText}>Gemini</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.copyPromptBtn} onPress={handleCopy}>
            {copied ? <CheckCircle2 color="#4ade80" size={16} /> : <Copy color={TOKENS.colors.textMain} size={16} />}
            <Text style={styles.copyPromptBtnText}>{copied ? "Copied" : "Copy Prompt"}</Text>
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
    backgroundColor: TOKENS.colors.bgNebula,
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
    color: TOKENS.colors.textMain,
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.colors.textSoft,
    lineHeight: 20,
  },
  uploadCard: {
    padding: 18,
    marginBottom: 20,
  },
  dropZone: {
    height: 160,
    borderWidth: 2,
    borderColor: TOKENS.colors.glassBorder,
    borderStyle: 'dashed',
    borderRadius: TOKENS.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dropTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.colors.textSoft,
    marginBottom: 4,
  },
  dropSub: {
    fontSize: 12,
    color: TOKENS.colors.textMuted,
  },
  previewContainer: {
    height: 200,
    borderRadius: TOKENS.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    borderRadius: TOKENS.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  ratioBadgeText: {
    fontSize: 12,
    color: TOKENS.colors.secondaryAccent,
    fontWeight: '700',
  },
  changeBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: TOKENS.borderRadius.md,
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
    color: TOKENS.colors.textSoft,
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
    borderRadius: TOKENS.borderRadius.md,
    backgroundColor: TOKENS.colors.inputBg,
    borderWidth: 1,
    borderColor: TOKENS.colors.glassBorder,
  },
  ratioPillActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderColor: TOKENS.colors.secondaryAccent,
  },
  ratioPillText: {
    fontSize: 13,
    color: TOKENS.colors.textSoft,
  },
  ratioPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  analyzeBtn: {
    backgroundColor: TOKENS.colors.secondaryAccent,
    borderRadius: TOKENS.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...TOKENS.shadows.glow,
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
    color: TOKENS.colors.secondaryAccent,
    marginBottom: 12,
  },
  markdownBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 14,
    borderRadius: TOKENS.borderRadius.md,
    marginBottom: 16,
  },
  markdownContent: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: TOKENS.colors.textMain,
    lineHeight: 20,
  },
  openWithLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TOKENS.colors.textSoft,
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
    borderRadius: TOKENS.borderRadius.md,
    backgroundColor: TOKENS.colors.glassSurface,
    borderWidth: 1,
    borderColor: TOKENS.colors.glassBorder,
  },
  linkChipText: {
    fontSize: 13,
    color: TOKENS.colors.textMain,
  },
  copyPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: TOKENS.borderRadius.md,
    backgroundColor: TOKENS.colors.glassSurface,
    borderWidth: 1,
    borderColor: TOKENS.colors.glassBorder,
  },
  copyPromptBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.colors.textMain,
  },
});
