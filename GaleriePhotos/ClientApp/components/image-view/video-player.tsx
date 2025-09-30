import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StyleProp,
  ViewStyle,
} from "react-native";
import { VideoView, useVideoPlayer, VideoSource } from "expo-video";
import { Ionicons } from "@expo/vector-icons";

interface VideoPlayerProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function VideoPlayer({
  uri,
  style,
  onNext,
  onPrevious,
}: VideoPlayerProps) {
  const player = useVideoPlayer({ uri } as VideoSource, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Suivre l'état de lecture du player
  const [isPlaying, setIsPlaying] = useState(player?.playing || false);

  // Écouter les changements d'état du player
  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      setPosition(player.currentTime * 1000); // Convertir en millisecondes
      setDuration(player.duration * 1000); // Convertir en millisecondes
      setIsPlaying(player.playing);

      if (player.status === "loading") {
        setIsLoading(true);
        setHasError(false);
      } else if (player.status === "readyToPlay") {
        setIsLoading(false);
        setHasError(false);
      } else if (player.status === "error") {
        setIsLoading(false);
        setHasError(true);
        console.error("Erreur de lecture vidéo");
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player]);

  // Masquer automatiquement les contrôles après 3 secondes
  useEffect(() => {
    if (showControls && isPlaying) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying]);

  const togglePlayback = () => {
    if (player) {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  const handleVideoPress = () => {
    setShowControls(true);
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={handleVideoPress}
        activeOpacity={1}
      >
        <VideoView
          style={styles.video}
          player={player}
          fullscreenOptions={{ enable: false }}
          allowsPictureInPicture={false}
        />

        {/* Overlay de chargement */}
        {isLoading && !hasError && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Chargement de la vidéo...</Text>
          </View>
        )}

        {/* Overlay d'erreur */}
        {hasError && (
          <View style={styles.loadingOverlay}>
            <Ionicons name="alert-circle-outline" size={60} color="white" />
            <Text style={styles.loadingText}>
              Erreur lors du chargement de la vidéo
            </Text>
          </View>
        )}

        {/* Zones de navigation (toujours présentes) */}
        {onPrevious && (
          <TouchableOpacity
            style={[styles.navZone, { left: 0 }]}
            onPress={onPrevious}
            accessibilityLabel="Vidéo précédente"
          />
        )}
        {onNext && (
          <TouchableOpacity
            style={[styles.navZone, { right: 0 }]}
            onPress={onNext}
            accessibilityLabel="Vidéo suivante"
          />
        )}

        {/* Contrôles personnalisés */}
        {showControls && !isLoading && (
          <View style={styles.controlsOverlay}>
            {/* Bouton play/pause central */}
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={togglePlayback}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={60}
                color="white"
              />
            </TouchableOpacity>

            {/* Barre de progression en bas */}
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        duration > 0 ? `${(position / duration) * 100}%` : "0%",
                    },
                  ]}
                />
              </View>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  videoContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  playPauseButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 50,
    padding: 20,
  },
  progressContainer: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  timeText: {
    color: "white",
    fontSize: 12,
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 10,
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 2,
  },
  navZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
    zIndex: 20,
  },
});
