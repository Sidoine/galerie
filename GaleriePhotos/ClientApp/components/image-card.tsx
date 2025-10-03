import React, { useCallback } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { observer } from "mobx-react-lite";
import { Photo } from "@/services/views";
import { usePhotosStore } from "@/stores/photos";
import { usePhotoContainer } from "@/stores/photo-container";
import { Link } from "expo-router";

interface ImageCardProps {
  photo: Photo;
  size?: number;
}

const ImageCard = observer(function ImageCard({
  photo,
  size = 100,
}: ImageCardProps) {
  const photosStore = usePhotosStore();
  const { getPhotoLink } = usePhotoContainer();

  const thumbnailUri = photosStore.getThumbnail(photo.publicId);

  return (
    <Link
      href={getPhotoLink(photo.id)}
      style={[styles.container, { width: size, height: size }]}
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
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    position: "relative",
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
});

export default ImageCard;
