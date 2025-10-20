import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Face } from "@/services/views";
import { useApiClient } from "folke-service-helpers";
import { FaceController } from "@/services/face";
import { useLocalSearchParams } from "expo-router";
import { useFaceNamesStore } from "@/stores/face-names";
import { observer } from "mobx-react-lite";
import { useMembersStore } from "@/stores/members";
import FaceThumbnail from "./face-thumbnail";
import { AssignFaceContext } from "./assign-face-context";
import { FacePhotoPreview } from "./face-photo-preview";
import { RejectFaceModal } from "./reject-face-modal";
import { styles } from "./suggested-faces.styles";

interface SuggestedFacesProps {
  max?: number;
}

// Affiche une liste horizontale de visages suggérés pour le nom courant
export const SuggestedFaces = observer(function SuggestedFaces({
  max = 10,
}: SuggestedFacesProps) {
  const { faceNameId, galleryId } = useLocalSearchParams<{
    faceNameId: string;
    galleryId: string;
  }>();
  const membersStore = useMembersStore();
  const faceNamesStore = useFaceNamesStore();
  const apiClient = useApiClient();
  const faceController = useMemo(
    () => new FaceController(apiClient),
    [apiClient]
  );
  const [faces, setFaces] = useState<Face[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectFace, setRejectFace] = useState<Face | null>(null);
  const [previewFace, setPreviewFace] = useState<Face | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const faceName = faceNameId
    ? faceNamesStore.getName(Number(faceNameId))
    : null;

  const load = useCallback(async () => {
    if (!faceName || !galleryId) return;
    try {
      setError(null);
      setBulkError(null);
      const response = await faceController.getSimilarFaces(Number(galleryId), {
        name: faceName.name,
        limit: max,
      });
      if (response.ok) setFaces(response.value);
      else setError("Erreur de chargement");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur de chargement";
      setError(message);
    }
  }, [faceController, faceName, galleryId, max]);

  useEffect(() => {
    load();
  }, [load]);
  const assignContextValue = useMemo(
    () => ({
      assign: async (face: Face, name: string) => {
        const response = await faceController.assignName(
          Number(galleryId),
          face.id,
          { name }
        );
        return response.ok;
      },
    }),
    [faceController, galleryId]
  );

  const handleAcceptAll = useCallback(async () => {
    if (!faces || faces.length === 0 || !galleryId || !faceName) return;
    setBulkAssigning(true);
    setBulkError(null);
    let failures = 0;
    for (const f of faces) {
      try {
        const resp = await faceController.assignName(Number(galleryId), f.id, {
          name: faceName.name,
        });
        if (!resp.ok) failures++;
      } catch {
        failures++;
      }
    }
    setBulkAssigning(false);
    faceNamesStore.clearCache();
    if (failures > 0) {
      setBulkError(`${failures} échec(s) lors de l'assignation`);
    }
    load();
  }, [faces, galleryId, faceName, faceController, load, faceNamesStore]);

  if (!faceName) return null;
  if (faces && faces.length === 0) return null;
  if (!membersStore.administrator) return null;

  return (
    <AssignFaceContext.Provider value={assignContextValue}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Visages suggérés</Text>
          {faces && faces.length > 0 && (
            <TouchableOpacity
              onPress={handleAcceptAll}
              style={[
                styles.refreshButton,
                styles.acceptAllButton,
                bulkAssigning && styles.disabledBtn,
              ]}
              disabled={bulkAssigning}
            >
              <Text style={styles.acceptAllText}>
                {bulkAssigning ? "…" : "Tout accepter"}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={load} style={styles.refreshButton}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        {bulkError && <Text style={styles.error}>{bulkError}</Text>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.facesRow}>
            {faces?.map((f) => (
              <SuggestedFaceThumbnail
                key={f.id}
                face={f}
                galleryId={Number(galleryId)}
                onPress={() => {
                  setPreviewFace(f);
                }}
                onAssigned={() => {
                  setPreviewFace(null);
                  load();
                }}
                onReject={() => {
                  setRejectFace(f);
                  setPreviewFace(null);
                }}
              />
            ))}
          </View>
        </ScrollView>
        {/* Modale d'aperçu de la photo contenant le visage */}
        <Modal
          visible={!!previewFace}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setPreviewFace(null);
          }}
        >
          {previewFace && (
            <FacePhotoPreview
              face={previewFace}
              faceName={faceName?.name || ""}
              onClose={() => {
                setPreviewFace(null);
              }}
              onAssigned={() => {
                setPreviewFace(null);
                load();
              }}
              onReject={() => {
                setRejectFace(previewFace);
                setPreviewFace(null);
              }}
            />
          )}
        </Modal>
        <Modal
          visible={!!rejectFace}
          transparent
          animationType="fade"
          onRequestClose={() => setRejectFace(null)}
        >
          {rejectFace && (
            <RejectFaceModal
              face={rejectFace}
              galleryId={Number(galleryId)}
              onClose={() => {
                setRejectFace(null);
                setRejectError(null);
              }}
              onDeleted={() => {
                setRejectFace(null);
                load();
              }}
              onRenamed={() => {
                setRejectFace(null);
                load();
              }}
            />
          )}
        </Modal>
        {rejectError && <Text style={styles.error}>{rejectError}</Text>}
      </View>
    </AssignFaceContext.Provider>
  );
});

function SuggestedFaceThumbnail({
  face,
  galleryId,
  onPress,
}: {
  face: Face;
  galleryId: number;
  onPress: () => void; // ouvre la modale de preview
  onAssigned: () => void;
  onReject: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress}>
      <FaceThumbnail galleryId={String(galleryId)} face={face} />
    </TouchableOpacity>
  );
}

export default SuggestedFaces;
