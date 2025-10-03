import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { theme } from "@/stores/theme";

interface AdaptiveMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  style?: ViewStyle;
}

function AdaptiveMapWeb({
  latitude,
  longitude,
  title = "Position de la photo",
  description,
  style,
}: AdaptiveMapProps) {
  const position: [number, number] = [latitude, longitude];

  return (
    <View style={[styles.webMapContainer, style]}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%", borderRadius: theme.radius.md }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          {(title || description) && (
            <Popup>
              {title && <strong>{title}</strong>}
              {description && <div>{description}</div>}
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </View>
  );
}

export default AdaptiveMapWeb;

const styles = StyleSheet.create({
  webMapContainer: {
    height: 200,
    borderRadius: theme.radius.md,
    overflow: "hidden",
  },
  mobileMap: {
    height: 200,
    borderRadius: theme.radius.md,
  },
  loadingContainer: {
    height: 200,
    backgroundColor: theme.palette.surface,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.palette.textSecondary,
    fontSize: 14,
  },
});
