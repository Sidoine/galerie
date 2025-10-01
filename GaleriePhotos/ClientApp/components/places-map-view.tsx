import React, { useEffect, useState } from "react";
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
import { Place } from "@/services/views";
import "leaflet/dist/leaflet.css";

export interface PlacesMapViewProps {
  galleryId: number;
}

export const PlacesMapView = observer(({ galleryId }: PlacesMapViewProps) => {
  const placesStore = usePlacesStore();
  const { navigateToPlacePhotos } = useUi();
  const [selectedCountry, setSelectedCountry] = useState<Place | null>(null);

  const countries = placesStore.getCountriesByGallery(galleryId);
  const cities = selectedCountry
    ? placesStore.getCitiesByCountry(selectedCountry.id)
    : [];

  useEffect(() => {
    placesStore.loadCountriesByGallery(galleryId);
  }, [galleryId, placesStore]);

  useEffect(() => {
    if (selectedCountry) {
      placesStore.loadCitiesByCountry(galleryId, selectedCountry.id);
    }
  }, [selectedCountry, galleryId, placesStore]);

  const handleCountryClick = (country: Place) => {
    if (selectedCountry?.id === country.id) {
      setSelectedCountry(null); // Deselect if clicking the same country
    } else {
      setSelectedCountry(country);
    }
  };

  const handleBackToCountries = () => {
    setSelectedCountry(null);
  };

  if (placesStore.loading && countries.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading places...</Text>
      </View>
    );
  }

  if (countries.length === 0) {
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

  // Determine what to show on the map
  const placesToShow = selectedCountry ? cities : countries;
  const mapTitle = selectedCountry
    ? `Cities in ${selectedCountry.name}`
    : "Countries";

  if (placesToShow.length === 0 && selectedCountry) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToCountries}
          >
            <Text style={styles.backButtonText}>← Back to Countries</Text>
          </TouchableOpacity>
          <Text style={styles.mapTitle}>{mapTitle}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No cities found in {selectedCountry.name}
          </Text>
        </View>
      </View>
    );
  }

  // Calculate map bounds to show all places
  const latitudes = placesToShow.map((p) => p.latitude);
  const longitudes = placesToShow.map((p) => p.longitude);
  const centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
  const centerLng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;

  return (
    <View style={styles.container}>
      {selectedCountry && (
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToCountries}
          >
            <Text style={styles.backButtonText}>← Back to Countries</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.mapTitle}>{mapTitle}</Text>

      <View style={styles.mapContainer}>
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
                    {place.photoCount} photo{place.photoCount !== 1 ? "s" : ""}
                  </Text>
                  {selectedCountry ? (
                    // For cities, show "View Photos" button
                    <TouchableOpacity
                      style={styles.popupButton}
                      onPress={() => navigateToPlacePhotos(place.id)}
                    >
                      <Text style={styles.popupButtonText}>View Photos</Text>
                    </TouchableOpacity>
                  ) : (
                    // For countries, show "View Cities" button
                    <TouchableOpacity
                      style={styles.popupButton}
                      onPress={() => handleCountryClick(place)}
                    >
                      <Text style={styles.popupButtonText}>View Cities</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </View>

      <ScrollView style={styles.placesListContainer}>
        <Text style={styles.placesListTitle}>{mapTitle}</Text>
        {placesToShow.map((place) => (
          <TouchableOpacity
            key={place.id}
            style={styles.placeItem}
            onPress={() =>
              selectedCountry
                ? navigateToPlacePhotos(place.id)
                : handleCountryClick(place)
            }
          >
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placePhotoCount}>
                {place.photoCount} photo{place.photoCount !== 1 ? "s" : ""}
              </Text>
              {selectedCountry && place.parentName && (
                <Text style={styles.placeParent}>in {place.parentName}</Text>
              )}
            </View>
            <View style={styles.placeCoordinates}>
              <Text style={styles.coordinateText}>
                {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
              </Text>
              <Text style={styles.actionHint}>
                {selectedCountry ? "View Photos →" : "View Cities →"}
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.border,
  },
  backButton: {
    backgroundColor: theme.palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    marginRight: 16,
  },
  backButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  mapTitle: {
    color: theme.palette.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    padding: 16,
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
    marginBottom: 2,
  },
  placeParent: {
    color: theme.palette.textSecondary,
    fontSize: 12,
    fontStyle: "italic",
  },
  placeCoordinates: {
    alignItems: "flex-end",
  },
  coordinateText: {
    color: theme.palette.textSecondary,
    fontSize: 12,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  actionHint: {
    color: theme.palette.primary,
    fontSize: 12,
    fontWeight: "500",
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
