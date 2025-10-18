import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useRouter, useGlobalSearchParams } from "expo-router";
import {
  DashboardController,
  DashboardStatistics,
  AlbumWithoutGpsInfo,
  AlbumFilenameDateMismatchInfo,
} from "@/services/services";
import { useMeStore } from "@/stores/me";
import { useApiClient } from "folke-service-helpers";
import { palette, radius } from "@/stores/theme";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PhotosWithoutGpsCard from "@/components/dashboard/PhotosWithoutGpsCard";
import PhotosDateMismatchCard from "@/components/dashboard/PhotosDateMismatchCard";
import AlbumsWithoutGpsList from "@/components/dashboard/AlbumsWithoutGpsList";
import AlbumsWithDateMismatchList from "@/components/dashboard/AlbumsWithDateMismatchList";
import AutoNamedFacesCard from "@/components/dashboard/AutoNamedFacesCard";

const DashboardScreen = observer(function DashboardScreen() {
  const router = useRouter();
  const { galleryId } = useGlobalSearchParams<{ galleryId: string }>();
  const meStore = useMeStore();
  const apiClient = useApiClient();
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAlbumsWithoutGps, setShowAlbumsWithoutGps] = useState(false);
  const [showAlbumsWithDateMismatch, setShowAlbumsWithDateMismatch] =
    useState(false);
  const [showAutoNamedFaces, setShowAutoNamedFaces] = useState(false);

  const dashboardController = useMemo(
    () => new DashboardController(apiClient),
    [apiClient]
  );

  const albumsWithoutGps = useMemo(
    () => statistics?.albumsWithoutGps ?? [],
    [statistics]
  );

  const albumsWithDateMismatch = useMemo(
    () => statistics?.albumsWithFilenameDateMismatch ?? [],
    [statistics]
  );

  const loadStatistics = useCallback(async () => {
    if (!galleryId) return;

    try {
      setShowAlbumsWithoutGps(false);
      setShowAlbumsWithDateMismatch(false);
      setLoading(true);
      setError(null);
      const response = await dashboardController.getStatistics(
        Number(galleryId)
      );
      if (response.ok) {
        setStatistics(response.value);
      } else {
        setError(
          response.message ||
            "Impossible de charger les statistiques du tableau de bord"
        );
      }
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }, [dashboardController, galleryId]);

  const toggleAlbumsVisibility = useCallback(() => {
    if (!albumsWithoutGps.length) {
      return;
    }
    setShowAlbumsWithDateMismatch(false);
    setShowAlbumsWithoutGps((previous) => !previous);
  }, [albumsWithoutGps.length]);

  const toggleDateMismatchAlbumsVisibility = useCallback(() => {
    if (!albumsWithDateMismatch.length) {
      return;
    }
    setShowAlbumsWithoutGps(false);
    setShowAlbumsWithDateMismatch((previous) => !previous);
  }, [albumsWithDateMismatch.length]);

  const toggleAutoNamedFacesVisibility = useCallback(() => {
    if (!statistics?.autoNamedFaceSamples.length) {
      return;
    }
    setShowAlbumsWithoutGps(false);
    setShowAlbumsWithDateMismatch(false);
    setShowAutoNamedFaces((prev) => !prev);
  }, [statistics]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  useEffect(() => {
    setShowAlbumsWithoutGps(false);
    setShowAlbumsWithDateMismatch(false);
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

  const openFirstMismatchPhoto = useCallback(
    (info: AlbumFilenameDateMismatchInfo) => {
      if (!galleryId) {
        return;
      }
      router.push({
        pathname: "/(app)/gallery/[galleryId]/photos/[photoId]",
        params: { galleryId, photoId: info.firstPhotoId },
      });
    },
    [galleryId, router]
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
        <TouchableOpacity style={styles.retryButton} onPress={loadStatistics}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <DashboardHeader title="Tableau de bord" />

      {statistics && (
        <View style={styles.statisticsContainer}>
          <PhotosWithoutGpsCard
            totalCount={statistics.photosWithoutGpsCount}
            hasAlbums={albumsWithoutGps.length > 0}
            expanded={showAlbumsWithoutGps}
            onToggle={toggleAlbumsVisibility}
          />
          <PhotosDateMismatchCard
            totalCount={statistics.photosWithFilenameDateMismatchCount}
            hasAlbums={albumsWithDateMismatch.length > 0}
            expanded={showAlbumsWithDateMismatch}
            onToggle={toggleDateMismatchAlbumsVisibility}
          />
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
          {albumsWithDateMismatch.length > 0 && showAlbumsWithDateMismatch ? (
            <AlbumsWithDateMismatchList
              albums={albumsWithDateMismatch}
              totalListedCount={
                statistics.albumsWithPhotosWithFilenameDateMismatchCount
              }
              onOpenPhoto={openFirstMismatchPhoto}
            />
          ) : null}
          {statistics.autoNamedFaceSamples.length > 0 && showAutoNamedFaces ? (
            <View style={styles.samplesContainer}>
              <Text style={styles.sectionTitle}>Visages auto-nommés</Text>
              <Text style={styles.sampleInfo}>
                {statistics.autoNamedFaceSamples.length} paires affichées
              </Text>
              {statistics.autoNamedFaceSamples.map((sample) => (
                <View key={sample.faceId.toString()} style={styles.sampleItem}>
                  <Text style={styles.sampleText}>
                    Visage #{sample.faceId} ← Visage #
                    {sample.autoNamedFromFaceId}
                  </Text>
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
  sampleText: {
    fontSize: 14,
    color: palette.textPrimary,
  },
});

export default DashboardScreen;
