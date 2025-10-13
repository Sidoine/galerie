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
} from "@/services/services";
import { useMeStore } from "@/stores/me";
import { useApiClient } from "folke-service-helpers";
import Icon from "@/components/Icon";
import { palette, radius } from "@/stores/theme";

const Dashboard = observer(function Dashboard() {
  const router = useRouter();
  const { galleryId } = useGlobalSearchParams<{ galleryId: string }>();
  const meStore = useMeStore();
  const apiClient = useApiClient();
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dashboardController = useMemo(
    () => new DashboardController(apiClient),
    [apiClient]
  );

  const loadStatistics = useCallback(async () => {
    if (!galleryId) return;

    try {
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

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const navigateToAlbum = (albumInfo: AlbumWithoutGpsInfo) => {
    router.push(`/gallery/${galleryId}/directory/${albumInfo.directoryId}`);
  };

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
      <View style={styles.header}>
        <Icon set="mi" name="dashboard" size={24} color={palette.primary} />
        <Text style={styles.headerTitle}>Tableau de bord</Text>
      </View>

      {statistics && (
        <View style={styles.statisticsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Photos sans coordonnées GPS</Text>
            <Text style={styles.statNumber}>
              {statistics.photosWithoutGpsCount}
            </Text>
            <Text style={styles.statDescription}>
              Nombre total de photos sans localisation dans cette galerie
            </Text>
          </View>
          {statistics.albumsWithoutGps.length > 0 && (
            <View style={styles.photosSection}>
              <Text style={styles.sectionTitle}>
                Albums avec photos sans GPS
              </Text>
              <Text style={styles.sampleInfo}>
                {statistics.albumsWithPhotosWithoutGpsCount} albums listés (top{" "}
                {statistics.albumsWithoutGps.length})
              </Text>
              {statistics.albumsWithoutGps.map((albumInfo) => (
                <TouchableOpacity
                  key={`${albumInfo.directoryId}`}
                  style={styles.photoCard}
                  onPress={() => navigateToAlbum(albumInfo)}
                >
                  <View style={styles.photoInfo}>
                    <View style={styles.photoHeader}>
                      <Icon
                        set="mi"
                        name="folder"
                        size={16}
                        color={palette.textPrimary}
                      />
                      <Text style={styles.photoName}>
                        {albumInfo.directoryPath
                          .split(/[\\/]/)
                          .filter(Boolean)
                          .slice(-1)[0] ||
                          albumInfo.directoryPath ||
                          "(racine)"}
                      </Text>
                    </View>
                    <Text style={styles.albumInfo}>
                      {albumInfo.missingGpsPhotoCount} photo
                      {albumInfo.missingGpsPhotoCount > 1 ? "s" : ""} sans GPS
                    </Text>
                    <Text style={styles.albumPath} numberOfLines={1}>
                      {albumInfo.directoryPath}
                    </Text>
                  </View>
                  <Icon
                    set="mi"
                    name="chevron-right"
                    size={16}
                    color={palette.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: palette.textPrimary,
    marginLeft: 12,
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
  statCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 16,
    color: palette.textSecondary,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: palette.primary,
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  photosSection: {
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
  photoCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  photoInfo: {
    flex: 1,
  },
  photoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  photoName: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textPrimary,
    marginLeft: 8,
  },
  albumInfo: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 2,
  },
  albumPath: {
    fontSize: 12,
    color: palette.textSecondary,
    fontStyle: "italic",
  },
});

export default Dashboard;
