import React from "react";
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { palette, radius } from "@/stores/theme";

export type DashboardCardProps = {
  title: string;
  value: React.ReactNode;
  description: string;
  onPress?: () => void;
  disabled?: boolean;
  rightAccessory?: React.ReactNode;
  actionText?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  description,
  onPress,
  disabled = false,
  rightAccessory,
  actionText,
  style,
}) => {
  const isPressable = !!onPress && !disabled;

  const renderValue = () => {
    if (typeof value === "string" || typeof value === "number") {
      return <Text style={styles.value}>{value}</Text>;
    }
    return value;
  };

  const renderAction = () => {
    if (!actionText) {
      return null;
    }

    if (typeof actionText === "string") {
      return <Text style={styles.action}>{actionText}</Text>;
    }

    return <View style={styles.actionContainer}>{actionText}</View>;
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={isPressable ? onPress : undefined}
      activeOpacity={isPressable ? 0.75 : 1}
      disabled={disabled}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {rightAccessory}
      </View>
      {renderValue()}
      <Text style={styles.description}>{description}</Text>
      {renderAction()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    color: palette.textSecondary,
    marginBottom: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: "bold",
    color: palette.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  action: {
    marginTop: 12,
    fontSize: 14,
    color: palette.primary,
    fontWeight: "600",
    textAlign: "right",
  },
  actionContainer: {
    marginTop: 12,
    alignItems: "flex-end",
  },
});

export default DashboardCard;
