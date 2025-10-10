import React, { useMemo } from "react";
import MapView, {
  Marker,
  Callout,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Place } from "@/services/views";
import { theme } from "@/stores/theme";
import { PlacesMapProps } from "./places-map-props";

/**
 * Mobile implementation of PlacesMap (parallèle à places-map.web.tsx) utilisant react-native-maps.
 * Choisie automatiquement par Metro bundler sur mobile grâce au nom sans suffixe .web.
 */
function PlacesMap({
  selectedCountry,
  placesToShow,
  onClickPhotos,
  onClickPlace,
}: PlacesMapProps) {
  const { width } = useWindowDimensions();

  // Valeurs par défaut si liste vide (éviter NaN)
  const initialRegion: Region = useMemo(() => {
    if (!placesToShow || placesToShow.length === 0) {
      return {
        latitude: 20,
        longitude: 0,
        latitudeDelta: selectedCountry ? 8 : 80,
        longitudeDelta: selectedCountry ? 8 : 80,
      };
    }
    const lats = placesToShow.map((p) => p.latitude);
    const lngs = placesToShow.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;

    // Ajuster delta pour englober tous les marqueurs. Ajouter un padding proportionnel.
    const latDeltaRaw = Math.max(0.5, (maxLat - minLat) * 1.4);
    const lngDeltaRaw = Math.max(0.5, (maxLng - minLng) * 1.4);

    // Limiter selon niveau (pays vs global)
    const latitudeDelta = selectedCountry
      ? Math.min(latDeltaRaw, 10)
      : Math.max(latDeltaRaw, 20);
    const longitudeDelta = selectedCountry
      ? Math.min(lngDeltaRaw, 10)
      : Math.max(lngDeltaRaw, 20);

    return { latitude, longitude, latitudeDelta, longitudeDelta };
  }, [placesToShow, selectedCountry]);

  return (
    <MapView
      style={{ width, height: 512 }}
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      initialRegion={initialRegion}
    >
      {placesToShow.map((place) => (
        <Marker
          key={place.id}
          coordinate={{ latitude: place.latitude, longitude: place.longitude }}
          title={place.name}
          description={`${place.numberOfPhotos} photo${
            place.numberOfPhotos !== 1 ? "s" : ""
          }`}
        >
          <Callout tooltip>
            <View style={styles.calloutContainer}>
              <Text style={styles.calloutTitle}>{place.name}</Text>
              <Text style={styles.calloutText}>
                {place.numberOfPhotos} photo
                {place.numberOfPhotos !== 1 ? "s" : ""}
              </Text>
              {selectedCountry ? (
                <TouchableOpacity
                  style={styles.calloutButton}
                  onPress={() => onClickPhotos(place.id)}
                >
                  <Text style={styles.calloutButtonText}>Voir les photos</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.calloutButton}
                  onPress={() => onClickPlace(place.id)}
                >
                  <Text style={styles.calloutButtonText}>Voir les villes</Text>
                </TouchableOpacity>
              )}
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

export default PlacesMap;

const styles = StyleSheet.create({
  calloutContainer: {
    backgroundColor: theme.palette.surface,
    padding: 12,
    borderRadius: theme.radius.md,
    maxWidth: 200,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  calloutTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: theme.palette.textPrimary,
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 14,
    color: theme.palette.textSecondary,
    marginBottom: 8,
  },
  calloutButton: {
    backgroundColor: theme.palette.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    alignItems: "center",
  },
  calloutButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
