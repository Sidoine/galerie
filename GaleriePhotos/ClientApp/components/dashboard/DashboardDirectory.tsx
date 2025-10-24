import React from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import { palette, radius } from "@/stores/theme";

type DashboardCardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

const DashboardDirectory: React.FC<DashboardCardProps> = ({
  children,
  onPress,
  style,
  disabled = false,
}) => {
  const cardStyle = [styles.card, style];
  const isInteractive = Boolean(onPress) && !disabled;

  if (isInteractive) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

type ShadowStyle = ViewStyle & { boxShadow?: string };

const directoryShadowStyle = Platform.select<ShadowStyle>({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  android: {
    elevation: 1,
  },
  web: {
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.08)",
  },
  default: {
    elevation: 1,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 8,
    ...directoryShadowStyle,
  },
});

export default DashboardDirectory;
