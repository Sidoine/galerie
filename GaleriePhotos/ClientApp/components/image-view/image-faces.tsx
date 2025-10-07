import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, LayoutRectangle } from "react-native";
import { Face } from "@/services/views";
import { FaceController } from "@/services/face";
import FaceSelector from "./face-selector";
import { useDirectoriesStore } from "@/stores/directories";
import { useApiClient } from "folke-service-helpers";

interface ImageFacesProps {
  photoId: number;
  visible: boolean;
  // Dimensions de l'image rendue (fournies par le parent via onLayout)
  renderedLayout: LayoutRectangle;
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
  renderedLayout,
  naturalWidth,
  naturalHeight,
}: ImageFacesProps) {
  const directoriesStore = useDirectoriesStore();
  const apiClient = useApiClient();
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

  const naturalRatio = naturalWidth / naturalHeight;
  let leftOrigin = 0;
  let topOrigin = 0;
  let scale: number;
  if (naturalRatio > 1) {
    // Center vertically
    topOrigin =
      (renderedLayout.height - renderedLayout.width / naturalRatio) / 2;
    scale = renderedLayout.width / naturalWidth;
  } else {
    // Center horizontally
    leftOrigin =
      (renderedLayout.width - renderedLayout.height * naturalRatio) / 2;
    scale = renderedLayout.height / naturalHeight;
  }

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
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {faces.map((f) => {
        const left = f.x * scale + leftOrigin;
        const top = f.y * scale + topOrigin;
        const minWidth = f.width * scale;
        const height = f.height * scale;
        return (
          <View
            key={f.id}
            style={[styles.faceBox, { left, top, minWidth, height }]}
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
    pointerEvents: "box-none",
  },
  faceHeader: {
    backgroundColor: "rgba(0,0,0,0.55)",
  },
});
