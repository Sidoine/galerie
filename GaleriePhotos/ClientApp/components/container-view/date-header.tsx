import { MaterialIcons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { useSelectedPhotosStore } from "@/stores/selected-photos";
import { DateHeaderItem } from "./item-types";
import { useMembersStore } from "@/stores/members";
import { useCallback } from "react";
import { PhotoContainerStore } from "@/stores/photo-container";

function DateHeader({
  item,
  store,
}: {
  item: DateHeaderItem;
  store: PhotoContainerStore;
}) {
  const selectedPhotosStore = useSelectedPhotosStore();
  const allSelected = selectedPhotosStore.areAllSelected(item.photoIds);
  const someSelected =
    !allSelected && selectedPhotosStore.areSomeSelected(item.photoIds);
  const membersStore = useMembersStore();

  const handleDateCheckboxToggle = useCallback(() => {
    if (selectedPhotosStore.areAllSelected(item.photoIds)) {
      // If all are selected, deselect them
      selectedPhotosStore.deselectPhotos(item.photoIds);
    } else {
      // If none or some are selected, select all
      const photosToSelect = store.paginatedPhotosStore.photos.filter((photo) =>
        item.photoIds.includes(photo.id)
      );
      selectedPhotosStore.selectPhotos(photosToSelect);
    }
  }, [item.photoIds, selectedPhotosStore, store.paginatedPhotosStore.photos]);

  return (
    <View style={styles.dateHeader}>
      <View style={styles.dateHeaderTextWrapper}>
        <Text style={styles.dateHeaderText}>{item.title}</Text>
        {item.placeNames.length > 0 && (
          <Text
            style={styles.dateHeaderPlaces}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.placeNames.join(" • ")}
          </Text>
        )}
      </View>
      {membersStore.administrator && (
        <TouchableOpacity
          accessibilityLabel="Sélectionner toutes les photos de cette date"
          style={[
            styles.dateHeaderCheckbox,
            allSelected && styles.dateHeaderCheckboxSelected,
          ]}
          onPress={handleDateCheckboxToggle}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {allSelected && <MaterialIcons name="check" size={18} color="#fff" />}
          {someSelected && (
            <MaterialIcons
              name="remove"
              size={18}
              color="rgba(255, 255, 255, 0.7)"
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default observer(DateHeader);

const styles = StyleSheet.create({
  dateHeader: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateHeaderTextWrapper: {
    flex: 1,
    flexDirection: "row",
    paddingRight: 12,
    alignItems: "baseline",
    gap: 8,
  },
  dateHeaderText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  dateHeaderPlaces: {
    marginTop: 2,
    fontSize: 12,
    color: "#666",
  },
  dateHeaderCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1976d2",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  dateHeaderCheckboxSelected: {
    backgroundColor: "#1976d2",
    borderColor: "#1976d2",
  },
});
