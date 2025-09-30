import React from "react";
import { View, StyleSheet, Text, ViewStyle } from "react-native";
import { theme } from "@/stores/theme";
import MapView, { Marker } from "react-native-maps";

interface AdaptiveMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  style?: ViewStyle;
}

function AdaptiveMap({
  latitude,
  longitude,
  title = "Position de la photo",
  description,
  style,
}: AdaptiveMapProps) {
  return (
    <MapView
      style={[styles.mobileMap, style]}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        title={title}
        description={description}
      />
    </MapView>
  );
}

export default AdaptiveMap;

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
