import React from "react";
import { useDirectoriesStore } from "@/stores/directories";
import { ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";

function DirectoriesScreen() {
  const directoriesStore = useDirectoriesStore();
  const root = directoriesStore.root;
  const router = useRouter();
  useFocusEffect(() => {
    if (root) {
      router.replace({
        pathname: `/(app)/gallery/[galleryId]/directory/[directoryId]`,
        params: {
          galleryId: directoriesStore.galleryId,
          directoryId: root.id,
        },
      });
    }
  });
  return <ActivityIndicator size="large" />;
}

export default observer(DirectoriesScreen);
