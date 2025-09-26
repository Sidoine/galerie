import { observer } from "mobx-react-lite";
import React, { useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  useWindowDimensions,
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

  // Calculer le nombre de colonnes basé sur la largeur de l'écran
  const screenWidth = useWindowDimensions().width;
  const imageSize = 110;
  const padding = 12;
  const gap = 8;
  const numColumns = Math.floor(
    (screenWidth - 2 * padding + gap) / (imageSize + gap)
  );

  const handleSortDateDesc = useCallback(
    () => navigateToDirectory(directoryId, "date-desc"),
    [directoryId, navigateToDirectory]
  );
  const handleSortDateAsc = useCallback(
    () => navigateToDirectory(directoryId, "date-asc"),
    [directoryId, navigateToDirectory]
  );

  const renderImageItem = useCallback(
    ({ item }: { item: any }) => (
      <View style={styles.imageItem}>
        <ImageCard value={item} size={110} />
      </View>
    ),
    []
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
      <FlatList
        key={numColumns}
        data={sortedValues}
        renderItem={renderImageItem}
        numColumns={numColumns}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        showsVerticalScrollIndicator={false}
      />
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
  row: {
    justifyContent: "space-around",
    paddingHorizontal: 4,
  },
  imageItem: {
    marginBottom: 8,
    flex: 1,
    alignItems: "center",
  },
});
