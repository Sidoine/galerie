// Thème centralisé pour l'application React Native
// Permet de remplacer progressivement les valeurs codées en dur.

export const palette = {
  primary: "#1976d2",
  primaryVariant: "#1565c0",
  accent: "#ffca28",
  danger: "#d32f2f",
  warning: "#ff9800",
  success: "#2e7d32",
  surface: "#dee",
  surfaceAlt: "#333",
  surfaceElevated: "#1e1e1e",
  background: "#fff",
  border: "#444",
  textPrimary: "#111",
  textSecondary: "#333",
  textMuted: "#888",
};

export const spacing = (factor: number) => factor * 4;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 18,
};

export const typography = {
  title: { fontSize: 20, fontWeight: "600" as const },
  subtitle: { fontSize: 16, fontWeight: "500" as const },
  body: { fontSize: 14 },
  caption: { fontSize: 12, letterSpacing: 0.5 },
  small: { fontSize: 11 },
};

export const theme = {
  palette,
  spacing,
  radius,
  typography,
};

export type Theme = typeof theme;
