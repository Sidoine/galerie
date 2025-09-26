import React from "react";
import { StyleSheet } from "react-native";
import { observer } from "mobx-react-lite";
import SubdirectoriesView from "./subdirectories-view";
import { DirectoryImagesView } from "./directory-images-view";
import { ScrollView } from "react-native-gesture-handler";

export interface DirectoryViewProps {
  id: number;
}

export const DirectoryView = observer(({ id }: { id: number }) => {
  return (
    <ScrollView style={styles.container}>
      <SubdirectoriesView id={Number(id)} />
      <DirectoryImagesView directoryId={Number(id)} />
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
