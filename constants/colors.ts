// EcoLake Theme Colors
export const EcoColors = {
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
};

export const CategoryIcons: Record<string, string> = {
  trash: '🗑️',
  oil: '🛢️',
  plastic: '♻️',
  vegetation: '🌿',
  animal: '🐟',
  other: '⚠️',
};

export const StatusColors: Record<string, string> = {
  submitted: EcoColors.info,
  verified: EcoColors.primary,
  assigned: EcoColors.accent,
  in_progress: EcoColors.warning,
  cleaned: EcoColors.success,
  closed: EcoColors.gray500,
  rejected: EcoColors.error,
};

export const getSeverityColor = (severity: number): string => {
  switch (severity) {
    case 1: return EcoColors.severity1;
    case 2: return EcoColors.severity2;
    case 3: return EcoColors.severity3;
    case 4: return EcoColors.severity4;
    case 5: return EcoColors.severity5;
    default: return EcoColors.gray400;
  }
};
