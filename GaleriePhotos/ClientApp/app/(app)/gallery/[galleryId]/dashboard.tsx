import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useRouter, useGlobalSearchParams } from "expo-router";
import {
  DashboardController,
  DashboardStatistics,
  AlbumWithoutGpsInfo,
  GpsBackfillProgress,
} from "@/services/services";
import { FaceController } from "@/services/face";
import { useMeStore } from "@/stores/me";
import { useApiClient } from "folke-service-helpers";
import { palette, radius } from "@/stores/theme";
import PhotosWithoutGpsCard from "@/components/dashboard/PhotosWithoutGpsCard";
import AlbumsWithoutGpsList from "@/components/dashboard/AlbumsWithoutGpsList";
import AutoNamedFacesCard from "@/components/dashboard/AutoNamedFacesCard";
import FaceThumbnail from "@/components/faces/face-thumbnail";

const DashboardScreen = observer(function DashboardScreen() {
  const router = useRouter();
  const { galleryId } = useGlobalSearchParams<{ galleryId: string }>();
  const meStore = useMeStore();
  const apiClient = useApiClient();
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(
    null
  );
  const [gpsProgress, setGpsProgress] = useState<GpsBackfillProgress | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlbumsWithoutGps, setShowAlbumsWithoutGps] = useState(false);
  const [showAutoNamedFaces, setShowAutoNamedFaces] = useState(false);

  const dashboardController = useMemo(
    () => new DashboardController(apiClient),
    [apiClient]
  );
  const faceController = useMemo(() => new FaceController(apiClient), [apiClient]);
  const [processingFaceIds, setProcessingFaceIds] = useState<number[]>([]);
  const [bulkAutoNamingProcessing, setBulkAutoNamingProcessing] = useState(false);
  const [autoNamedActionError, setAutoNamedActionError] = useState<string | null>(
    null
  );

  const albumsWithoutGps = useMemo(
    () => statistics?.albumsWithoutGps ?? [],
    [statistics]
  );

  const loadStatistics = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!galleryId) return;

      const silent = options?.silent ?? false;

      try {
        setShowAlbumsWithoutGps(false);
        setShowAutoNamedFaces(false);
        setAutoNamedActionError(null);
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const [statsResponse, progressResponse] = await Promise.all([
          dashboardController.getStatistics(Number(galleryId)),
          dashboardController.getGpsBackfillProgress(Number(galleryId)),
        ]);

        if (statsResponse.ok) {
          setStatistics(statsResponse.value);
        } else {
          setError(
            statsResponse.message ||
              "Impossible de charger les statistiques du tableau de bord"
          );
        }

        if (progressResponse.ok) {
          setGpsProgress(progressResponse.value);
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
        setError("Erreur de connexion au serveur");
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [dashboardController, galleryId]
  );

  const toggleAlbumsVisibility = useCallback(() => {
    if (!albumsWithoutGps.length) {
      return;
    }
    setShowAlbumsWithoutGps((previous) => !previous);
  }, [albumsWithoutGps.length]);

  const toggleAutoNamedFacesVisibility = useCallback(() => {
    if (!statistics?.autoNamedFaceSamples.length) {
      return;
    }
    setShowAutoNamedFaces((prev) => !prev);
  }, [statistics]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  useEffect(() => {
    setShowAlbumsWithoutGps(false);
  }, [galleryId]);

  const navigateToAlbum = useCallback(
    (albumInfo: AlbumWithoutGpsInfo) => {
      if (!galleryId) {
        return;
      }
      router.push(`/gallery/${galleryId}/directory/${albumInfo.directoryId}`);
    },
    [galleryId, router]
  );

  const handleRefresh = useCallback(() => {
    loadStatistics({ silent: true });
  }, [loadStatistics]);

  const removeAutoNamedFacesFromState = useCallback((faceIds: number[]) => {
    if (faceIds.length === 0) return;
    setStatistics((previous) => {
      if (!previous) return previous;
      const ids = new Set(faceIds);
      const remainingSamples = previous.autoNamedFaceSamples.filter(
        (sample) => !ids.has(sample.faceId)
      );
      const removedCount = previous.autoNamedFaceSamples.length - remainingSamples.length;
      return {
        ...previous,
        autoNamedFaceSamples: remainingSamples,
        autoNamedFacesCount: Math.max(0, previous.autoNamedFacesCount - removedCount),
      };
    });
  }, [setStatistics]);

  const loadMoreAutoNamedFacesSamples = useCallback(
    async (remainingCount: number) => {
      if (!galleryId || remainingCount <= 0) {
        return;
      }

      try {
        const response = await faceController.getAutoNamedFacePairs(
          Number(galleryId),
          Math.min(20, remainingCount)
        );

        if (!response.ok) {
          setAutoNamedActionError("Impossible de charger de nouvelles paires");
          return;
        }

        setStatistics((previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            autoNamedFaceSamples: response.value.map((pair) => ({
              faceId: pair.faceId,
              autoNamedFromFaceId: pair.referenceFaceId,
            })),
          };
        });
      } catch {
        setAutoNamedActionError("Impossible de charger de nouvelles paires");
      }
    },
    [faceController, galleryId]
  );

  const handleAutoNamedFaceAction = useCallback(
    async (faceId: number, action: "accept" | "reject") => {
      if (!galleryId) return;

      setAutoNamedActionError(null);
      setProcessingFaceIds((previous) =>
        previous.includes(faceId) ? previous : [...previous, faceId]
      );
      try {
        const response =
          action === "accept"
            ? await faceController.acceptAutoNaming(Number(galleryId), faceId)
            : await faceController.undoAutoNaming(Number(galleryId), faceId);

        if (response.ok) {
          const shouldLoadMoreSamples =
            (statistics?.autoNamedFaceSamples.length ?? 0) === 1 &&
            (statistics?.autoNamedFacesCount ?? 0) > 1;
          removeAutoNamedFacesFromState([faceId]);
          if (shouldLoadMoreSamples) {
            await loadMoreAutoNamedFacesSamples(
              (statistics?.autoNamedFacesCount ?? 0) - 1
            );
          }
          return;
        }

        setAutoNamedActionError(
          action === "accept"
            ? "Impossible d'accepter cette paire"
            : "Impossible de refuser cette paire"
        );
      } catch {
        setAutoNamedActionError(
          action === "accept"
            ? "Erreur lors de l'acceptation de la paire"
            : "Erreur lors du refus de la paire"
        );
      } finally {
        setProcessingFaceIds((previous) => previous.filter((id) => id !== faceId));
      }
    },
    [
      faceController,
      galleryId,
      loadMoreAutoNamedFacesSamples,
      removeAutoNamedFacesFromState,
      statistics,
      setAutoNamedActionError,
      setProcessingFaceIds,
    ]
  );

  const handleAutoNamedFacesBulkAction = useCallback(
    async (action: "accept" | "reject") => {
      if (!galleryId || !statistics?.autoNamedFaceSamples.length) return;

      const faceIds = statistics.autoNamedFaceSamples.map((sample) => sample.faceId);
      const successfulFaceIds: number[] = [];

      setAutoNamedActionError(null);
      setBulkAutoNamingProcessing(true);

      for (const faceId of faceIds) {
        try {
          const response =
            action === "accept"
              ? await faceController.acceptAutoNaming(Number(galleryId), faceId)
              : await faceController.undoAutoNaming(Number(galleryId), faceId);
          if (response.ok) {
            successfulFaceIds.push(faceId);
          }
        } catch {
          // Ignored: counted in failures below
        }
      }

      setBulkAutoNamingProcessing(false);
      removeAutoNamedFacesFromState(successfulFaceIds);

      const shouldLoadMoreSamples =
        successfulFaceIds.length === faceIds.length &&
        (statistics?.autoNamedFacesCount ?? 0) > faceIds.length;
      if (shouldLoadMoreSamples) {
        await loadMoreAutoNamedFacesSamples(
          (statistics?.autoNamedFacesCount ?? 0) - faceIds.length
        );
      }

      const failedCount = faceIds.length - successfulFaceIds.length;
      if (failedCount > 0) {
        setAutoNamedActionError(
          `${failedCount} paire(s) n'ont pas pu être ${
            action === "accept" ? "acceptées" : "refusées"
          }`
        );
      }
    },
    [
      faceController,
      galleryId,
      loadMoreAutoNamedFacesSamples,
      removeAutoNamedFacesFromState,
      setAutoNamedActionError,
      setBulkAutoNamingProcessing,
      statistics,
    ]
  );

  if (!meStore.administrator) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Accès non autorisé. Seuls les administrateurs peuvent accéder au
          tableau de bord.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadStatistics()}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[palette.primary]}
          tintColor={palette.primary}
        />
      }
    >
      {statistics && (
        <View style={styles.statisticsContainer}>
          <PhotosWithoutGpsCard
            totalCount={statistics.photosWithoutGpsCount}
            hasAlbums={albumsWithoutGps.length > 0}
            expanded={showAlbumsWithoutGps}
            onToggle={toggleAlbumsVisibility}
          />
          {gpsProgress && gpsProgress.totalPhotosWithoutGps > 0 && (
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Traitement GPS en cours</Text>
              <Text style={styles.progressSubtitle}>
                {gpsProgress.processedCount} /{" "}
                {gpsProgress.totalPhotosWithoutGps} photos traitées
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${
                        gpsProgress.totalPhotosWithoutGps > 0
                          ? (gpsProgress.processedCount /
                              gpsProgress.totalPhotosWithoutGps) *
                            100
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {gpsProgress.totalPhotosWithoutGps > 0
                  ? Math.round(
                      (gpsProgress.processedCount /
                        gpsProgress.totalPhotosWithoutGps) *
                        100
                    )
                  : 0}
                %
              </Text>
            </View>
          )}
          <AutoNamedFacesCard
            totalCount={statistics.autoNamedFacesCount}
            hasSamples={statistics.autoNamedFaceSamples.length > 0}
            expanded={showAutoNamedFaces}
            onToggle={toggleAutoNamedFacesVisibility}
          />
          {albumsWithoutGps.length > 0 && showAlbumsWithoutGps ? (
            <AlbumsWithoutGpsList
              albums={albumsWithoutGps}
              totalListedCount={statistics.albumsWithPhotosWithoutGpsCount}
              onSelect={navigateToAlbum}
            />
          ) : null}
          {statistics.autoNamedFaceSamples.length > 0 && showAutoNamedFaces ? (
            <View style={styles.samplesContainer}>
              <Text style={styles.sectionTitle}>Visages auto-nommés</Text>
              <Text style={styles.sampleInfo}>
                {statistics.autoNamedFaceSamples.length} paires affichées
              </Text>
              <View style={styles.bulkActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.bulkActionButton,
                    styles.acceptActionButton,
                    bulkAutoNamingProcessing && styles.disabledActionButton,
                  ]}
                  onPress={() => handleAutoNamedFacesBulkAction("accept")}
                  disabled={bulkAutoNamingProcessing}
                >
                  <Text style={styles.actionButtonText}>Tout accepter</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.bulkActionButton,
                    styles.rejectActionButton,
                    bulkAutoNamingProcessing && styles.disabledActionButton,
                  ]}
                  onPress={() => handleAutoNamedFacesBulkAction("reject")}
                  disabled={bulkAutoNamingProcessing}
                >
                  <Text style={styles.actionButtonText}>Tout refuser</Text>
                </TouchableOpacity>
              </View>
              {autoNamedActionError && (
                <Text style={styles.autoNamedActionError}>{autoNamedActionError}</Text>
              )}
              {statistics.autoNamedFaceSamples.map((sample) => (
                <View key={sample.faceId.toString()} style={styles.sampleItem}>
                  <View style={styles.sampleFacesRow}>
                    <FaceThumbnail galleryId={String(galleryId)} face={{ id: sample.faceId }} />
                    <FaceThumbnail
                      galleryId={String(galleryId)}
                      face={{ id: sample.autoNamedFromFaceId }}
                    />
                  </View>
                  <View style={styles.sampleActionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.sampleActionButton,
                        styles.acceptActionButton,
                        processingFaceIds.includes(sample.faceId) &&
                          styles.disabledActionButton,
                      ]}
                      onPress={() => handleAutoNamedFaceAction(sample.faceId, "accept")}
                      disabled={processingFaceIds.includes(sample.faceId)}
                    >
                      <Text style={styles.actionButtonText}>Accepter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.sampleActionButton,
                        styles.rejectActionButton,
                        processingFaceIds.includes(sample.faceId) &&
                          styles.disabledActionButton,
                      ]}
                      onPress={() => handleAutoNamedFaceAction(sample.faceId, "reject")}
                      disabled={processingFaceIds.includes(sample.faceId)}
                    >
                      <Text style={styles.actionButtonText}>Refuser</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: "center",
    marginTop: 48,
  },
  errorText: {
    fontSize: 16,
    color: palette.danger,
    textAlign: "center",
    marginTop: 48,
  },
  retryButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
    alignSelf: "center",
  },
  retryButtonText: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  statisticsContainer: {
    gap: 16,
  },
  samplesContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.textPrimary,
    marginBottom: 12,
  },
  sampleInfo: {
    fontSize: 14,
    color: palette.textSecondary,
    fontStyle: "italic",
    marginBottom: 12,
    textAlign: "center",
  },
  sampleItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  sampleFacesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sampleActionsRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  sampleActionButton: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: "center",
  },
  bulkActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  bulkActionButton: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  acceptActionButton: {
    backgroundColor: "#2e7d32",
  },
  rejectActionButton: {
    backgroundColor: "#c62828",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  disabledActionButton: {
    opacity: 0.5,
  },
  autoNamedActionError: {
    fontSize: 14,
    color: palette.danger,
    marginBottom: 8,
  },
  progressCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textPrimary,
    marginBottom: 8,
  },
  progressSubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: palette.border,
    borderRadius: radius.sm,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: palette.primary,
    borderRadius: radius.sm,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.primary,
    textAlign: "right",
  },
});

export default DashboardScreen;
