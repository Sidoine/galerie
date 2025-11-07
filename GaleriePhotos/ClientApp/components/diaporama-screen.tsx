import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Pressable,
  Text,
} from "react-native";
import { observer } from "mobx-react-lite";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { PhotoContainerStore } from "@/stores/photo-container";
import { usePhotosStore } from "@/stores/photos";
import VideoPlayer from "./image-view/video-player";

// Speed intervals in milliseconds
const SPEED_OPTIONS = [5000, 10000, 30000, 0] as const; // 0 means paused
const SPEED_LABELS = ["5s", "10s", "30s", "⏸"] as const;

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
  const [speedIndex, setSpeedIndex] = useState(1); // Default to 10s
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Opacity values for fade transition
  const currentOpacity = useSharedValue(1);
  const nextOpacity = useSharedValue(0);

  const currentPhoto = photos[currentIndex];
  const nextPhoto = photos[(currentIndex + 1) % photos.length];
  
  const imgUri = currentPhoto?.publicId
    ? photosStore.getImage(currentPhoto.publicId)
    : undefined;
  const nextImgUri = nextPhoto?.publicId
    ? photosStore.getImage(nextPhoto.publicId)
    : undefined;
  const isVideo = currentPhoto?.video;

  const currentSpeed = SPEED_OPTIONS[speedIndex];

  // Animated styles for fade transition - must be called before any conditional returns
  const currentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: currentOpacity.value,
  }));

  const nextAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nextOpacity.value,
  }));

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
    // Check if we can go to next photo
    if (currentIndex >= photos.length - 1) {
      // We're at the last photo, don't advance
      return;
    }

    // Load more photos when approaching the end (3 photos from the end)
    if (
      currentIndex >= photos.length - 3 &&
      paginatedPhotosStore.shouldLoadMore()
    ) {
      paginatedPhotosStore.loadMore();
    }

    // Start fade out transition
    currentOpacity.value = withTiming(0, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    });
    nextOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    });

    // Change photo after a short delay
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      // Reset opacities for next transition
      currentOpacity.value = 1;
      nextOpacity.value = 0;
    }, 500);
  }, [currentIndex, photos.length, currentOpacity, nextOpacity, paginatedPhotosStore]);

  const goToPrevious = useCallback(() => {
    // Check if we can go to previous photo
    if (currentIndex <= 0) {
      // We're at the first photo, don't go back
      return;
    }

    // Load more photos when approaching the start (3 photos from the start)
    if (
      currentIndex <= 2 &&
      paginatedPhotosStore.shouldLoadMoreBefore()
    ) {
      paginatedPhotosStore.loadMoreBefore();
    }

    // Start fade out transition
    currentOpacity.value = withTiming(0, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    });

    // Change photo after a short delay
    setTimeout(() => {
      setCurrentIndex((prev) => prev - 1);
      // Reset opacities for next transition
      currentOpacity.value = 1;
      nextOpacity.value = 0;
    }, 500);
  }, [currentIndex, currentOpacity, nextOpacity, paginatedPhotosStore]);

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

  const handleSpeedChange = useCallback(() => {
    setSpeedIndex((prev) => (prev + 1) % SPEED_OPTIONS.length);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Auto-advance based on selected speed
  useEffect(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }

    // Don't auto-advance if paused (speed is 0)
    if (currentSpeed === 0) {
      return;
    }

    autoAdvanceTimeoutRef.current = setTimeout(() => {
      goToNext();
    }, currentSpeed);

    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, [currentIndex, goToNext, currentSpeed]);

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

  // Handle keyboard navigation on web
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
        showControlsTemporarily();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
        showControlsTemporarily();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [goToNext, goToPrevious, handleClose, showControlsTemporarily]);

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
            onPrevious={goToPrevious}
          />
        ) : (
          <>
            <Animated.Image
              source={{ uri: imgUri }}
              style={[styles.media, currentAnimatedStyle]}
              resizeMode="contain"
            />
            {nextImgUri && !nextPhoto?.video && (
              <Animated.Image
                source={{ uri: nextImgUri }}
                style={[styles.media, styles.nextImage, nextAnimatedStyle]}
                resizeMode="contain"
              />
            )}
          </>
        )}
      </View>
      {showControls && (
        <>
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={handleSpeedChange}
              style={styles.speedButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={`Vitesse du diaporama: ${SPEED_LABELS[speedIndex]}`}
              accessibilityRole="button"
            >
              <View style={styles.speedButtonContent}>
                <MaterialIcons 
                  name={currentSpeed === 0 ? "pause" : "timer"} 
                  size={24} 
                  color="#fff" 
                />
                <Text style={styles.speedText}>{SPEED_LABELS[speedIndex]}</Text>
              </View>
            </TouchableOpacity>
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
          {/* Navigation arrows */}
          {!isVideo && (
            <>
              {currentIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonLeft]}
                  onPress={goToPrevious}
                  accessibilityLabel="Photo précédente"
                  accessibilityRole="button"
                >
                  <MaterialIcons name="chevron-left" size={48} color="#fff" />
                </TouchableOpacity>
              )}
              {currentIndex < photos.length - 1 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonRight]}
                  onPress={goToNext}
                  accessibilityLabel="Photo suivante"
                  accessibilityRole="button"
                >
                  <MaterialIcons name="chevron-right" size={48} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </>
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
  nextImage: {
    position: "absolute",
    top: 0,
    left: 0,
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
    gap: 16,
  },
  speedButton: {
    padding: 8,
  },
  speedButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  speedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -24 }],
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 24,
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
});
