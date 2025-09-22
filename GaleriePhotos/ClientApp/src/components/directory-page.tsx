import React from "react";
import { useRoute } from "@react-navigation/native";
import { DirectoryView } from "./directory-view";

interface DirectoryRouteParams {
  galleryId: number;
  directoryId: number;
  order: "date-desc" | "date-asc";
}

export function DirectoryPage() {
  const route = useRoute();
  const { directoryId } = route.params as DirectoryRouteParams;
  return <DirectoryView id={Number(directoryId)} />;
}
