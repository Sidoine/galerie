import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { observer } from "mobx-react-lite";
import TopActions from "@/components/image-view/top-actions";
import { ImageDetails } from "@/components/image-view/image-details";
import ImageFaces from "@/components/image-view/image-faces";
import VideoPlayer from "@/components/image-view/video-player";
import { useUi } from "@/stores/ui";
import { useDirectoriesStore } from "@/stores/directories";
import { useLocalSearchParams, useRouter } from "expo-router";

interface RouteParams {
  galleryId: number;
  directoryId: number;
  photoId: number;
  order: "date-desc" | "date-asc";
}

// Composant plein écran (modal) affichant une photo avec navigation précédente/suivante.
export default observer(function ImageView() {
  const { photoId } = useLocalSearchParams<{
    directoryId: string;
    photoId: string;
  }>();
  const directoriesStore = useDirectoriesStore();
  const { navigateToPhoto, navigateToDirectory } = useUi();

  const photo = directoriesStore.imageLoader.getValue(Number(photoId));

  const handleNext = useCallback(() => {
    if (photo && photo.nextId) navigateToPhoto(photo.directoryId, photo.nextId);
  }, [navigateToPhoto, photo]);
  const handlePrevious = useCallback(() => {
    if (photo && photo.previousId)
      navigateToPhoto(photo.directoryId, photo.previousId);
  }, [navigateToPhoto, photo]);
  const handleClose = useCallback(() => {
    if (photo) navigateToDirectory(photo.directoryId);
  }, [navigateToDirectory, photo]);

  // Gestion des gestes de swipe
  const handlePanGesture = useCallback(
    (event: any) => {
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
  const imgUri = directoriesStore.getImage(Number(photoId));
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
          {isVideo && (
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
