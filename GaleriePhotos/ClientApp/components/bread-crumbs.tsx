import { useDirectoriesStore } from "@/stores/directories";
import { useGalleriesStore } from "@/stores/galleries";
import { Link } from "expo-router";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

function BreadCrumbs({ directoryId }: { directoryId?: number }) {
  if (!directoryId) return <Text>Galerie photo</Text>;
  const directory = useDirectoriesStore();
  const currentDirectory = directory.infoLoader.getValue(Number(directoryId));
  if (!currentDirectory) return <></>;
  const parent = currentDirectory.parent;
  const gallery = useGalleriesStore().get(directory.galleryId);
  return (
    <View style={styles.container}>
      {parent && (
        <Link
          href={`/gallery/${directory.galleryId}/directory/${parent.id}`}
          style={[styles.text]}
        >
          <Text style={{ color: "#007aff" }}>
            {parent.name || gallery?.galleryName}
          </Text>
          <Text> &gt;</Text>
        </Link>
      )}
      <Text style={styles.text}>
        {currentDirectory.name || gallery?.galleryName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    flexDirection: "row",
    flex: 1,
    gap: 8,
    alignItems: "center",
    height: "100%",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
});

export default observer(BreadCrumbs);
