import React from "react";
import { useLocalSearchParams } from "expo-router";
import { PlacesMapView } from "@/components/places-map-view";

export default function PlacesMapScreen() {
  const { galleryId } = useLocalSearchParams<{ galleryId: string }>();
  
  if (!galleryId) {
    return null;
  }

  return <PlacesMapView galleryId={parseInt(galleryId, 10)} />;
}