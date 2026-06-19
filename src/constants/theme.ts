/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Backgrounds
    background: '#F4F6F9',
    backgroundElevated: '#FFFFFF',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',

    // Borders
    border: '#F4F4F5',
    borderLight: '#E4E4E7',

    // Text
    text: '#18181B',
    textSecondary: '#71717A',
    textMuted: '#A1A1AA',

    // Accent
    accent: '#10B981',
    accentLight: '#ECFDF5',
    accentBorder: '#D1FAE5',
    accentText: '#047857',
    loadingAnimation: "#6C63FF",

    // Danger
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    dangerBorder: '#FCA5A5',

    // Warning (No Pix badge)
    warningLight: '#FFF7ED',
    warningBorder: '#FFEDD5',
    warningText: '#C2410C',

    // Cards & Components
    cardBackground: '#FFFFFF',
    inputBackground: '#F4F6F9',
    modalOverlay: 'rgba(9, 9, 11, 0.6)',

    // Navigation
    navigationBar: '#FFFFFF',
    navigationBarButtons: 'dark' as const,
    tabBarActive: '#00C853',
    tabBarInactive: '#D1D5DB',
    tabBarBorder: '#F3F4F6',

    // Info badge (shared/collective)
    infoLight: '#E0F2FE',
    infoText: '#0284C7',

    // Misc
    skeleton: '#F8FAFC',
    divider: '#EEF2F7',
    icon: '#71717A',
    iconMuted: '#9CA3AF',
    darkCard: '#18181B',
    darkCardText: '#FFFFFF',
  },
  dark: {
    // Backgrounds
    background: '#0F1115',
    backgroundElevated: '#1A1D23',
    backgroundElement: '#24272E',
    backgroundSelected: '#2E3236',

    // Borders
    border: '#2A2D33',
    borderLight: '#35393F',

    // Text
    text: '#F0F0F3',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',

    // Accent
    accent: '#34D399',
    accentLight: '#0D2818',
    accentBorder: '#166534',
    accentText: '#6EE7B7',
    loadingAnimation: "#FF9500",

    // Danger
    danger: '#F87171',
    dangerLight: '#2D1515',
    dangerBorder: '#7F1D1D',

    // Warning (No Pix badge)
    warningLight: '#2D1F0E',
    warningBorder: '#92400E',
    warningText: '#FB923C',

    // Cards & Components
    cardBackground: '#1A1D23',
    inputBackground: '#24272E',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',

    // Navigation
    navigationBar: '#0F1115',
    navigationBarButtons: 'light' as const,
    tabBarActive: '#34D399',
    tabBarInactive: '#4B5563',
    tabBarBorder: '#2A2D33',

    // Info badge (shared/collective)
    infoLight: '#0C2D48',
    infoText: '#38BDF8',

    // Misc
    skeleton: '#24272E',
    divider: '#2A2D33',
    icon: '#9CA3AF',
    iconMuted: '#6B7280',
    darkCard: '#24272E',
    darkCardText: '#F0F0F3',
  },
} as const;

export type ThemeColors = typeof Colors.light;
export type ThemeColor = keyof ThemeColors;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
