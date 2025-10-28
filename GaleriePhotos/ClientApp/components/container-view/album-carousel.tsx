import { PhotoContainer, PhotoContainerStore } from "@/stores/photo-container";
import { View, StyleSheet, ScrollView } from "react-native";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import SubdirectoryCard from "./subdirectory-card";
import { gap } from "./item-types";

export const AlbumCarousel = observer(function AlbumCarousel({
  items,
  store,
  columnWidth,
}: {
  items: PhotoContainer[];
  store: PhotoContainerStore;
  columnWidth: number;
}) {
  // For carousel, we want larger cards than in grid
  const cardSize = useMemo(() => columnWidth * 2 + gap, [columnWidth]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scrollView}
    >
      {items.map((subDir, i) => (
        <View
          key={subDir.id}
          style={[
            styles.itemWrapper,
            i === items.length - 1 && styles.itemWrapperLast,
          ]}
        >
          <SubdirectoryCard directory={subDir} size={cardSize} store={store} />
        </View>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  itemWrapper: {
    marginRight: gap,
  },
  itemWrapperLast: {
    marginRight: 4,
  },
});
