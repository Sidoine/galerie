import React from "react";
import { DirectoryView } from "@/components/container-view/directory-view";
import { usePlaceStore } from "@/stores/place";

export default function PlaceScreen() {
  return <DirectoryView store={usePlaceStore()} />;
}
