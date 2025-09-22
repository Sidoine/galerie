import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { observer } from "mobx-react-lite";
import { StackNavigationProp, StackScreenProps } from "@react-navigation/stack";
import { GalleryStackParamList, MainStackParamList } from "../navigation-types";
import { useDirectoriesStore } from "../stores/directories";
import { DirectoryView } from "./directory-view";

export const RootDirectoryPage = observer(function RootDirectoryPage({
  route,
  navigation,
}: StackScreenProps<GalleryStackParamList, "RootDirectory">) {
  const directoriesStore = useDirectoriesStore();
  const root = directoriesStore.root;

  if (!root) {
    if (directoriesStore.isInError) {
      navigation.navigate("GallerySettings", {
        galleryId: route.params.galleryId,
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
