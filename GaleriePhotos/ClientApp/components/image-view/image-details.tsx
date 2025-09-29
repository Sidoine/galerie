import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { observer } from "mobx-react-lite";
import { PhotoFull } from "@/services/views";
import Icon from "../Icon";
import { theme } from "@/stores/theme";
import { AdaptiveMap } from "./adaptive-map";

interface ImageDetailsProps {
  image: PhotoFull;
  open: boolean;
  onClose: () => void;
}

// Remplacement du Drawer MUI par un panneau latéral overlay coulissant simple.
// Pour l'instant, la carte (react-leaflet) est remplacée par un bloc affichant les coordonnées.
export const ImageDetails = observer(function ImageDetails({
  image,
  open,
  onClose,
}: ImageDetailsProps) {
  if (!open) return null;
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.panel}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
          >
            <Icon name="close" set="mci" size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>Renseignements</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionCaption}>Détails</Text>
          {image.dateTime && (
            <DetailRow
              icon={<Icon name="calendar" set="mci" size={18} />}
              text={new Date(image.dateTime).toLocaleDateString()}
            />
          )}
          {image.camera && (
            <DetailRow
              icon={<Icon name="camera-outline" set="mci" size={18} />}
              text={image.camera}
            />
          )}
          <DetailRow
            icon={<Icon name="image-outline" set="mci" size={18} />}
            text={image.name}
          />
          {image.latitude && image.longitude && (
            <View style={styles.geoBox}>
              <Text style={styles.geoText}>
                Lat: {image.latitude.toFixed(5)}
              </Text>
              <Text style={styles.geoText}>
                Lon: {image.longitude.toFixed(5)}
              </Text>
              <AdaptiveMap
                latitude={image.latitude}
                longitude={image.longitude}
                title="Photo prise ici"
                description={image.name}
                style={styles.map}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
});

function DetailRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>{icon}</View>
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

const PANEL_WIDTH = 360;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: PANEL_WIDTH,
    backgroundColor: theme.palette.background,
    elevation: 8,
    zIndex: 3000,
  },
  panel: {
    flex: 1,
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(3),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  closeBtn: {
    padding: 8,
    marginRight: 8,
  },
  closeTxt: {
    color: theme.palette.textPrimary,
    fontSize: 18,
  },
  title: {
    color: theme.palette.textPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    paddingBottom: 40,
  },
  sectionCaption: {
    color: theme.palette.textSecondary,
    fontSize: 12,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing(1.5),
  },
  detailIcon: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: {
    color: theme.palette.textPrimary,
    flexShrink: 1,
  },
  geoBox: {
    marginTop: theme.spacing(3),
    backgroundColor: theme.palette.surface,
    padding: theme.spacing(3),
    borderRadius: theme.radius.md,
  },
  geoText: {
    color: theme.palette.textPrimary,
    fontSize: 14,
  },
  geoHint: {
    marginTop: theme.spacing(2),
    fontSize: 11,
    color: theme.palette.textMuted,
  },
  map: {
    height: 200,
    marginTop: theme.spacing(2),
    borderRadius: theme.radius.md,
  },
});
