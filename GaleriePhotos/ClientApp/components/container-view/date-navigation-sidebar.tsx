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
import { DateJumpType } from "@/services/enums";

// Constants for auto-scroll behavior
const DATE_ITEM_HEIGHT = 44; // Height of each date item (padding + margins)
const CENTERING_OFFSET = 100; // Offset to center the item in the viewport
const SCROLL_DELAY_MS = 100; // Delay before scrolling to ensure view is rendered

/**
 * Calculate the end date for a given period (month or year)
 * For months: returns the last day of the month at 23:59:59.999
 * For years: returns December 31st at 23:59:59.999
 */
function getEndOfPeriod(dateStr: string, type: DateJumpType): string {
  const date = new Date(dateStr);

  if (type === DateJumpType.Month) {
    // Get the last day of the month
    // Set to the first day of next month, then subtract 1 millisecond
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const endDate = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0) - 1);
    return endDate.toISOString();
  } else if (type === DateJumpType.Year) {
    // Get the last moment of the year (December 31st, 23:59:59.999)
    const year = date.getUTCFullYear();
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    return endDate.toISOString();
  }

  return dateStr;
}

interface DateNavigationSidebarProps {
  dateJumps: DateJump[];
  visible: boolean;
  onDateSelect: (date: string) => void;
  sortOrder: "date-asc" | "date-desc";
  firstVisibleDate?: DateJump | null;
}

/**
 * Sidebar component that displays a list of dates for quick navigation
 * Appears while scrolling and auto-hides after inactivity
 */
export const DateNavigationSidebar = observer(function DateNavigationSidebar({
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
      // When sorting in descending order (most recent first),
      // navigate to the end of the period instead of the beginning
      const dateToJump =
        sortOrder === "date-desc"
          ? getEndOfPeriod(dateJump.date, dateJump.type)
          : dateJump.date;

      onDateSelect(dateToJump);
    },
    [onDateSelect, sortOrder]
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

    const index = sortedDateJumps.findIndex((dj) => dj === firstVisibleDate);
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
          const isFirstVisible = dateJump === firstVisibleDate;
          return (
            <TouchableOpacity
              key={dateJump.date}
              ref={(ref) => {
                if (ref) {
                  dateItemRefs.current.set(
                    dateJump.date,
                    ref as unknown as View
                  );
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
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 8,
    top: 80,
    bottom: 80,
    width: 120,
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
    backgroundColor: "rgba(238, 240, 243, 0.5)",
  },
  dateItemHighlighted: {
    backgroundColor: "rgba(104, 117, 129, 0.5)",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
    color: "black",
    textAlign: "center",
  },
  dateTextHighlighted: {
    fontSize: 14,
    fontWeight: "700",
  },
});
