import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from "react-native";
import { observer } from "mobx-react-lite";
import { Face } from "@/services/views";
import { useApiClient } from "folke-service-helpers";
import { FaceController } from "@/services/face";
import { useDirectoriesStore } from "@/stores/directories";
import { useFaceNamesStore } from "@/stores/face-names";
import { useMembersStore } from "@/stores/members";
import FaceThumbnail from "./face-thumbnail";
import { RejectFaceModal } from "./reject-face-modal";

interface UnnamedFacesProps {
  count?: number;
}

// Liste horizontale de visages sans nom
export const UnnamedFaces = observer(function UnnamedFaces({
  count = 20,
}: UnnamedFacesProps) {
  const { galleryId } = useDirectoriesStore();
  const apiClient = useApiClient();
  const membersStore = useMembersStore();
  const faceNamesStore = useFaceNamesStore();
  const faceController = useMemo(
    () => new FaceController(apiClient),
    [apiClient]
  );
  const [faces, setFaces] = useState<Face[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFace, setSelectedFace] = useState<Face | null>(null);

  const load = useCallback(async () => {
    if (!galleryId) return;
    try {
      setError(null);
      const resp = await faceController.getUnnamedFacesSample(
        Number(galleryId),
        { count }
      );
      if (resp.ok) setFaces(resp.value);
      else setError("Erreur de chargement");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur de chargement";
      setError(msg);
    }
  }, [faceController, galleryId, count]);

  useEffect(() => {
    load();
  }, [load]);

  if (!membersStore.administrator) return null;
  if (faces && faces.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Visages sans nom</Text>
        <TouchableOpacity onPress={load} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.facesRow}>
          {faces?.map((f) => (
            <TouchableOpacity key={f.id} onPress={() => setSelectedFace(f)}>
              <FaceThumbnail galleryId={String(galleryId)} face={f} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <Modal
        visible={!!selectedFace}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFace(null)}
      >
        {selectedFace && (
          <RejectFaceModal
            face={selectedFace}
            galleryId={Number(galleryId)}
            onClose={() => setSelectedFace(null)}
            onDeleted={() => {
              faceNamesStore.clearCache();
              setSelectedFace(null);
              load();
            }}
            onRenamed={() => {
              faceNamesStore.clearCache();
              setSelectedFace(null);
              load();
            }}
          />
        )}
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { paddingVertical: 8, paddingHorizontal: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 16, fontWeight: "600", flex: 1 },
  refreshButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  refreshText: { fontSize: 14 },
  error: { color: "#b00020", marginBottom: 4 },
  facesRow: { flexDirection: "row" },
});

export default UnnamedFaces;
