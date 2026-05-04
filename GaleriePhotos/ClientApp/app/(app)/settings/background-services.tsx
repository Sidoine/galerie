import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useApiClient } from "folke-service-helpers";
import { BackgroundServiceController } from "../../../services/backgroundService";
import * as views from "../../../services/views";

type Section = {
  key: string;
  title: string;
  lines: string[];
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "Non défini";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function formatNumber(value: number | null | undefined): string {
  return value == null ? "Non défini" : value.toString();
}

function getSections(state: views.BackgroundServicesState): Section[] {
  const sections: Section[] = [];

  sections.push({
    key: "face-auto-naming",
    title: "Face Auto Naming",
    lines: [
      `Dernier visage traite: ${formatNumber(state.faceAutoNaming?.lastProcessedFaceId)}`,
    ],
  });

  sections.push({
    key: "photo-capture-date-backfill",
    title: "Photo Capture Date Backfill",
    lines: [
      `Derniere photo traitee: ${formatNumber(state.photoCaptureDateBackfill?.lastProcessedPhotoId)}`,
      `Termine: ${state.photoCaptureDateBackfill?.completed ? "Oui" : "Non"}`,
    ],
  });

  sections.push({
    key: "place-location-background",
    title: "Place Location",
    lines: [
      `Derniere photo traitee: ${formatNumber(state.placeLocation?.lastProcessedPhotoId)}`,
    ],
  });

  sections.push({
    key: "photo-gps-backfill",
    title: "Photo GPS Backfill",
    lines: [
      `Derniere photo traitee: ${formatNumber(state.photoGpsBackfill?.lastProcessedPhotoId)}`,
    ],
  });

  return sections;
}

export default function BackgroundServicesSettingsScreen() {
  const apiClient = useApiClient();
  const backgroundServiceController = useMemo(
    () => new BackgroundServiceController(apiClient),
    [apiClient],
  );

  const [states, setStates] = useState<views.BackgroundServicesState | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resettingGalleryId, setResettingGalleryId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const loadStates = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);
      try {
        const result = await backgroundServiceController.getStates();
        if (result.ok) {
          setStates(result.value);
        } else {
          setError(
            result.message || "Impossible de charger l'etat des services.",
          );
        }
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : "Impossible de charger l'etat des services.",
        );
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [backgroundServiceController],
  );

  const handleResetGalleryScan = useCallback(
    async (galleryId: number) => {
      setError(null);
      setResettingGalleryId(galleryId);
      try {
        const result =
          await backgroundServiceController.resetGalleryScan(galleryId);
        if (!result.ok) {
          const statusText = result.statusText ? ` (${result.statusText})` : "";
          setError(`Impossible de reinitialiser le scan.${statusText}`);
          return;
        }

        await loadStates(true);
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : "Impossible de reinitialiser le scan.",
        );
      } finally {
        setResettingGalleryId(null);
      }
    },
    [backgroundServiceController, loadStates],
  );

  useEffect(() => {
    loadStates();
  }, [loadStates]);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const sections = states ? getSections(states) : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadStates(true)}
        />
      }
    >
      <Text style={styles.screenTitle}>Services en background</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {sections.map((item) => (
        <View key={item.key} style={styles.card}>
          <Text style={styles.serviceTitle}>{item.title}</Text>
          {item.lines.map((line, index) => (
            <Text key={`${item.key}-${index}`} style={styles.stateLine}>
              {line}
            </Text>
          ))}
        </View>
      ))}

      <View style={styles.card}>
        <Text style={styles.serviceTitle}>Gallery Scan</Text>
        {!states || states.galleryScanByGallery.length === 0 ? (
          <Text style={styles.emptyText}>
            Aucun etat de service disponible.
          </Text>
        ) : (
          states.galleryScanByGallery.map((item) => {
            const galleryLabel =
              item.galleryName?.trim() || `Galerie ${item.galleryId}`;
            const isResetting = resettingGalleryId === item.galleryId;

            return (
              <View key={item.galleryId} style={styles.galleryItem}>
                <Text style={styles.galleryName}>{galleryLabel}</Text>
                <Text style={styles.stateLine}>
                  Id galerie: {item.galleryId}
                </Text>
                <Text style={styles.stateLine}>
                  Dernier dossier scanne:{" "}
                  {formatNumber(item.lastScannedDirectoryId)}
                </Text>
                <Text style={styles.stateLine}>
                  Dernier scan complet: {formatDate(item.lastCompletedScanDate)}
                </Text>

                <TouchableOpacity
                  disabled={isResetting}
                  style={[
                    styles.resetButton,
                    isResetting && styles.resetButtonDisabled,
                  ]}
                  onPress={() => handleResetGalleryScan(item.galleryId)}
                >
                  <Text style={styles.resetButtonText}>
                    {isResetting
                      ? "Reinitialisation..."
                      : "Forcer un nouveau scan"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
  },
  errorText: {
    color: "#b00020",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  galleryItem: {
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 12,
    marginTop: 12,
  },
  galleryName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  stateLine: {
    fontSize: 14,
    lineHeight: 20,
    color: "#222",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  resetButton: {
    marginTop: 10,
    backgroundColor: "#1976d2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  resetButtonDisabled: {
    backgroundColor: "#9cb9d6",
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
