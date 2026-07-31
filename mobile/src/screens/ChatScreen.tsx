import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { MarkdownView } from '../components/MarkdownView';
import { getApiUrl } from '../config/api';
import { Send, Bot, User } from 'lucide-react-native';
import { incrementUserStat, saveChatMessageToFirestore } from '../lib/user-service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your AI assistant in PromptGlow. You can chat with me normally here, brainstorm ideas, or ask for coding help!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsgText = input.trim();
    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: userMsgText
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      const aiReplyText = data.text || data.response || "No response received.";

      const aiMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: aiReplyText
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      // Increment Firestore stats
      incrementUserStat('sandbox_guest_user', 'totalChats').catch(console.warn);
      saveChatMessageToFirestore({ uid: 'sandbox_guest_user' }, finalMessages).catch(console.warn);
    } catch (err: any) {
      console.warn("Chat API error:", err);
      const fallbackMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `### Welcome to PromptGlow Workspace Copilot! 🧠\nI am currently running in **Sandbox Fallback Mode**.\n\nWe can still collaborate on prompt blueprints and system templates!`
      };
      setMessages([...newMessages, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageRow,
              msg.role === 'user' ? styles.userRow : styles.assistantRow
            ]}
          >
            <View style={[styles.avatar, msg.role === 'user' ? styles.userAvatar : styles.assistantAvatar]}>
              {msg.role === 'user' ? <User color="#ffffff" size={14} /> : <Bot color="#ec4899" size={14} />}
            </View>

            <GlassCard
              style={msg.role === 'user' ? { ...styles.bubble, ...styles.userBubble } : { ...styles.bubble, ...styles.assistantBubble }}
              borderColor={msg.role === 'user' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(236, 72, 153, 0.3)'}
            >
              {msg.role === 'user' ? (
                <Text style={styles.userMsgText}>{msg.content}</Text>
              ) : (
                <MarkdownView content={msg.content} />
              )}
            </GlassCard>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#ec4899" size="small" />
            <Text style={styles.loadingText}>Gemma 4 GPU thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask me anything..."
          placeholderTextColor="#6b7280"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={loading}>
          <Send color="#ffffff" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  userRow: {
    flexDirection: 'row-reverse',
  },
  assistantRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  userAvatar: {
    backgroundColor: '#3b82f6',
  },
  assistantAvatar: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
  },
  bubble: {
    maxWidth: '82%',
    padding: 12,
  },
  userBubble: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  assistantBubble: {
    backgroundColor: 'rgba(23, 27, 44, 0.85)',
  },
  userMsgText: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 36,
  },
  loadingText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
