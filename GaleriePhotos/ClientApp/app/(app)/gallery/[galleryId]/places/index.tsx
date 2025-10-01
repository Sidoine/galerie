import React from "react";
import { PlacesMapView } from "@/components/places-map-view";
import { useDirectoriesStore } from "@/stores/directories";

export default function PlacesMapScreen() {
  const { galleryId } = useDirectoriesStore();
  return <PlacesMapView galleryId={galleryId} />;
}
