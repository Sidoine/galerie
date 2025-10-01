import React from "react";
import { useLocalSearchParams } from "expo-router";
import { PlacePhotosView } from "@/components/place-photos-view";

export default function PlacePhotosScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  
  if (!placeId) {
    return null;
  }

  return <PlacePhotosView placeId={parseInt(placeId, 10)} />;
}