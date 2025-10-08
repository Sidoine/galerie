import React from "react";
import { useDirectoriesStore } from "@/stores/directories";
import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";

function DirectoriesScreen() {
  const directoriesStore = useDirectoriesStore();
  const root = directoriesStore.root;
  if (!root) {
    return <ActivityIndicator size="large" />;
  }
  return (
    <Redirect
      href={{
        pathname: `/(app)/gallery/[galleryId]/directory/[directoryId]`,
        params: {
          galleryId: directoriesStore.galleryId,
          directoryId: root.id,
        },
      }}
    />
  );
}

export default DirectoriesScreen;
