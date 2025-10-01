import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { observer } from "mobx-react-lite";
import { usePlacesStore } from "@/stores/places";
import { useUi } from "@/stores/ui";
import { theme } from "@/stores/theme";
import { PhotoGroup } from "@/services/views";

export interface PlacePhotosViewProps {
  placeId: number;
}

export const PlacePhotosView = observer(({ placeId }: PlacePhotosViewProps) => {
  const placesStore = usePlacesStore();
  const { navigateToPhotoGroup } = useUi();
  const placePhotos = placesStore.getPlacePhotos(placeId);
  const { width } = useWindowDimensions();

  useEffect(() => {
    placesStore.loadPlacePhotos(placeId);
  }, [placeId, placesStore]);

  if (placesStore.loading && !placePhotos) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading place photos...</Text>
      </View>
    );
  }

  if (!placePhotos) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No photos found for this place</Text>
      </View>
    );
  }

  const { place, photoGroups } = placePhotos;

  // Calculate grid layout for photo groups
  const columnWidth = 300;
  const gap = 16;
  const cols = Math.max(1, Math.floor((width - gap * 2) / (columnWidth + gap)));

  return (
    <ScrollView style={styles.container}>
      {/* Place Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.placeName}>{place.name}</Text>
        <Text style={styles.placeInfo}>
          {place.photoCount} photo{place.photoCount !== 1 ? "s" : ""} •{" "}
          {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
        </Text>
        <Text style={styles.placeDate}>
          Created {new Date(place.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Photo Groups */}
      <View style={styles.groupsContainer}>
        <Text style={styles.groupsTitle}>Photo Collections</Text>
        <View style={styles.groupsGrid}>
          {photoGroups.map((group, index) => (
            <PhotoGroupCard
              key={index}
              group={group}
              onPress={() => navigateToPhotoGroup(group.photoIds)}
              width={Math.floor((width - gap * (cols + 1)) / cols)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
});

interface PhotoGroupCardProps {
  group: PhotoGroup;
  onPress: () => void;
  width: number;
}

const PhotoGroupCard = ({ group, onPress, width }: PhotoGroupCardProps) => {
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString();
    } else if (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth()
    ) {
      return `${start.toLocaleDateString()} - ${end.getDate()}`;
    } else {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
  };

  return (
    <TouchableOpacity style={[styles.groupCard, { width }]} onPress={onPress}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{group.title}</Text>
        <Text style={styles.groupCount}>
          {group.photoCount} photo{group.photoCount !== 1 ? "s" : ""}
        </Text>
      </View>
      <Text style={styles.groupDateRange}>
        {formatDateRange(group.startDate, group.endDate)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.palette.background,
  },
  loadingText: {
    color: theme.palette.textPrimary,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.palette.background,
    padding: 20,
  },
  emptyText: {
    color: theme.palette.textPrimary,
    fontSize: 18,
    textAlign: "center",
  },
  headerContainer: {
    padding: 20,
    backgroundColor: theme.palette.surface,
    marginBottom: 16,
  },
  placeName: {
    color: theme.palette.textPrimary,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  placeInfo: {
    color: theme.palette.textSecondary,
    fontSize: 16,
    marginBottom: 4,
  },
  placeDate: {
    color: theme.palette.textSecondary,
    fontSize: 14,
  },
  groupsContainer: {
    padding: 16,
  },
  groupsTitle: {
    color: theme.palette.textPrimary,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  groupsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  groupCard: {
    backgroundColor: theme.palette.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 16,
    minHeight: 100,
  },
  groupHeader: {
    marginBottom: 8,
  },
  groupTitle: {
    color: theme.palette.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  groupCount: {
    color: theme.palette.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  groupDateRange: {
    color: theme.palette.textSecondary,
    fontSize: 14,
  },
});
