// NOTE: La version mobile est implémentée dans `places-map.tsx` (react-native-maps).
// Ici c'est la version web basée sur react-leaflet. L'import générique `import PlacesMap from "./places-map.web"` est
// actuellement utilisé explicitement dans `places-map-view.tsx`. Pour une résolution automatique par plateforme,
// on pourrait renommer ce fichier en `places-map.web.tsx` (déjà le cas) et importer simplement `./places-map`.
import { useMemo } from "react";
import { TileLayer, Marker, Popup, MapContainer } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { theme } from "@/stores/theme";
import { PlacesMapProps } from "./places-map-props";

function PlacesMap({
  selectedCountry,
  placesToShow,
  onClickPhotos,
  onClickPlace,
}: PlacesMapProps) {
  // Pre-compute map center + bounds and guard against empty datasets, otherwise Leaflet receives NaN
  const { center, bounds, zoom } = useMemo(() => {
    if (!placesToShow || placesToShow.length === 0) {
      return {
        center: [20, 0] as [number, number],
        bounds: undefined,
        zoom: selectedCountry ? 5 : 2,
      };
    }

    const latitudes = placesToShow.map((p) => p.latitude);
    const longitudes = placesToShow.map((p) => p.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const latSpread = maxLat - minLat;
    const lngSpread = maxLng - minLng;
    const latPadding = latSpread === 0 ? 1 : latSpread * 0.15;
    const lngPadding = lngSpread === 0 ? 1 : lngSpread * 0.15;

    const computedBounds: LatLngBoundsExpression = [
      [Math.max(-90, minLat - latPadding), Math.max(-180, minLng - lngPadding)],
      [Math.min(90, maxLat + latPadding), Math.min(180, maxLng + lngPadding)],
    ];

    return {
      center: [centerLat, centerLng] as [number, number],
      bounds: computedBounds,
      zoom: selectedCountry ? 6 : 3,
    };
  }, [placesToShow, selectedCountry]);

  return (
    <MapContainer
      key={selectedCountry?.id || "countries"} // Force re-render when switching views
      center={center}
      zoom={zoom}
      bounds={bounds}
      style={{ height: 512, width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {placesToShow.map((place) => (
        <Marker key={place.id} position={[place.latitude, place.longitude]}>
          <Popup>
            <View>
              <Text style={styles.popupTitle}>{place.name}</Text>
              <Text style={styles.popupText}>
                {place.numberOfPhotos} photo
                {place.numberOfPhotos !== 1 ? "s" : ""}
              </Text>
              {selectedCountry ? (
                // For cities, show "View Photos" button
                <TouchableOpacity
                  style={styles.popupButton}
                  onPress={() => onClickPhotos(place.id)}
                >
                  <Text style={styles.popupButtonText}>View Photos</Text>
                </TouchableOpacity>
              ) : (
                // For countries, show "View Cities" button
                <TouchableOpacity
                  style={styles.popupButton}
                  onPress={() => onClickPlace(place.id)}
                >
                  <Text style={styles.popupButtonText}>View Cities</Text>
                </TouchableOpacity>
              )}
            </View>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default PlacesMap;

const styles = StyleSheet.create({
  popupTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  popupText: {
    fontSize: 14,
    marginBottom: 8,
  },
  popupButton: {
    backgroundColor: theme.palette.primary,
    padding: 8,
    borderRadius: theme.radius.sm,
    alignItems: "center",
  },
  popupButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
