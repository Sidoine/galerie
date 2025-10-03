import { usePhotoContainer } from "@/stores/photo-container";
import { Link } from "expo-router";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

function BreadCrumbs() {
  const containerStore = usePhotoContainer();
  if (!containerStore.breadCrumbs) return <Text>Galerie photo</Text>;
  const currentDirectory = containerStore.container;
  if (!currentDirectory) return <></>;
  return (
    <View style={styles.container}>
      {containerStore.breadCrumbs.map((crumb, index) => (
        <Link key={index} href={crumb.url} style={[styles.text]}>
          <Text style={{ color: "#007aff" }}>{crumb.name}</Text>
          {index < containerStore.breadCrumbs.length - 1 && <Text> &gt;</Text>}
        </Link>
      ))}
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
