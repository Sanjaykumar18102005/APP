import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  bgNebula: string;
  bgSurface: string;
  primaryAccent: string;
  secondaryAccent: string;
  textSoft: string;
  textMain: string;
  textMuted: string;
  glassBorder: string;
  glassSurface: string;
  inputBg: string;
  cardBg: string;
}

const darkColors: ThemeColors = {
  bgNebula: '#050510',
  bgSurface: '#12121f',
  primaryAccent: '#FF007A',
  secondaryAccent: '#8B5CF6',
  textSoft: '#C4B5FD',
  textMain: '#FFFFFF',
  textMuted: '#9CA3AF',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassSurface: 'rgba(18, 18, 31, 0.85)',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  cardBg: '#0e0e1a',
};

const lightColors: ThemeColors = {
  bgNebula: '#f5f5fa',
  bgSurface: '#ffffff',
  primaryAccent: '#FF007A',
  secondaryAccent: '#8B5CF6',
  textSoft: '#6b7280',
  textMain: '#050510',
  textMuted: '#4b5563',
  glassBorder: 'rgba(0, 0, 0, 0.1)',
  glassSurface: 'rgba(255, 255, 255, 0.9)',
  inputBg: 'rgba(0, 0, 0, 0.05)',
  cardBg: '#ffffff',
};

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  colors: darkColors,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved);
      }
    });
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    AsyncStorage.setItem('app_theme', mode);
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
