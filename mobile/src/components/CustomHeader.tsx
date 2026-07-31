import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export const CustomHeader: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.bgNebula, borderBottomColor: colors.glassBorder }]}>
      <View style={styles.logoContainer}>
        <Sparkles color={colors.primaryAccent} size={24} />
        <Text style={[styles.title, { color: colors.textMain }]}>PromptGlow</Text>
      </View>
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>AI PRO</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
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
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 0, 122, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 122, 0.3)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FF007A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  }
});
