import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { observer } from "mobx-react-lite";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { GalleryStackParamList } from "../navigation-types";
import { Photo } from "../services/views";
import { useDirectoriesStore } from "../stores/directories";
import { useUi } from "../stores/ui";

interface ImageCardProps {
  photo?: Photo;
  value?: Photo; // for backward compatibility
  size?: number;
}

const ImageCard = observer(function ImageCard({
  photo,
  value,
  size = 100,
}: ImageCardProps) {
  const navigation =
    useNavigation<StackNavigationProp<GalleryStackParamList>>();
  const directoriesStore = useDirectoriesStore();
  const { order } = useUi();

  const item = photo || value;
  if (!item) return null;

  const handlePress = () => {
    navigation.navigate("Photo", {
      galleryId: directoriesStore.galleryId,
      directoryId: item.directoryId,
      photoId: item.id,
      order,
    });
  };

  // Construction d'une URL de vignette provisoire (TODO: remplacer par endpoint réel si différent)
  const thumbnailUri = directoriesStore.getThumbnail
    ? directoriesStore.getThumbnail(item.id)
    : `./api/photo/${item.id}/thumbnail`;

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={handlePress}
    >
      <Image
        source={{ uri: thumbnailUri }}
        style={styles.image}
        resizeMode="cover"
      />
      {item.video && (
        <View style={styles.playIcon}>
          <Text style={styles.playText}>▶</Text>
        </View>
      )}
    </TouchableOpacity>
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
