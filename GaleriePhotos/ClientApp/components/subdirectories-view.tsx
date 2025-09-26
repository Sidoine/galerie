import { observer } from "mobx-react-lite";
import React from "react";
import {
  ActivityIndicator,
  View,
  Text,
  useWindowDimensions,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useDirectoriesStore } from "@/stores/directories";
import SubdirectoryCard from "./subdirectory-card";

const SubdirectoriesView = observer(function SubdirectoriesView({
  id,
}: {
  id: number;
}) {
  const directoriesStore = useDirectoriesStore();
  const directories = directoriesStore.subDirectoriesLoader.getValue(id);
  const { width } = useWindowDimensions();
  const columnWidth = 150; // approximate desired width
  const gap = 12;
  const cols = Math.max(
    1,
    Math.min(4, Math.floor((width - 32) / (columnWidth + gap)))
  );
  if (!directories) return <ActivityIndicator />;
  if (directories.length === 0) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Albums</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {directories.map((x) => (
          <View
            key={x.id}
            style={[
              styles.gridItem,
              { width: (width - 32 - gap * (cols - 1)) / cols },
            ]}
          >
            <SubdirectoryCard directory={x} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
});
export default SubdirectoriesView;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    marginBottom: 12,
  },
});
