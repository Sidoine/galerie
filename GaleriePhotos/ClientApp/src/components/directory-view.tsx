import React from "react";
import { View, StyleSheet } from "react-native";
import { observer } from "mobx-react-lite";
import { DirectoryImagesView, SubdirectoriesView } from "./";

export interface DirectoryViewProps {
  id: number;
}

export const DirectoryView = observer(({ id }: { id: number }) => {
  return (
    <View style={styles.container}>
      <SubdirectoriesView id={Number(id)} />
      <DirectoryImagesView directoryId={Number(id)} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
