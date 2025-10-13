import React from "react";
import {
  Modal,
  Pressable,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from "react-native";

export interface ActionMenuItem {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  testID?: string;
}

export interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  items: ActionMenuItem[];
  minWidth?: number;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  visible,
  onClose,
  items,
  minWidth = 280,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.light, { minWidth }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {items.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.item}
                onPress={() => {
                  onClose();
                  // Defer pour laisser l'animation se terminer
                  setTimeout(() => item.onPress(), 0);
                }}
                testID={item.testID}
                accessibilityRole="button"
              >
                {item.icon && <View style={styles.icon}>{item.icon}</View>}
                <Text style={[styles.label, item.danger && styles.dangerLabel]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.item}
              onPress={onClose}
              accessibilityRole="button"
            >
              <Text style={styles.label}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  light: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 15,
    color: "#222",
  },
  dangerLabel: {
    color: "#c62828",
    fontWeight: "600",
  },
});
