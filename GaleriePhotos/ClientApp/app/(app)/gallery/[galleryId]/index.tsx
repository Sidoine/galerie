import React from "react";
import { ActivityIndicator, View, StyleSheet, Text } from "react-native";
import { observer } from "mobx-react-lite";
import { useDirectoriesStore } from "@/stores/directories";
import { DirectoryView } from "@/components/directory-view";
import { useRouter } from "expo-router";

const RootDirectoryPage = observer(function RootDirectoryPage() {
  const directoriesStore = useDirectoriesStore();
  const root = directoriesStore.root;
  const router = useRouter();

  if (!root) {
    if (directoriesStore.isInError) {
      router.push({
        pathname: `/(app)/gallery/[galleryId]/(settings)`,
        params: { galleryId: directoriesStore.galleryId },
      });
    }
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <DirectoryView id={root.id} />;
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default RootDirectoryPage;
