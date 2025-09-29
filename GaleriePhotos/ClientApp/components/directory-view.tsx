import React, { useCallback, useMemo } from "react";
import {
  SectionList,
  SectionListData,
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useDirectoriesStore } from "@/stores/directories";
import { useUi } from "@/stores/ui";
import { Photo, Directory } from "@/services/views";
import ImageCard from "./image-card";
import SubdirectoryCard from "./subdirectory-card";

export interface DirectoryViewProps {
  id: number;
}

function splitInRows<T>(data: T[], cols: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < data.length; i += cols) {
    rows.push(data.slice(i, i + cols));
  }
  return rows;
}

interface Section {
  title: string;
}

export const DirectoryView = observer(({ id }: { id: number }) => {
  const { width } = useWindowDimensions();
  const columnWidth = 184; // approximate desired width
  const gap = 4;
  const cols = Math.max(1, Math.floor((width - gap) / (columnWidth + gap)));

  const directoriesStore = useDirectoriesStore();
  const directories = directoriesStore.subDirectoriesLoader.getValue(id);

  const { order, navigateToDirectory } = useUi();
  const directoryContent = directoriesStore.contentLoader.getValue(id);
  const values = directoryContent || [];
  const sortedValues =
    order === "date-desc" ? values.slice().reverse() : values;

  const data = useMemo(() => {
    const result: SectionListData<(Directory | Photo)[], Section>[] = [];
    if (directories && directories.length > 0) {
      result.push({
        title: "Albums",
        data: splitInRows(directories, cols) || [],
        renderItem: ({ item }) => (
          <View style={styles.container}>
            {item.map((subDir) => (
              <SubdirectoryCard
                key={subDir.id}
                directory={subDir as Directory}
              />
            ))}
          </View>
        ),
      });
    }
    if (sortedValues && sortedValues.length > 0) {
      result.push({
        title: "Photos",
        data: splitInRows(sortedValues, cols) || [],
        renderItem: ({ item }) => (
          <View style={styles.container}>
            {item.map((photo) => (
              <ImageCard
                value={photo as Photo}
                size={columnWidth}
                key={photo.id}
              />
            ))}
          </View>
        ),
      });
    }
    return result;
  }, [directories, sortedValues, cols]);

  const handleSortDateDesc = useCallback(
    () => navigateToDirectory(id, "date-desc"),
    [id, navigateToDirectory]
  );
  const handleSortDateAsc = useCallback(
    () => navigateToDirectory(id, "date-asc"),
    [id, navigateToDirectory]
  );

  return (
    <SectionList
      sections={data}
      keyExtractor={(item) => item[0].id.toString()}
      renderSectionHeader={({ section }) => (
        <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: "600" }}>
            {section.title}
          </Text>
          {section.title === "Photos" && (
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
      )}
    />
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
    flex: 1,
    padding: 4,
    flexDirection: "row",
    gap: 4,
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
});
