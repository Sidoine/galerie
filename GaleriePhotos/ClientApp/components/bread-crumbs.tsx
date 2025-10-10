import { PhotoContainerStore } from "@/stores/photo-container";
import { Link } from "expo-router";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

function BreadCrumbs({ store }: { store: PhotoContainerStore }) {
  if (!store.breadCrumbs) return <Text>Galerie photo</Text>;
  return (
    <View style={styles.container}>
      {store.breadCrumbs.map((crumb, index) => (
        <Link key={index} href={crumb.url} style={[styles.text]}>
          <Text style={{ color: "#007aff" }}>{crumb.name}</Text>
          {index < store.breadCrumbs.length - 1 && <Text> &gt;</Text>}
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
