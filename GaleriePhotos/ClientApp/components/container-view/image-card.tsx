import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Pressable,
} from "react-native";
import { observer } from "mobx-react-lite";
import { Photo } from "@/services/views";
import { usePhotosStore } from "@/stores/photos";
import { Link } from "expo-router";
import { PhotoContainerStore } from "@/stores/photo-container";
import { useSelectedPhotosStore } from "@/stores/selected-photos";
import { MaterialIcons } from "@expo/vector-icons";

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
  const selectedPhotosStore = useSelectedPhotosStore();
  const { getPhotoLink } = store;
  const [isHovered, setIsHovered] = useState(false);

  const thumbnailUri = photosStore.getThumbnail(photo.publicId);
  const isSelected = selectedPhotosStore.isSelected(photo.id);

  const handleCheckboxPress = useCallback(
    (e: React.BaseSyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      selectedPhotosStore.togglePhoto(photo);
    },
    [selectedPhotosStore, photo]
  );

  const handleLongPress = useCallback(() => {
    selectedPhotosStore.selectPhoto(photo);
  }, [selectedPhotosStore, photo]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // On mobile, always show checkbox if any photo is selected
  const showCheckbox =
    Platform.OS === "web"
      ? isHovered || isSelected || selectedPhotosStore.count > 0
      : selectedPhotosStore.count > 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Link
        href={getPhotoLink(photo.id)}
        style={[styles.imageLink, { width: size, height: size }]}
        asChild
      >
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={500}
          style={[styles.imagePressable, { width: size, height: size }]}
          // @ts-expect-error - web-only props
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
        </Pressable>
      </Link>

      {showCheckbox && (
        <TouchableOpacity
          style={[styles.checkbox, isSelected && styles.checkboxSelected]}
          onPress={handleCheckboxPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isSelected && <MaterialIcons name="check" size={18} color="#fff" />}
        </TouchableOpacity>
      )}

      {isSelected && <View style={styles.selectedOverlay} />}
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
  imageLink: {
    width: "100%",
    height: "100%",
  },
  imagePressable: {
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
    left: 8,
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
  checkbox: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#007aff",
    borderColor: "#007aff",
  },
  selectedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 122, 255, 0.2)",
    borderWidth: 2,
    borderColor: "#007aff",
    borderRadius: 8,
    pointerEvents: "none",
  },
});

export default ImageCard;
