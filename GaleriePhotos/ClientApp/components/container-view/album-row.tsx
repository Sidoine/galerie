import { PhotoContainer, PhotoContainerStore } from "@/stores/photo-container";
import { View, StyleSheet } from "react-native";
import SubdirectoryCard from "./subdirectory-card";
import { gap } from "./item-types";

export function AlbumRow({
  items,
  store,
  columnWidth,
}: {
  items: PhotoContainer[];
  store: PhotoContainerStore;
  columnWidth: number;
}) {
  return (
    <View style={styles.rowContainer}>
      {items.map((subDir, i) => (
        <View
          key={subDir.id}
          style={[
            styles.itemWrapper,
            i === items.length - 1 && styles.itemWrapperLast,
          ]}
        >
          <SubdirectoryCard
            directory={subDir}
            size={columnWidth * 2 + gap}
            store={store}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flex: 1,
    padding: 4,
    flexDirection: "row",
  },
  itemWrapper: {
    marginRight: 4,
    marginBottom: 0,
  },
  itemWrapperLast: {
    marginRight: 0,
  },
});
