import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Pressable,
} from "react-native";
import { observer } from "mobx-react-lite";
import { MaterialIcons } from "@expo/vector-icons";
import { PhotoContainerStore } from "@/stores/photo-container";
import { usePhotosStore } from "@/stores/photos";
import VideoPlayer from "./image-view/video-player";

export const DiaporamaScreen = observer(function DiaporamaScreen({
  store,
}: {
  store: PhotoContainerStore;
}) {
  const photosStore = usePhotosStore();
  const { paginatedPhotosStore } = store;
  const photos = paginatedPhotosStore.photos;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);

  const currentPhoto = photos[currentIndex];
  const imgUri = currentPhoto?.publicId
    ? photosStore.getImage(currentPhoto.publicId)
    : undefined;
  const isVideo = currentPhoto?.video;

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    hideControlsAfterDelay();
  }, [hideControlsAfterDelay]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handleInteraction = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleClose = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    store.navigateToContainer();
  }, [store]);

  // Auto-advance every 10 seconds
  useEffect(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }

    autoAdvanceTimeoutRef.current = setTimeout(() => {
      goToNext();
    }, 10000);

    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, [currentIndex, goToNext]);

  // Show controls initially then hide after 5 seconds
  useEffect(() => {
    hideControlsAfterDelay();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [hideControlsAfterDelay]);

  // Handle mouse move on web
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleMouseMove = () => {
      showControlsTemporarily();
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [showControlsTemporarily]);

  if (!currentPhoto || photos.length === 0) {
    return null;
  }

  return (
    <Pressable
      style={styles.container}
      onPress={handleInteraction}
      onMoveShouldSetResponder={() => true}
      onResponderMove={handleInteraction}
    >
      <View style={styles.mediaContainer}>
        {isVideo && imgUri ? (
          <VideoPlayer
            uri={imgUri}
            style={styles.media}
            onNext={goToNext}
            onPrevious={() => {}}
          />
        ) : (
          <Image
            source={{ uri: imgUri }}
            style={styles.media}
            resizeMode="contain"
          />
        )}
      </View>
      {showControls && (
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Fermer le diaporama"
            accessibilityRole="button"
          >
            <MaterialIcons name="close" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "web" ? 0 : 32,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "black",
    zIndex: 2000,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "flex-end",
  },
  closeButton: {
    padding: 8,
  },
});
