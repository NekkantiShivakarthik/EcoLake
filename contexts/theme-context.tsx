import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'system';
type ActualTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  actualTheme: ActualTheme;
  setTheme: (theme: Theme) => void;
  colors: typeof lightColors;
}

const lightColors = {
  // Primary - Lake Blue
  primary: '#0E7490',
  primaryLight: '#22D3EE',
  primaryDark: '#0C4A6E',
  
  // Secondary - Nature Green
  secondary: '#059669',
  secondaryLight: '#34D399',
  secondaryDark: '#065F46',
  
  // Accent colors
  accent: '#F59E0B',
  accentLight: '#FCD34D',
  
  // Status colors
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Severity colors
  severity1: '#86EFAC',
  severity2: '#FDE047',
  severity3: '#FDBA74',
  severity4: '#F87171',
  severity5: '#DC2626',
  
  // Category colors
  categoryTrash: '#6B7280',
  categoryOil: '#1F2937',
  categoryPlastic: '#3B82F6',
  categoryVegetation: '#22C55E',
  categoryAnimal: '#A855F7',
  categoryOther: '#F59E0B',
  
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // UI Elements
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  divider: '#E5E7EB',
  cardBackground: '#FFFFFF',
  inputBackground: '#F9FAFB',
  headerBackground: '#FFFFFF',
};

const darkColors = {
  // Primary - Lighter Lake Blue for dark mode
  primary: '#22D3EE',
  primaryLight: '#67E8F9',
  primaryDark: '#0891B2',
  
  // Secondary - Lighter Nature Green
  secondary: '#34D399',
  secondaryLight: '#6EE7B7',
  secondaryDark: '#10B981',
  
  // Accent colors
  accent: '#FCD34D',
  accentLight: '#FDE68A',
  
  // Status colors
  success: '#34D399',
  successLight: '#6EE7B7',
  warning: '#FCD34D',
  error: '#F87171',
  info: '#60A5FA',
  
  // Severity colors (slightly adjusted for dark mode)
  severity1: '#86EFAC',
  severity2: '#FDE047',
  severity3: '#FDBA74',
  severity4: '#F87171',
  severity5: '#EF4444',
  
  // Category colors (adjusted for dark mode)
  categoryTrash: '#9CA3AF',
  categoryOil: '#D1D5DB',
  categoryPlastic: '#60A5FA',
  categoryVegetation: '#4ADE80',
  categoryAnimal: '#C084FC',
  categoryOther: '#FCD34D',
  
  // Neutrals (inverted)
  white: '#000000',
  black: '#FFFFFF',
  gray50: '#1F2937',
  gray100: '#111827',
  gray200: '#374151',
  gray300: '#4B5563',
  gray400: '#6B7280',
  gray500: '#9CA3AF',
  gray600: '#D1D5DB',
  gray700: '#E5E7EB',
  gray800: '#F3F4F6',
  gray900: '#F9FAFB',
  
  // UI Elements
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  border: '#374151',
  divider: '#374151',
  cardBackground: '#1F2937',
  inputBackground: '#111827',
  headerBackground: '#1F2937',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'ecolake-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<ActualTheme>(systemColorScheme || 'light');

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      setActualTheme(systemColorScheme || 'light');
    } else {
      setActualTheme(theme);
    }
  }, [theme, systemColorScheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const colors = actualTheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
