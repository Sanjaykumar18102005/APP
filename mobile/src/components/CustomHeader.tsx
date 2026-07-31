import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { TOKENS } from '../theme/tokens';

export const CustomHeader: React.FC = () => {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Sparkles color={TOKENS.colors.primaryAccent} size={26} />
        <Text style={styles.title}>PromptGlow</Text>
      </View>
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>AI PRO</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: TOKENS.colors.bgNebula,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.colors.glassBorder,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: TOKENS.colors.textMain,
    letterSpacing: 0.5,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 0, 122, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 122, 0.3)',
    borderRadius: TOKENS.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: TOKENS.colors.primaryAccent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  }
});
