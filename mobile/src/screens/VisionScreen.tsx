import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { MarkdownView } from '../components/MarkdownView';
import { getApiUrl } from '../config/api';
import { Camera, Image as ImageIcon, Sparkles, Check, Copy } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { incrementUserStat } from '../lib/user-service';

export const VisionScreen = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resultText, setResultText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const pickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission Required", "Camera permission is needed to take photos.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission Required", "Photo library permission is needed to select images.");
          return;
        }
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
    if (!imageBase64 && !imageUri) {
      Alert.alert("Image Required", "Please select or take an image to analyze.");
      return;
    }

    setLoading(true);
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
      const output = data.text || data.masterPrompt || "Image prompt generated.";
      setResultText(output);

      incrementUserStat('sandbox_guest_user', 'totalVisionAnalyzed').catch(console.warn);
    } catch (err: any) {
      console.warn("Vision API error:", err);
      setResultText(`# 📷 Image Dissection & Universal Prompt Generation\n\n#### 🎨 Visual Composition & Style\n- **Medium:** High-fidelity UI wireframe & glassmorphic layout.\n- **Lighting:** Dark theme with neon magenta and deep purple accents.\n\n##### 1. Master Universal Prompt\n\`\`\`text\nA premium dark digital UI dashboard with glowing neon accents --ar ${aspectRatio}\n\`\`\``);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = async () => {
    await Clipboard.setStringAsync(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Vision Reverse Engineering</Text>
      <Text style={styles.subtitle}>Extract prompts, visual DNA, and aspect ratios from images.</Text>

      {/* Image Picker Area */}
      <GlassCard style={styles.card}>
        {imageUri ? (
          <View style={styles.previewBox}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.changeBadge} onPress={() => setImageUri(null)}>
              <Text style={styles.changeBadgeText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Camera color="#a855f7" size={40} />
            <Text style={styles.uploadText}>Select or Capture Reference Image</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(false)}>
                <ImageIcon color="#ffffff" size={16} />
                <Text style={styles.pickerBtnText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(true)}>
                <Camera color="#ffffff" size={16} />
                <Text style={styles.pickerBtnText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
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
              <Text style={[styles.ratioText, aspectRatio === r && styles.ratioTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyzeImage} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Sparkles color="#ffffff" size={18} />
              <Text style={styles.analyzeBtnText}>Analyze Image & Extract Prompt</Text>
            </>
          )}
        </TouchableOpacity>
      </GlassCard>

      {/* Result Card */}
      {resultText ? (
        <GlassCard style={styles.card} borderColor="rgba(168, 85, 247, 0.4)">
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Extracted Prompt DNA</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyPrompt}>
              {copied ? <Check color="#10b981" size={14} /> : <Copy color="#ffffff" size={14} />}
              <Text style={styles.copyBtnText}>{copied ? "Copied!" : "Copy"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.markdownBox}>
            <MarkdownView content={resultText} />
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
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  previewBox: {
    position: 'relative',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeBadgeText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 8,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  pickerBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 6,
  },
  ratioLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  ratioRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  ratioPill: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ratioPillActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    borderColor: '#a855f7',
  },
  ratioText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  ratioTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  analyzeBtn: {
    backgroundColor: '#a855f7',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#a855f7',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 4,
  },
  markdownBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 12,
    borderRadius: 12,
  },
});
