import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  LayoutRectangle,
  Platform,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { observer } from "mobx-react-lite";
import TopActions from "./top-actions";
import { ImageDetails } from "./image-details";
import ImageFaces from "./image-faces";
import VideoPlayer from "./video-player";
import { useLocalSearchParams } from "expo-router";
import { usePhotosStore } from "@/stores/photos";
import { scheduleOnRN } from "react-native-worklets";
import { PhotoContainerStore } from "@/stores/photo-container";

// Composant plein écran (modal) affichant une photo avec navigation précédente/suivante.
export default observer(function ImageView({
  store,
}: {
  store: PhotoContainerStore;
}) {
  const { photoId } = useLocalSearchParams<{
    photoId: string;
  }>();
  const photosStore = usePhotosStore();
  const { navigateToPhoto, navigateToContainer, paginatedPhotosStore } = store;

  const photo = photosStore.imageLoader.getValue(Number(photoId));

  const photoIndex = paginatedPhotosStore.photos.findIndex(
    (p) => p.id === photo?.id
  );

  const handleNext = useCallback(() => {
    const nextPhoto =
      photoIndex !== undefined &&
      photoIndex < paginatedPhotosStore.photos.length - 1
        ? paginatedPhotosStore.photos[photoIndex + 1]
        : null;
    if (nextPhoto) navigateToPhoto(nextPhoto.id);
  }, [navigateToPhoto, photoIndex, paginatedPhotosStore.photos]);
  const handlePrevious = useCallback(() => {
    const previousPhoto =
      photoIndex !== undefined && photoIndex > 0
        ? paginatedPhotosStore.photos[photoIndex - 1]
        : null;
    if (previousPhoto) navigateToPhoto(previousPhoto.id);
  }, [navigateToPhoto, photoIndex, paginatedPhotosStore.photos]);
  const handleClose = useCallback(() => {
    if (photo) navigateToContainer();
  }, [navigateToContainer, photo]);

  // isVideo / imgUri déjà calculés plus bas, on les remonte pour usage dans les gestes
  const imgUri = photo?.publicId
    ? photosStore.getImage(photo?.publicId)
    : undefined;
  const isVideo = photo?.video;

  // --- GESTE SWIPE NAVIGATION (Pan) ---
  const SWIPE_THRESHOLD = 50;
  const VELOCITY_THRESHOLD = 500;

  const [details, setDetails] = useState(false);
  const [showFaces, setShowFaces] = useState(false);
  const handleDetailsToggle = useCallback(() => setDetails((p) => !p), []);
  const handleFacesToggle = useCallback(() => setShowFaces((p) => !p), []);
  const handleDetailsClose = useCallback(() => setDetails(false), []);

  // --- GESTES ZOOM / PAN ---
  // Valeurs partagées (worklets reanimated)
  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1); // scale mémorisé entre les pinch
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const MAX_SCALE = 4;
  const swipeGesture = Gesture.Pan().onEnd((e) => {
    if (scale.value > 1) return;
    const { translationX, velocityX } = e;
    if (translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
      scheduleOnRN(handlePrevious);
    } else if (
      translationX < -SWIPE_THRESHOLD ||
      velocityX < -VELOCITY_THRESHOLD
    ) {
      scheduleOnRN(handleNext);
    }
  });

  // Style animé de l'image
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Geste pinch pour zoomer
  const pinchGesture = Gesture.Pinch()
    .enabled(!isVideo)
    .onUpdate((e) => {
      // clamp simple 1..MAX_SCALE
      const next = baseScale.value * e.scale;
      scale.value = Math.min(Math.max(1, next), MAX_SCALE);
    })
    .onEnd(() => {
      baseScale.value = scale.value; // mémorise
      if (scale.value === 1) {
        // reset translations quand on revient à 1
        translateX.value = 0;
        translateY.value = 0;
      }
    });

  // Geste pan pour déplacer l'image quand zoomée
  const panGesture = Gesture.Pan()
    .enabled(!isVideo)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value <= 1) return; // pas de pan si pas zoomé
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    });

  // Double tap pour zoom rapide 1 <-> 2
  const doubleTapGesture = Gesture.Tap()
    .enabled(!isVideo)
    .numberOfTaps(2)
    .onEnd((_e, success) => {
      if (!success) return;
      if (baseScale.value > 1) {
        scale.value = 1;
        baseScale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
      } else {
        scale.value = 2;
        baseScale.value = 2;
      }
    });

  // Combinaison des gestes (double tap simultané avec pinch + pan)
  const imageGestures = React.useMemo(
    () =>
      Gesture.Simultaneous(
        doubleTapGesture,
        pinchGesture,
        panGesture,
        swipeGesture
      ),
    [doubleTapGesture, pinchGesture, panGesture, swipeGesture]
  );

  // Dimensions image rendue pour overlay faces
  const [rendered, setRendered] = useState<LayoutRectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [natural, setNatural] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (imgUri && !isVideo) {
      // Récupère dimensions natives
      Image.getSize(
        imgUri,
        (w, h) => setNatural({ width: w, height: h }),
        () => setNatural({ width: 0, height: 0 })
      );
    }
  }, [imgUri, isVideo]);

  if (!photo) {
    return (
      <View style={styles.fullscreen}>
        <Text style={{ color: "white" }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.fullscreen}>
      <TopActions
        onClose={handleClose}
        onDetailsToggle={handleDetailsToggle}
        onFacesToggle={handleFacesToggle}
        showFaces={showFaces}
        photo={photo}
        store={store}
      />
      <GestureDetector gesture={imageGestures}>
        <View style={styles.mediaContainer}>
          {/* Zones de navigation uniquement pour les images */}
          {!isVideo && (
            <>
              <TouchableOpacity
                style={[styles.navZone, { left: 0 }]}
                onPress={handlePrevious}
                accessibilityLabel="Photo précédente"
              />
              <TouchableOpacity
                style={[styles.navZone, { right: 0 }]}
                onPress={handleNext}
                accessibilityLabel="Photo suivante"
              />
            </>
          )}
          {isVideo && imgUri && (
            <VideoPlayer
              uri={imgUri}
              style={styles.videoContainer}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {!isVideo && (
            <View
              style={styles.imageWrapper}
              onLayout={(e) => setRendered(e.nativeEvent.layout)}
            >
              <Animated.Image
                source={{ uri: imgUri }}
                style={[styles.image, animatedImageStyle]}
                resizeMode="contain"
                accessible
              />
              {showFaces && (
                <ImageFaces
                  photoId={photo.id}
                  visible={showFaces}
                  renderedLayout={rendered}
                  naturalWidth={natural.width}
                  naturalHeight={natural.height}
                />
              )}
            </View>
          )}
        </View>
      </GestureDetector>
      <ImageDetails image={photo} open={details} onClose={handleDetailsClose} />
    </View>
  );
});

const styles = StyleSheet.create({
  fullscreen: {
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
  imageWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  navZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
    zIndex: 10,
  },
  videoContainer: {
    flex: 1,
    width: "100%",
  },
});
