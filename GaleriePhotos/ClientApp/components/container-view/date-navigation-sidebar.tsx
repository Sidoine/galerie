import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { observer } from "mobx-react-lite";
import { Photo } from "@/services/views";

export interface DateGroup {
  date: string; // YYYY-MM-DD or YYYY-MM
  displayTitle: string;
  firstPhotoDate: string; // ISO date string to use for jumpToDate
}

interface DateNavigationSidebarProps {
  photos: Photo[];
  groupByDay: boolean;
  visible: boolean;
  onDateSelect: (date: string) => void;
  order: "date-desc" | "date-asc";
}

/**
 * Sidebar component that displays a list of dates for quick navigation
 * Appears while scrolling and auto-hides after inactivity
 */
export const DateNavigationSidebar = observer(
  function DateNavigationSidebar({
    photos,
    groupByDay,
    visible,
    onDateSelect,
    order,
  }: DateNavigationSidebarProps) {
    // Extract unique date groups from photos
    const dateGroups = useMemo(() => {
      if (photos.length === 0) return [];

      const groups = new Map<string, Photo>();

      photos.forEach((photo) => {
        const date = new Date(photo.dateTime);
        const key = groupByDay
          ? date.toISOString().split("T")[0] // YYYY-MM-DD
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM

        // Store the first photo for this date group
        if (!groups.has(key)) {
          groups.set(key, photo);
        }
      });

      const dateGroupsArray = Array.from(groups.entries()).map(
        ([date, photo]) => ({
          date,
          displayTitle: formatDateGroupTitle(date, groupByDay),
          firstPhotoDate: photo.dateTime,
        })
      );

      // Sort by date
      dateGroupsArray.sort((a, b) =>
        order === "date-desc"
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date)
      );

      return dateGroupsArray;
    }, [photos, groupByDay, order]);

    const handleDatePress = useCallback(
      (dateGroup: DateGroup) => {
        onDateSelect(dateGroup.firstPhotoDate);
      },
      [onDateSelect]
    );

    if (!visible || dateGroups.length === 0) {
      return null;
    }

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {dateGroups.map((dateGroup) => (
            <TouchableOpacity
              key={dateGroup.date}
              style={styles.dateItem}
              onPress={() => handleDatePress(dateGroup)}
              accessibilityLabel={`Aller à ${dateGroup.displayTitle}`}
              accessibilityRole="button"
            >
              <Text style={styles.dateText} numberOfLines={2}>
                {dateGroup.displayTitle}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }
);

/**
 * Formats the date group title for display in the sidebar
 */
function formatDateGroupTitle(dateKey: string, isDay: boolean): string {
  if (isDay) {
    const date = new Date(dateKey + "T00:00:00");
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } else {
    const [year, month] = dateKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
    }).format(date);
  }
}

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
