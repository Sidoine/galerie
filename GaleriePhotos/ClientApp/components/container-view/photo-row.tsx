import { Photo } from "@/services/views";
import { View, StyleSheet } from "react-native";
import ImageCard from "./image-card";
import { PhotoContainerStore } from "@/stores/photo-container";

export function PhotoRow({
  items,
  store,
  columnWidth,
}: {
  items: Photo[];
  store: PhotoContainerStore;
  columnWidth: number;
}) {
  return (
    <View style={styles.rowContainer}>
      {items.map((photo, i) => (
        <View
          key={photo.id}
          style={[
            styles.itemWrapper,
            i === items.length - 1 && styles.itemWrapperLast,
          ]}
        >
          <ImageCard photo={photo} size={columnWidth} store={store} />
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
