import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { TOKENS } from '../theme/tokens';
import { getApiUrl } from '../config/api';
import { Sparkles, User, Send } from 'lucide-react-native';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export const ChatScreen = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      content: "Hello! I am your AI assistant in PromptGlow. You can chat with me normally here, brainstorm ideas, or ask for coding help!" 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages,
            { role: 'user', content: userMsg }
          ]
        })
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'model', content: data.text || "No response received." }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'model', content: `AI Error: ${err.message || 'Unknown server error.'}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Sparkles color="#3b82f6" size={20} />
        </View>
        <Text style={styles.title}>Workspace Chat</Text>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <View 
            key={i} 
            style={[
              styles.msgRow, 
              msg.role === 'user' ? styles.userRow : styles.modelRow
            ]}
          >
            <View 
              style={[
                styles.avatarCircle, 
                msg.role === 'user' ? styles.userAvatar : styles.modelAvatar
              ]}
            >
              {msg.role === 'user' ? (
                <User color={TOKENS.colors.textSoft} size={16} />
              ) : (
                <Sparkles color={TOKENS.colors.primaryAccent} size={16} />
              )}
            </View>

            <GlassCard 
              style={[
                styles.msgBubble, 
                msg.role === 'user' ? styles.userBubble : styles.modelBubble
              ]}
              pinkGlow={msg.role === 'model'}
            >
              <Text style={styles.msgText}>{msg.content}</Text>
            </GlassCard>
          </View>
        ))}

        {isTyping && (
          <View style={[styles.msgRow, styles.modelRow]}>
            <View style={[styles.avatarCircle, styles.modelAvatar]}>
              <Sparkles color={TOKENS.colors.primaryAccent} size={16} />
            </View>
            <GlassCard style={[styles.msgBubble, styles.modelBubble]}>
              <ActivityIndicator color={TOKENS.colors.primaryAccent} size="small" />
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Send color="#FFFFFF" size={18} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.colors.bgNebula,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.colors.glassBorder,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: TOKENS.borderRadius.md,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: TOKENS.colors.textMain,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  msgRow: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: '88%',
  },
  userRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  modelRow: {
    alignSelf: 'flex-start',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: TOKENS.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  userAvatar: {
    backgroundColor: TOKENS.colors.bgSurface,
    borderColor: TOKENS.colors.glassBorder,
  },
  modelAvatar: {
    backgroundColor: 'rgba(255, 0, 122, 0.15)',
    borderColor: 'rgba(255, 0, 122, 0.3)',
  },
  msgBubble: {
    flex: 1,
    padding: 14,
  },
  userBubble: {
    backgroundColor: TOKENS.colors.bgSurface,
  },
  modelBubble: {
    backgroundColor: TOKENS.colors.glassSurface,
  },
  msgText: {
    fontSize: 14,
    color: TOKENS.colors.textMain,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: TOKENS.colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: TOKENS.colors.glassBorder,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: TOKENS.colors.inputBg,
    borderWidth: 1,
    borderColor: TOKENS.colors.glassBorder,
    borderRadius: TOKENS.borderRadius.md,
    paddingHorizontal: 16,
    color: TOKENS.colors.textMain,
    fontSize: 14,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: TOKENS.borderRadius.md,
    backgroundColor: TOKENS.colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    ...TOKENS.shadows.pinkGlow,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
