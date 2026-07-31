import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface CustomHeaderProps {
  title?: string;
  subtitle?: string;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({ title = "PromptGlow", subtitle }) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <View style={styles.iconContainer}>
          <Sparkles color="#ec4899" size={22} />
        </View>
        <Text style={styles.titleText}>{title}</Text>
      </View>
      {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#0b0f19',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});
