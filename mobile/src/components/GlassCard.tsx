import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

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
  borderColor,
  glow = false,
  pinkGlow = false
}) => {
  const { colors } = useTheme();

  const finalBorderColor = borderColor || colors.glassBorder;

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.glassSurface,
          borderColor: finalBorderColor 
        }, 
        glow && { borderColor: colors.secondaryAccent },
        pinkGlow && { borderColor: colors.primaryAccent },
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
});
