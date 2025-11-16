import { StyleSheet } from 'react-native';

// Color Palette
export const colors = {
  // Primary Colors
  primary: '#1A1A1A',
  white: '#FFFFFF',
  
  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#FAFAFA',
  
  // Text Colors
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#999999',
  
  // Border Colors
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  
  // Status Colors
  success: '#34C759',
  error: '#DC3545',
  errorLight: '#FFF5F5',
  warning: '#FF9500',
  info: '#007AFF',
  
  // Interactive Elements
  buttonPrimary: '#1A1A1A',
  buttonDisabled: '#B0B0B0',
  switchActive: '#1A1A1A',
  switchInactive: '#E5E5E5',
};

// Typography
export const typography = {
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.3,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
};

// Border Radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Common Component Styles
export const commonStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  contentContainer: {
    padding: spacing.xl,
  },
  
  // Card Styles
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  
  // Input Styles
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.regular,
  },
  
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  inputContainer: {
    marginBottom: spacing.lg,
  },
  
  // Button Styles
  button: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  
  buttonDisabled: {
    backgroundColor: colors.buttonDisabled,
    ...shadows.sm,
  },
  
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  buttonSecondary: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  
  buttonSecondaryText: {
    color: colors.textPrimary,
  },
  
  // Text Styles
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: typography.letterSpacing.tight,
  },
  
  subtitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    marginBottom: spacing['3xl'],
  },
  
  heading: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  
  bodyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.textPrimary,
  },
  
  smallText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  
  // Error Styles
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  
  // Section Header
  sectionHeader: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  
  sectionHeaderText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
});

// Helper function to create consistent spacing
export const createSpacing = (multiplier = 1) => spacing.md * multiplier;

// Helper function to create consistent margins
export const margins = {
  top: (size) => ({ marginTop: spacing[size] || spacing.md }),
  bottom: (size) => ({ marginBottom: spacing[size] || spacing.md }),
  left: (size) => ({ marginLeft: spacing[size] || spacing.md }),
  right: (size) => ({ marginRight: spacing[size] || spacing.md }),
  vertical: (size) => ({ marginVertical: spacing[size] || spacing.md }),
  horizontal: (size) => ({ marginHorizontal: spacing[size] || spacing.md }),
};

// Helper function to create consistent padding
export const paddings = {
  top: (size) => ({ paddingTop: spacing[size] || spacing.md }),
  bottom: (size) => ({ paddingBottom: spacing[size] || spacing.md }),
  left: (size) => ({ paddingLeft: spacing[size] || spacing.md }),
  right: (size) => ({ paddingRight: spacing[size] || spacing.md }),
  vertical: (size) => ({ paddingVertical: spacing[size] || spacing.md }),
  horizontal: (size) => ({ paddingHorizontal: spacing[size] || spacing.md }),
};
