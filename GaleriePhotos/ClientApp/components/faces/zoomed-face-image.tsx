import { Face } from "@/services/views";
import React, { useEffect, useMemo, useState } from "react";
import { View, Image, ActivityIndicator, StyleSheet } from "react-native";
import { usePhotosStore } from "@/stores/photos";
import { observer } from "mobx-react-lite";

// Composant séparé pour gérer le zoom et l'encadrement du visage
export const ZoomedFaceImage = observer(function ZoomedFaceImage({
  face,
}: {
  face: Face;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Dimensions originales de l'image et conteneur pour calculer le zoom et le cadrage
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState<number | null>(null);

  const photoStore = usePhotosStore();
  const photo = photoStore.imageLoader.getValue(face.photoId);
  useEffect(() => {
    const directUrl = photo?.publicId
      ? photoStore.getImage(photo.publicId)
      : null;
    setPhotoUrl(directUrl);
    setLoading(false);
    if (directUrl) {
      // Récupère la taille originale de l'image pour calculer la position du visage
      Image.getSize(
        directUrl,
        (w, h) => setImageSize({ width: w, height: h }),
        () => setImageSize(null)
      );
    } else {
      setImageSize(null);
    }
  }, [face.photoId, photo?.publicId, photoStore]);

  // Calcul des styles dynamiques
  const { imageStyle, boxStyle } = useMemo(() => {
    if (!imageSize || !containerSize) return { imageStyle: {}, boxStyle: {} };
    const { width: iw, height: ih } = imageSize;
    const ratio = iw / ih;
    let fittedW: number;
    let fittedH: number;
    if (ratio >= 1) {
      // image plus large
      fittedW = containerSize;
      fittedH = containerSize / ratio;
    } else {
      fittedH = containerSize;
      fittedW = containerSize * ratio;
    }
    const zoom = 1.5;
    const scale = (fittedH / ih) * zoom;
    const xPos = face.x + face.width / 2;
    const yPos = face.y + face.height / 2;
    // Calcul translations pour centrer le visage après scale
    const translateX = containerSize / 2 - xPos * scale;
    const translateY = containerSize / 2 - yPos * scale;
    const boxW = face.width * scale;
    const boxH = face.height * scale;
    const boxLeft = translateX + face.x * scale;
    const boxTop = translateY + face.y * scale;
    return {
      imageStyle: {
        width: fittedW * zoom,
        height: fittedH * zoom,
        transform: [{ translateX }, { translateY }],
      } as const,
      boxStyle: {
        position: "absolute" as const,
        left: boxLeft,
        top: boxTop,
        width: boxW,
        height: boxH,
        borderWidth: 2,
        borderColor: "#ffeb3b",
        borderRadius: 4,
      } as const,
    };
  }, [imageSize, containerSize, face.x, face.y, face.width, face.height]);

  return (
    <View
      style={styles.previewImageContainer}
      onLayout={(e) => setContainerSize(e.nativeEvent.layout.width)}
    >
      {loading && <ActivityIndicator size="small" />}
      {!loading && photoUrl && (
        <View style={styles.zoomContainer}>
          <Image
            source={{ uri: photoUrl }}
            style={[styles.previewImage, imageStyle]}
            resizeMode="contain"
          />
          {/* Rectangle englobant */}
          <View pointerEvents="none" style={boxStyle} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  previewImageContainer: {
    width: "100%",
    aspectRatio: 1,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  zoomContainer: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
  },
});
