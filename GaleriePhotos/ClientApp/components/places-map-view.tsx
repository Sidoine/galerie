import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { observer } from "mobx-react-lite";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { usePlacesStore } from "@/stores/places";
import { useUi } from "@/stores/ui";
import { theme } from "@/stores/theme";
import "leaflet/dist/leaflet.css";

export interface PlacesMapViewProps {
  galleryId: number;
}

export const PlacesMapView = observer(({ galleryId }: PlacesMapViewProps) => {
  const placesStore = usePlacesStore();
  const { navigateToPlacePhotos } = useUi();
  const places = placesStore.getPlacesByGallery(galleryId);

  useEffect(() => {
    placesStore.loadPlacesByGallery(galleryId);
  }, [galleryId, placesStore]);

  if (placesStore.loading && places.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading places...</Text>
      </View>
    );
  }

  if (places.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No places found for this gallery</Text>
        <Text style={styles.emptySubtext}>
          Places are automatically created when photos with GPS coordinates are
          processed
        </Text>
      </View>
    );
  }

  // Calculate map bounds to show all places
  const latitudes = places.map((p) => p.latitude);
  const longitudes = places.map((p) => p.longitude);
  const centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
  const centerLng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={10}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {places.map((place) => (
            <Marker key={place.id} position={[place.latitude, place.longitude]}>
              <Popup>
                <View>
                  <Text style={styles.popupTitle}>{place.name}</Text>
                  <Text style={styles.popupText}>
                    {place.photoCount} photo{place.photoCount !== 1 ? "s" : ""}
                  </Text>
                  <TouchableOpacity
                    style={styles.popupButton}
                    onPress={() => navigateToPlacePhotos(place.id)}
                  >
                    <Text style={styles.popupButtonText}>View Photos</Text>
                  </TouchableOpacity>
                </View>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </View>

      <ScrollView style={styles.placesListContainer}>
        <Text style={styles.placesListTitle}>Places in this Gallery</Text>
        {places.map((place) => (
          <TouchableOpacity
            key={place.id}
            style={styles.placeItem}
            onPress={() => navigateToPlacePhotos(place.id)}
          >
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placePhotoCount}>
                {place.photoCount} photo{place.photoCount !== 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.placeCoordinates}>
              <Text style={styles.coordinateText}>
                {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.palette.background,
  },
  loadingText: {
    color: theme.palette.textPrimary,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.palette.background,
    padding: 20,
  },
  emptyText: {
    color: theme.palette.textPrimary,
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtext: {
    color: theme.palette.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  mapContainer: {
    height: 400,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    margin: 16,
  },
  placesListContainer: {
    flex: 1,
    padding: 16,
  },
  placesListTitle: {
    color: theme.palette.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  placeItem: {
    backgroundColor: theme.palette.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    color: theme.palette.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  placePhotoCount: {
    color: theme.palette.textSecondary,
    fontSize: 14,
  },
  placeCoordinates: {
    alignItems: "flex-end",
  },
  coordinateText: {
    color: theme.palette.textSecondary,
    fontSize: 12,
    fontFamily: "monospace",
  },
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
