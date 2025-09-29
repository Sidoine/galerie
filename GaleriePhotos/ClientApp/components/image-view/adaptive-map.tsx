import React from "react";
import { Platform, View, StyleSheet, Text } from "react-native";
import { theme } from "@/stores/theme";

interface AdaptiveMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  style?: any;
}

export function AdaptiveMap({
  latitude,
  longitude,
  title = "Position de la photo",
  description,
  style,
}: AdaptiveMapProps) {
  
  if (Platform.OS === "web") {
    // Pour le web, utilisons une approche simple avec une iframe OpenStreetMap
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01}%2C${latitude-0.01}%2C${longitude+0.01}%2C${latitude+0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;
    
    return (
      <View style={[styles.webMapContainer, style]}>
        <iframe
          src={mapUrl}
          style={{ 
            width: "100%", 
            height: "100%", 
            border: "none",
            borderRadius: theme.radius.md 
          }}
          title={title}
        />
      </View>
    );
  }

  // Pour mobile, utiliser react-native-maps
  const [MapView, setMapView] = React.useState<any>(null);
  const [Marker, setMarker] = React.useState<any>(null);

  React.useEffect(() => {
    // Chargement dynamique de react-native-maps
    const loadMaps = async () => {
      try {
        const mapsModule = await import("react-native-maps");
        setMapView(() => mapsModule.default);
        setMarker(() => mapsModule.Marker);
      } catch (error) {
        console.error("Erreur lors du chargement de react-native-maps:", error);
      }
    };

    loadMaps();
  }, []);

  if (!MapView || !Marker) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

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