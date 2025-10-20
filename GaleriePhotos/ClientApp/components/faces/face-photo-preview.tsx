import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { observer } from "mobx-react-lite";
import { Face } from "@/services/views";
import { useAssignFace } from "./assign-face-context";
import { useFaceNamesStore } from "@/stores/face-names";
import { usePhotosStore } from "@/stores/photos";
import { ZoomedFaceImage } from "./zoomed-face-image";
import { styles } from "./suggested-faces.styles";

export interface FacePhotoPreviewProps {
  face: Face;
  faceName: string;
  onClose: () => void;
  onAssigned: () => void;
  onReject: () => void;
}

export const FacePhotoPreview = observer(function FacePhotoPreview({
  face,
  faceName,
  onClose,
  onAssigned,
  onReject,
}: FacePhotoPreviewProps) {
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const assignCtx = useAssignFace();
  const faceNamesStore = useFaceNamesStore();
  const photosStore = usePhotosStore();
  const photo = photosStore.imageLoader.getValue(face.photoId);
  const photoDateLabel = photo?.dateTime
    ? new Date(photo.dateTime).toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : undefined;

  const handleAssign = async () => {
    if (assigning) return;
    setAssigning(true);
    setAssignError(null);
    try {
      const ok = await assignCtx.assign(face, faceName);
      if (!ok) setAssignError("Erreur assignation");
      else {
        faceNamesStore.clearCache();
        onAssigned();
      }
    } catch (e: unknown) {
      setAssignError(e instanceof Error ? e.message : "Erreur assignation");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <View style={styles.modalBackdrop}>
      <View style={[styles.modal, styles.previewModal]}>
        <Text style={styles.modalTitle}>Visage</Text>
        <ZoomedFaceImage face={face} />
        {photoDateLabel && (
          <View style={styles.photoDateBadge} pointerEvents="none">
            <Text style={styles.photoDateBadgeText}>{photoDateLabel}</Text>
          </View>
        )}
        {assignError && <Text style={styles.error}>{assignError}</Text>}
        <View style={styles.previewActionsRow}>
          <TouchableOpacity
            style={[styles.actionButtonLarge, styles.okButton]}
            onPress={handleAssign}
            disabled={assigning}
          >
            <Text style={styles.actionButtonLargeText}>Assigner</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButtonLarge, styles.rejectButton]}
            onPress={onReject}
            disabled={assigning}
          >
            <Text style={styles.actionButtonLargeText}>Rejeter</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.closeModalBtn}
          onPress={onClose}
          disabled={assigning}
        >
          <Text style={styles.closeModalText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});
