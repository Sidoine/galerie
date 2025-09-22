import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Face } from "../../services/views";
import { FaceController } from "../../services/face";
import FaceSelector from "./face-selector";
import { useDirectoriesStore } from "../../stores/directories";
import { useMyApiClient } from "../../stores/api-client";

interface ImageFacesProps {
  photoId: number;
  visible: boolean;
  // Dimensions de l'image rendue (fournies par le parent via onLayout)
  renderedWidth: number;
  renderedHeight: number;
  // Dimensions naturelles de l'image (originales)
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * Overlay des visages pour React Native.
 * On ne peut pas utiliser ResizeObserver; le parent doit fournir width/height calculés.
 */
export default function ImageFaces({
  photoId,
  visible,
  renderedWidth,
  renderedHeight,
  naturalWidth,
  naturalHeight,
}: ImageFacesProps) {
  const directoriesStore = useDirectoriesStore();
  const apiClient = useMyApiClient();
  const faceController = useMemo(
    () => new FaceController(apiClient),
    [apiClient]
  );
  const [faces, setFaces] = useState<Face[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les visages quand visible passe à true ou photoId change
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const result = await faceController.getFacesByPhoto(
        directoriesStore.galleryId,
        photoId
      );
      if (cancelled) return;
      setLoading(false);
      if (result.ok) setFaces(result.value);
      else setError(result.message);
    })();
    return () => {
      cancelled = true;
    };
  }, [photoId, faceController, visible, directoriesStore.galleryId]);

  const scaleX = naturalWidth ? renderedWidth / naturalWidth : 1;
  const scaleY = naturalHeight ? renderedHeight / naturalHeight : 1;

  if (!visible) return null;
  if (loading) {
    return (
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>Chargement visages…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.statusBox, styles.errorBox]}>
        <Text style={styles.statusText}>{error}</Text>
      </View>
    );
  }
  if (!faces) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {faces.map((f) => {
        const left = f.x * scaleX;
        const top = f.y * scaleY;
        const width = f.width * scaleX;
        const height = f.height * scaleY;
        return (
          <View
            key={f.id}
            style={[styles.faceBox, { left, top, width, height }]}
            pointerEvents="box-none"
          >
            <View style={styles.faceHeader} pointerEvents="auto">
              <FaceSelector
                face={f}
                dense
                onNameAssigned={(name) =>
                  setFaces((prev) =>
                    prev
                      ? prev.map((pf) =>
                          pf.id === f.id ? { ...pf, name } : pf
                        )
                      : prev
                  )
                }
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  statusBox: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  errorBox: {
    backgroundColor: "rgba(139,0,0,0.6)",
  },
  statusText: {
    color: "white",
    fontSize: 12,
  },
  faceBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#00e5ff",
    shadowColor: "#00e5ff",
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
  faceHeader: {
    backgroundColor: "rgba(0,0,0,0.55)",
  },
});
