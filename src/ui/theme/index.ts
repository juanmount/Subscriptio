export const Colors = {
  primary: '#6B52E0',
  primaryLight: '#EDE9FF',
  background: '#FFFFFF',
  appBackground: '#F5F3FF',
  backgroundSecondary: '#F2F2F7',
  card: '#FFFFFF',
  border: '#E8E4F5',

  textPrimary: '#1A1A2E',
  textSecondary: '#6C6880',
  textTertiary: '#AEAAB8',
  textInverse: '#FFFFFF',

  success: '#2DCE7A',
  warning: '#FF9500',
  error: '#FF3B30',
  pink: '#FF6B9D',
  orange: '#FF8C42',
  teal: '#00C2A8',

  tabActive: '#6B52E0',
  tabInactive: '#AEAAB8',

  premiumBg: '#EDE9FF',

  badge: {
    ia: { bg: '#EDE9FF', text: '#6B52E0' },
    entertainment: { bg: '#E3F9E5', text: '#2D9E40' },
    work: { bg: '#E5F0FF', text: '#2B6ED4' },
    music: { bg: '#FFF0F0', text: '#E03030' },
    storage: { bg: '#FFF8E5', text: '#B07800' },
    fitness: { bg: '#E5FFF5', text: '#00875A' },
    news: { bg: '#F0F0FF', text: '#5050CC' },
    security: { bg: '#FFF4E5', text: '#CC6600' },
    design: { bg: '#FFE5F5', text: '#CC0066' },
    other: { bg: '#F0F0F0', text: '#666666' },
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const Typography = {
  screenTitle: { fontSize: 30, fontWeight: '700' as const },
  sectionTitle: { fontSize: 17, fontWeight: '600' as const },
  subscriptionName: { fontSize: 16, fontWeight: '500' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  amountLarge: { fontSize: 34, fontWeight: '700' as const },
  amountMedium: { fontSize: 20, fontWeight: '600' as const },
  amountSmall: { fontSize: 15, fontWeight: '400' as const },
  label: { fontSize: 11, fontWeight: '500' as const },
} as const;
