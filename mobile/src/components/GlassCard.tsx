import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { TOKENS } from '../theme/tokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  glow?: boolean;
  pinkGlow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style, 
  borderColor = TOKENS.colors.glassBorder,
  glow = false,
  pinkGlow = false
}) => {
  return (
    <View 
      style={[
        styles.card, 
        { borderColor }, 
        glow && styles.glowStyle,
        pinkGlow && styles.pinkGlowStyle,
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: TOKENS.colors.glassSurface,
    borderWidth: 1,
    borderRadius: TOKENS.borderRadius.xl,
    padding: 16,
    ...TOKENS.shadows.glass,
  },
  glowStyle: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
    ...TOKENS.shadows.glow,
  },
  pinkGlowStyle: {
    borderColor: 'rgba(255, 0, 122, 0.4)',
    ...TOKENS.shadows.pinkGlow,
  }
});
