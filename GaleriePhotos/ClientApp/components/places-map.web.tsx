// NOTE: La version mobile est implémentée dans `places-map.tsx` (react-native-maps).
// Ici c'est la version web basée sur react-leaflet. L'import générique `import PlacesMap from "./places-map.web"` est
// actuellement utilisé explicitement dans `places-map-view.tsx`. Pour une résolution automatique par plateforme,
// on pourrait renommer ce fichier en `places-map.web.tsx` (déjà le cas) et importer simplement `./places-map`.
import { TileLayer, Marker, Popup, MapContainer } from "react-leaflet";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Place } from "@/services/views";
import { theme } from "@/stores/theme";

function PlacesMap({
  selectedCountry,
  placesToShow,
  onClickPhotos,
  onClickPlace,
}: {
  selectedCountry: Place | null;
  placesToShow: Place[];
  onClickPlace: (place: Place) => void;
  onClickPhotos: (placeId: number) => void;
}) {
  // Calculate map bounds to show all places
  const latitudes = placesToShow.map((p) => p.latitude);
  const longitudes = placesToShow.map((p) => p.longitude);
  const centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
  const centerLng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;

  return (
    <MapContainer
      key={selectedCountry?.id || "countries"} // Force re-render when switching views
      center={[centerLat, centerLng]}
      zoom={selectedCountry ? 6 : 2} // Zoom in more for cities, out for countries
      style={{ height: "100%", width: "100%" }}
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
                  onPress={() => onClickPlace(place)}
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
