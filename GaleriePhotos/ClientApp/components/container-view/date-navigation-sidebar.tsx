import React, { useCallback, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { observer } from "mobx-react-lite";
import { DateJump } from "@/services/views";

// Constants for auto-scroll behavior
const DATE_ITEM_HEIGHT = 44; // Height of each date item (padding + margins)
const CENTERING_OFFSET = 100; // Offset to center the item in the viewport
const SCROLL_DELAY_MS = 100; // Delay before scrolling to ensure view is rendered

interface DateNavigationSidebarProps {
  dateJumps: DateJump[];
  visible: boolean;
  onDateSelect: (date: string) => void;
  sortOrder: "date-asc" | "date-desc";
  firstVisibleDate?: string | null;
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
    sortOrder,
    firstVisibleDate,
  }: DateNavigationSidebarProps) {
    const scrollViewRef = useRef<ScrollView>(null);
    const dateItemRefs = useRef<Map<string, View>>(new Map());

    const handleDatePress = useCallback(
      (dateJump: DateJump) => {
        onDateSelect(dateJump.date);
      },
      [onDateSelect]
    );

    // Sort dateJumps according to the current sort order
    const sortedDateJumps = useMemo(() => {
      const jumps = [...dateJumps];
      if (sortOrder === "date-desc") {
        jumps.reverse();
      }
      return jumps;
    }, [dateJumps, sortOrder]);

    // Scroll to center the first visible date when it changes
    useEffect(() => {
      if (!visible || !firstVisibleDate || sortedDateJumps.length === 0) {
        return;
      }

      const index = sortedDateJumps.findIndex(
        (dj) => dj.date === firstVisibleDate
      );
      if (index === -1) {
        return;
      }

      // Use a timeout to ensure the view is rendered
      const timer = setTimeout(() => {
        const offset = Math.max(0, index * DATE_ITEM_HEIGHT - CENTERING_OFFSET);
        scrollViewRef.current?.scrollTo({ y: offset, animated: true });
      }, SCROLL_DELAY_MS);

      return () => clearTimeout(timer);
    }, [visible, firstVisibleDate, sortedDateJumps]);

    if (!visible || dateJumps.length === 0) {
      return null;
    }

    return (
      <View style={styles.container} testID="date-navigation-sidebar">
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedDateJumps.map((dateJump) => {
            const isFirstVisible = dateJump.date === firstVisibleDate;
            return (
              <TouchableOpacity
                key={dateJump.date}
                ref={(ref) => {
                  if (ref) {
                    dateItemRefs.current.set(dateJump.date, ref as unknown as View);
                  }
                }}
                style={[
                  styles.dateItem,
                  isFirstVisible && styles.dateItemHighlighted,
                ]}
                onPress={() => handleDatePress(dateJump)}
                accessibilityLabel={`Aller à ${dateJump.label}`}
                accessibilityRole="button"
                testID={`date-link-${dateJump.date}`}
              >
                <Text
                  style={[
                    styles.dateText,
                    isFirstVisible && styles.dateTextHighlighted,
                  ]}
                  numberOfLines={2}
                >
                  {dateJump.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
  dateItemHighlighted: {
    backgroundColor: "rgba(25, 118, 210, 0.25)",
    borderWidth: 1,
    borderColor: "#1976d2",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1976d2",
    textAlign: "center",
  },
  dateTextHighlighted: {
    fontSize: 14,
    fontWeight: "700",
  },
});
