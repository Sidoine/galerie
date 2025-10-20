import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { observer } from "mobx-react-lite";
import { Face } from "@/services/views";
import { useApiClient } from "folke-service-helpers";
import { FaceController } from "@/services/face";
import FaceNameInput from "@/components/faces/face-name-input";
import { ZoomedFaceImage } from "./zoomed-face-image";
import { styles } from "./suggested-faces.styles";

export interface RejectFaceModalProps {
  face: Face;
  galleryId: number;
  onClose: () => void;
  onDeleted: () => void;
  onRenamed: () => void;
  title?: string;
}

export const RejectFaceModal = observer(function RejectFaceModal({
  face,
  galleryId,
  onClose,
  onDeleted,
  onRenamed,
  title = "Rejeter le visage",
}: RejectFaceModalProps) {
  const apiClient = useApiClient();
  const faceController = useMemo(
    () => new FaceController(apiClient),
    [apiClient]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const resp = await faceController.deleteFace(galleryId, face.id);
      if (!resp.ok) setError("Suppression impossible");
      else onDeleted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>{title}</Text>
        <ZoomedFaceImage face={face} />
        <View style={styles.modalSection}>
          <Text style={styles.sectionHeader}>Associer à un autre nom</Text>
          <FaceNameInput
            faceId={face.id}
            initialName={face.name}
            autoSuggest
            onAssigned={() => onRenamed()}
            onCancel={onClose}
          />
        </View>
        <View style={styles.modalSection}>
          <Text style={styles.sectionHeader}>Ou supprimer ce visage</Text>
          <TouchableOpacity
            style={[styles.deleteButton, busy && styles.disabledBtn]}
            disabled={busy}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Supprimer le visage</Text>
          </TouchableOpacity>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          style={styles.closeModalBtn}
          onPress={onClose}
          disabled={busy}
        >
          <Text style={styles.closeModalText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});
