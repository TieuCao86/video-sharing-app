import { colors } from './colors';

export const theme = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    round: 9999,
  },
  typography: {
    title: { fontSize: 20, fontWeight: 'bold' as const },
    subtitle: { fontSize: 16, fontWeight: 'bold' as const },
    body: { fontSize: 14 },
    caption: { fontSize: 12 },
    small: { fontSize: 10 },
  },
};

