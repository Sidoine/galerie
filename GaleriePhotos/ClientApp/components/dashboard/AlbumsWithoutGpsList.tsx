import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "@/components/Icon";
import DashboardDirectory from "@/components/dashboard/DashboardDirectory";
import { palette } from "@/stores/theme";
import { AlbumWithoutGpsInfo } from "@/services/services";

type AlbumsWithoutGpsListProps = {
  albums: AlbumWithoutGpsInfo[];
  totalListedCount: number;
  onSelect: (album: AlbumWithoutGpsInfo) => void;
};

const AlbumsWithoutGpsList: React.FC<AlbumsWithoutGpsListProps> = ({
  albums,
  totalListedCount,
  onSelect,
}) => {
  if (!albums.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Albums avec photos sans GPS</Text>
      <Text style={styles.sampleInfo}>
        {totalListedCount} albums listés (top {albums.length})
      </Text>
      {albums.map((albumInfo) => (
        <DashboardDirectory
          key={`${albumInfo.directoryId}`}
          onPress={() => onSelect(albumInfo)}
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
});

export default AlbumsWithoutGpsList;
