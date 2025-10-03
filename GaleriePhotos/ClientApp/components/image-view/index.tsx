import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import {
  HandlerStateChangeEvent,
  PanGestureHandler,
  PanGestureHandlerEventPayload,
  State,
} from "react-native-gesture-handler";
import { observer } from "mobx-react-lite";
import TopActions from "./top-actions";
import { ImageDetails } from "./image-details";
import ImageFaces from "./image-faces";
import VideoPlayer from "./video-player";
import { useLocalSearchParams } from "expo-router";
import { usePhotosStore } from "@/stores/photos";
import { usePhotoContainer } from "@/stores/photo-container";

// Composant plein écran (modal) affichant une photo avec navigation précédente/suivante.
export default observer(function ImageView() {
  const { photoId } = useLocalSearchParams<{
    photoId: string;
  }>();
  const photosStore = usePhotosStore();
  const { navigateToPhoto, navigateToContainer, photoList } =
    usePhotoContainer();

  const photo = photosStore.imageLoader.getValue(Number(photoId));

  const photoIndex = photoList?.findIndex((p) => p.id === photo?.id);

  const handleNext = useCallback(() => {
    const nextPhoto =
      photoIndex !== undefined && photoList && photoIndex < photoList.length - 1
        ? photoList[photoIndex + 1]
        : null;
    if (nextPhoto) navigateToPhoto(nextPhoto.id);
  }, [navigateToPhoto, photoIndex, photoList]);
  const handlePrevious = useCallback(() => {
    const previousPhoto =
      photoIndex !== undefined && photoList && photoIndex > 0
        ? photoList[photoIndex - 1]
        : null;
    if (previousPhoto) navigateToPhoto(previousPhoto.id);
  }, [navigateToPhoto, photoIndex, photoList]);
  const handleClose = useCallback(() => {
    if (photo) navigateToContainer();
  }, [navigateToContainer, photo]);

  // Gestion des gestes de swipe
  const handlePanGesture = useCallback(
    (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX, velocityX } = event.nativeEvent;

        // Seuils pour détecter un swipe
        const SWIPE_THRESHOLD = 50; // Distance minimale pour considérer un swipe
        const VELOCITY_THRESHOLD = 500; // Vitesse minimale pour un swipe rapide

        // Swipe vers la droite (image précédente)
        if (translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
          handlePrevious();
        }
        // Swipe vers la gauche (image suivante)
        else if (
          translationX < -SWIPE_THRESHOLD ||
          velocityX < -VELOCITY_THRESHOLD
        ) {
          handleNext();
        }
      }
    },
    [handleNext, handlePrevious]
  );

  const [details, setDetails] = useState(false);
  const [showFaces, setShowFaces] = useState(false);
  const handleDetailsToggle = useCallback(() => setDetails((p) => !p), []);
  const handleFacesToggle = useCallback(() => setShowFaces((p) => !p), []);
  const handleDetailsClose = useCallback(() => setDetails(false), []);

  // Dimensions image rendue pour overlay faces
  const [rendered, setRendered] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const imgUri = photo?.publicId
    ? photosStore.getImage(photo?.publicId)
    : undefined;
  const isVideo = photo?.video;

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
      />
      <PanGestureHandler onHandlerStateChange={handlePanGesture}>
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
              onLayout={(e) =>
                setRendered({
                  width: e.nativeEvent.layout.width,
                  height: e.nativeEvent.layout.height,
                })
              }
            >
              <Image
                source={{ uri: imgUri }}
                style={styles.image}
                resizeMode="contain"
                accessible
              />
              {showFaces && (
                <ImageFaces
                  photoId={photo.id}
                  visible={showFaces}
                  renderedWidth={rendered.width}
                  renderedHeight={rendered.height}
                  naturalWidth={natural.width}
                  naturalHeight={natural.height}
                />
              )}
            </View>
          )}
        </View>
      </PanGestureHandler>
      <ImageDetails image={photo} open={details} onClose={handleDetailsClose} />
    </View>
  );
});

const styles = StyleSheet.create({
  fullscreen: {
    position: "absolute",
    top: 0,
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
