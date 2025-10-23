import React, { useState, useCallback } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform, Pressable } from "react-native";
import { observer } from "mobx-react-lite";
import { Photo } from "@/services/views";
import { usePhotosStore } from "@/stores/photos";
import { Link } from "expo-router";
import { PhotoContainerStore } from "@/stores/photo-container";
import { MaterialIcons } from "@expo/vector-icons";
import { usePhotoSelectionStore } from "@/stores/photo-selection";

interface ImageCardProps {
  photo: Photo;
  size?: number;
  store: PhotoContainerStore;
}

const ImageCard = observer(function ImageCard({
  photo,
  store,
  size = 100,
}: ImageCardProps) {
  const photosStore = usePhotosStore();
  const selectionStore = usePhotoSelectionStore();
  const { getPhotoLink } = store;
  const [isHovered, setIsHovered] = useState(false);

  const thumbnailUri = photosStore.getThumbnail(photo.publicId);
  const isSelected = selectionStore.isSelected(photo.id);
  const showCheckbox = isHovered || isSelected || selectionStore.hasSelection;

  const handleCheckboxPress = useCallback((e: { preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault();
    e.stopPropagation();
    selectionStore.toggleSelection(photo.id);
  }, [selectionStore, photo.id]);

  const handleLongPress = useCallback(() => {
    selectionStore.toggleSelection(photo.id);
  }, [selectionStore, photo.id]);

  // Web-specific hover handling
  const containerProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any : {};

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      {...containerProps}
    >
      <Pressable onLongPress={handleLongPress} delayLongPress={500}>
        <Link
          href={getPhotoLink(photo.id)}
          style={[styles.linkContainer, { width: size, height: size }]}
        >
          <Image
            source={{ uri: thumbnailUri }}
            style={styles.image}
            resizeMode="cover"
          />
          {photo.video && (
            <View style={styles.playIcon}>
              <Text style={styles.playText}>▶</Text>
            </View>
          )}
        </Link>
      </Pressable>
      {showCheckbox && (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={handleCheckboxPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && (
              <MaterialIcons name="check" size={16} color="white" />
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    position: "relative",
  },
  linkContainer: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  playIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  playText: {
    color: "white",
    fontSize: 10,
  },
  checkboxContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 2,
    borderColor: "#007aff",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#007aff",
    borderColor: "#007aff",
  },
});

export default ImageCard;
