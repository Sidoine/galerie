import React from "react";
import { observer } from "mobx-react-lite";
import { View, StyleSheet } from "react-native";
import { DirectoryView } from "@/components/directory-view";
import { GallerySearchBar } from "@/components/gallery-search-bar";
import { useGalleryStore } from "@/stores/gallery";

const GalleryPage = observer(function GalleryPage() {
  const galleryStore = useGalleryStore();

  return (
    <View style={styles.container}>
      <GallerySearchBar />
      <View style={styles.directoryWrapper}>
        <DirectoryView store={galleryStore} />
      </View>
    </View>
  );
});

export default GalleryPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  directoryWrapper: {
    flex: 1,
  },
});
