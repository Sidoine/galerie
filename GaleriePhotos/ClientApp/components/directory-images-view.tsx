import { observer } from "mobx-react-lite";
import React, { useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useUi } from "@/stores/ui";
import { useDirectoriesStore } from "@/stores/directories";
import { useMembersStore } from "@/stores/members";
import ImageCard from "./image-card";

export const DirectoryImagesView = observer(function DirectoryImagesView({
  directoryId,
}: {
  directoryId: number;
}) {
  const directoriesStore = useDirectoriesStore();
  const membersStore = useMembersStore();
  const { order, navigateToDirectory } = useUi();
  const directoryContent = directoriesStore.contentLoader.getValue(directoryId);
  const values = directoryContent || [];
  const sortedValues =
    order === "date-desc" ? values.slice().reverse() : values;
  const handleSortDateDesc = useCallback(
    () => navigateToDirectory(directoryId, "date-desc"),
    [directoryId, navigateToDirectory]
  );
  const handleSortDateAsc = useCallback(
    () => navigateToDirectory(directoryId, "date-asc"),
    [directoryId, navigateToDirectory]
  );

  if (values.length === 0) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Photos</Text>
      <View style={styles.actionsContainer}>
        {directoryContent === null && <ActivityIndicator />}
        {values.length > 0 && membersStore.administrator && null}
        {values.length > 0 && (
          <View style={styles.buttonRow}>
            <SortButton
              selected={order === "date-desc"}
              label="Plus récent en premier"
              onPress={handleSortDateDesc}
            />
            <SortButton
              selected={order !== "date-desc"}
              label="Plus ancien en premier"
              onPress={handleSortDateAsc}
            />
          </View>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.imageGrid}>
          {sortedValues.map((x) => (
            <View key={x.id} style={styles.imageItem}>
              <ImageCard value={x} size={110} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
});

const SortButton = ({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.sortButton, selected && styles.sortButtonSelected]}
  >
    <Text
      style={[styles.sortButtonText, selected && styles.sortButtonTextSelected]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  actionsContainer: {
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sortButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  sortButtonSelected: {
    backgroundColor: "#1976d2",
  },
  sortButtonText: {
    color: "#333",
  },
  sortButtonTextSelected: {
    color: "white",
  },
  list: {
    paddingBottom: 40,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  imageItem: {
    marginBottom: 8,
  },
});
