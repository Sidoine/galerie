import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "@/components/Icon";
import DashboardDirectory from "@/components/dashboard/DashboardDirectory";
import { palette } from "@/stores/theme";
import { AlbumFilenameDateMismatchInfo } from "@/services/services";

type AlbumsWithDateMismatchListProps = {
  albums: AlbumFilenameDateMismatchInfo[];
  totalListedCount: number;
  onOpenPhoto: (album: AlbumFilenameDateMismatchInfo) => void;
};

const AlbumsWithDateMismatchList: React.FC<AlbumsWithDateMismatchListProps> = ({
  albums,
  totalListedCount,
  onOpenPhoto,
}) => {
  if (!albums.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Albums avec date de fichier incohérente
      </Text>
      <Text style={styles.sampleInfo}>
        {totalListedCount} albums listés (top {albums.length})
      </Text>
      {albums.map((albumInfo) => (
        <DashboardDirectory
          key={`${albumInfo.directoryId}`}
          onPress={() => onOpenPhoto(albumInfo)}
          style={styles.albumCard}
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
              {albumInfo.mismatchedPhotoCount} photo
              {albumInfo.mismatchedPhotoCount > 1 ? "s" : ""} à vérifier
            </Text>
            <Text style={styles.albumPath} numberOfLines={1}>
              {albumInfo.directoryPath}
            </Text>
            <Text style={styles.photoLink}>
              Voir la première photo concernée (#
              {albumInfo.firstPhotoId})
            </Text>
          </View>
          <Icon
            set="mi"
            name="chevron-right"
            size={16}
            color={palette.textSecondary}
          />
        </DashboardDirectory>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  albumCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  photoLink: {
    fontSize: 12,
    color: palette.primary,
    marginTop: 4,
  },
});

export default AlbumsWithDateMismatchList;
