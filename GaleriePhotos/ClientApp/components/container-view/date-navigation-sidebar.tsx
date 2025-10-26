import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { observer } from "mobx-react-lite";
import { DateJump } from "@/services/views";

interface DateNavigationSidebarProps {
  dateJumps: DateJump[];
  visible: boolean;
  onDateSelect: (date: string) => void;
}

/**
 * Sidebar component that displays a list of dates for quick navigation
 * Appears while scrolling and auto-hides after inactivity
 */
export const DateNavigationSidebar = observer(
  function DateNavigationSidebar({
    dateJumps,
    visible,
    onDateSelect,
  }: DateNavigationSidebarProps) {
    const handleDatePress = useCallback(
      (dateJump: DateJump) => {
        onDateSelect(dateJump.date);
      },
      [onDateSelect]
    );

    if (!visible || dateJumps.length === 0) {
      return null;
    }

    return (
      <View style={styles.container} testID="date-navigation-sidebar">
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {dateJumps.map((dateJump) => (
            <TouchableOpacity
              key={dateJump.date}
              style={styles.dateItem}
              onPress={() => handleDatePress(dateJump)}
              accessibilityLabel={`Aller à ${dateJump.label}`}
              accessibilityRole="button"
              testID={`date-link-${dateJump.date}`}
            >
              <Text style={styles.dateText} numberOfLines={2}>
                {dateJump.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 8,
    top: 80,
    bottom: 80,
    width: 120,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 8,
  },
  dateItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(25, 118, 210, 0.1)",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1976d2",
    textAlign: "center",
  },
});
