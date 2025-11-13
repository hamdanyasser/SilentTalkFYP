/**
 * Design System Tokens
 *
 * Core design tokens for spacing, colors, typography, shadows, and more.
 * These tokens are the foundation of the design system and ensure consistency.
 */

// ============================================================================
// SPACING SCALE (4px base unit)
// ============================================================================
export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
} as const

// ============================================================================
// BORDER RADIUS
// ============================================================================
export const radii = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px', // pill shape
} as const

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const fontSizes = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem', // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem', // 72px
} as const

export const fontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const

export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const

export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const

export const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const

// ============================================================================
// SHADOWS
// ============================================================================
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
  focus: '0 0 0 3px rgba(66, 153, 225, 0.5)',
} as const

// ============================================================================
// BREAKPOINTS
// ============================================================================
export const breakpoints = {
  sm: '640px', // Mobile landscape
  md: '768px', // Tablet
  lg: '1024px', // Desktop
  xl: '1280px', // Large desktop
  '2xl': '1536px', // Extra large desktop
} as const

// ============================================================================
// Z-INDEX SCALE
// ============================================================================
export const zIndices = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const

// ============================================================================
// TRANSITIONS
// ============================================================================
export const transitions = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const

export const easings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// ============================================================================
// SIZES (for components)
// ============================================================================
export const sizes = {
  // Touch target minimum (WCAG 2.5.5)
  touchTarget: '44px',

  // Icon sizes
  icon: {
    xs: '12px',
    sm: '16px',
    base: '20px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },

  // Container max widths
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

// ============================================================================
// COLOR PRIMITIVES
// ============================================================================
export const colors = {
  // Grayscale
  black: '#000000',
  white: '#FFFFFF',

  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Primary (Blue)
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Success (Green)
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Warning (Yellow)
  yellow: {
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FEF08A',
    300: '#FDE047',
    400: '#FACC15',
    500: '#EAB308',
    600: '#CA8A04',
    700: '#A16207',
    800: '#854D0E',
    900: '#713F12',
  },

  // Error (Red)
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Info (Cyan)
  cyan: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },

  // Purple
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
  },
} as const

// ============================================================================
// SEMANTIC COLORS
// ============================================================================
export const semanticColors = {
  // Backgrounds
  bg: {
    primary: colors.white,
    secondary: colors.gray[50],
    tertiary: colors.gray[100],
    inverse: colors.gray[900],
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text
  text: {
    primary: colors.gray[900],
    secondary: colors.gray[600],
    tertiary: colors.gray[500],
    inverse: colors.white,
    disabled: colors.gray[400],
    link: colors.blue[600],
    linkHover: colors.blue[700],
  },

  // Borders
  border: {
    default: colors.gray[300],
    light: colors.gray[200],
    dark: colors.gray[400],
    focus: colors.blue[500],
  },

  // Interactive states
  interactive: {
    hover: colors.gray[100],
    active: colors.gray[200],
    disabled: colors.gray[100],
  },

  // Semantic
  success: colors.green[600],
  warning: colors.yellow[500],
  error: colors.red[600],
  info: colors.cyan[600],
} as const

// ============================================================================
// HIGH CONTRAST THEME
// ============================================================================
export const highContrastColors = {
  bg: {
    primary: colors.black,
    secondary: colors.gray[900],
    tertiary: colors.gray[800],
    inverse: colors.white,
    overlay: 'rgba(0, 0, 0, 0.9)',
  },

  text: {
    primary: colors.white,
    secondary: colors.gray[200],
    tertiary: colors.gray[300],
    inverse: colors.black,
    disabled: colors.gray[500],
    link: colors.blue[300],
    linkHover: colors.blue[200],
  },

  border: {
    default: colors.gray[500],
    light: colors.gray[600],
    dark: colors.gray[400],
    focus: colors.blue[400],
  },

  interactive: {
    hover: colors.gray[800],
    active: colors.gray[700],
    disabled: colors.gray[800],
  },

  success: colors.green[400],
  warning: colors.yellow[400],
  error: colors.red[400],
  info: colors.cyan[400],
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type SpacingKey = keyof typeof spacing
export type RadiusKey = keyof typeof radii
export type FontSizeKey = keyof typeof fontSizes
export type ShadowKey = keyof typeof shadows
export type ColorKey = keyof typeof colors
export type BreakpointKey = keyof typeof breakpoints
