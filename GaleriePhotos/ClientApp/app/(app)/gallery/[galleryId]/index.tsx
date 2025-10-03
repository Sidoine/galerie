import React, { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { observer } from "mobx-react-lite";
import { useDirectoriesStore } from "@/stores/directories";
import { DirectoryView } from "@/components/directory-view";
import { useRouter } from "expo-router";

const RootDirectoryPage = observer(function RootDirectoryPage() {
  const directoriesStore = useDirectoriesStore();
  const root = directoriesStore.root;
  const router = useRouter();

  useEffect(() => {
    if (directoriesStore.isInError) {
      router.replace({
        pathname: `/(app)/gallery/[galleryId]/settings`,
        params: { galleryId: directoriesStore.galleryId },
      });
    }
  }, [directoriesStore.isInError, directoriesStore.galleryId, router]);

  if (!root) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <DirectoryView />;
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default RootDirectoryPage;
