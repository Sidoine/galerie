import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewProps,
  TextProps,
  GestureResponderEvent,
} from "react-native";

export const Row: React.FC<ViewProps> = ({ style, ...props }) => (
  <View style={[styles.row, style]} {...props} />
);
export const Column: React.FC<ViewProps> = ({ style, ...props }) => (
  <View style={[styles.column, style]} {...props} />
);
export const Heading: React.FC<
  TextProps & { level?: 1 | 2 | 3 | 4 | 5 | 6 }
> = ({ style, level = 2, ...props }) => {
  const fontSizes: Record<number, number> = {
    1: 32,
    2: 24,
    3: 20,
    4: 16,
    5: 14,
    6: 12,
  };
  return (
    <Text
      style={[{ fontSize: fontSizes[level], fontWeight: "600" }, style]}
      {...props}
    />
  );
};
export const ButtonRN: React.FC<{
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: "primary" | "default";
}> = ({ title, onPress, variant = "default" }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.button, variant === "primary" && styles.buttonPrimary]}
  >
    <Text
      style={[
        styles.buttonText,
        variant === "primary" && styles.buttonTextPrimary,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  column: { flexDirection: "column" },
  button: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  buttonPrimary: { backgroundColor: "#1976d2" },
  buttonText: { color: "#333" },
  buttonTextPrimary: { color: "#fff" },
});
