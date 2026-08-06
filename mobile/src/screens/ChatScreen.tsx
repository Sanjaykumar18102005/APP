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
import { MarkdownView } from '../components/MarkdownView';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../lib/auth-context';
import { getApiUrl, cleanOutput } from '../lib/utils';
import { Sparkles, User, Send } from 'lucide-react-native';
import { saveChatMessageToFirestore, incrementUserStat } from '../lib/user-service';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export const ChatScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
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
    const updatedMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages
        })
      });
      const data = await response.json();
      const cleaned = cleanOutput(data.text || "No response received.");
      const finalMsgs: Message[] = [...updatedMessages, { role: 'model', content: cleaned }];
      setMessages(finalMsgs);

      if (user?.uid) {
        saveChatMessageToFirestore(user, finalMsgs).catch(console.warn);
        incrementUserStat(user.uid, 'totalChats').catch(console.warn);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'model', content: `AI Error: ${err.message || 'Unknown server error.'}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bgNebula }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 25}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
        <View style={styles.iconCircle}>
          <Sparkles color="#3b82f6" size={20} />
        </View>
        <Text style={[styles.title, { color: colors.textMain }]}>Workspace Chat</Text>
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
                msg.role === 'user' 
                  ? { backgroundColor: colors.bgSurface, borderColor: colors.glassBorder } 
                  : { backgroundColor: 'rgba(255, 0, 122, 0.15)', borderColor: 'rgba(255, 0, 122, 0.3)' }
              ]}
            >
              {msg.role === 'user' ? (
                <User color={colors.textSoft} size={16} />
              ) : (
                <Sparkles color={colors.primaryAccent} size={16} />
              )}
            </View>

            <GlassCard 
              style={[
                styles.msgBubble, 
                msg.role === 'user' 
                  ? { backgroundColor: colors.bgSurface } 
                  : { backgroundColor: colors.glassSurface }
              ]}
              pinkGlow={msg.role === 'model'}
            >
              <MarkdownView content={msg.content} textColor={colors.textMain} />
            </GlassCard>
          </View>
        ))}

        {isTyping && (
          <View style={[styles.msgRow, styles.modelRow]}>
            <View style={[styles.avatarCircle, { backgroundColor: 'rgba(255, 0, 122, 0.15)', borderColor: 'rgba(255, 0, 122, 0.3)' }]}>
              <Sparkles color={colors.primaryAccent} size={16} />
            </View>
            <GlassCard style={[styles.msgBubble, { backgroundColor: colors.glassSurface }]}>
              <ActivityIndicator color={colors.primaryAccent} size="small" />
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={[styles.inputContainer, { backgroundColor: colors.bgSurface, borderTopColor: colors.glassBorder }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.glassBorder, color: colors.textMain }]}
          placeholder="Ask me anything..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendBtn, { backgroundColor: colors.primaryAccent }, !input.trim() && styles.sendBtnDisabled]} 
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
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
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  msgBubble: {
    flex: 1,
    padding: 14,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
