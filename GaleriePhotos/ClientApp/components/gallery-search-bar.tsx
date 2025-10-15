import { useDirectoriesStore } from "@/stores/directories";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import Icon from "./Icon";

export function GallerySearchBar() {
  const galleryId = useDirectoriesStore().galleryId;
  const router = useRouter();

  const handleSearch = useCallback(
    (query: string) => {
      if (!galleryId) return;
      router.push({
        pathname: "/(app)/gallery/[galleryId]/search",
        params: { galleryId, query },
      });
    },
    [galleryId, router]
  );

  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery("");
  }, []);

  const submit = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed || !galleryId) {
      return;
    }

    handleSearch(trimmed);
  }, [galleryId, handleSearch, query]);

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Icon
          name="search"
          set="ion"
          size={18}
          color="#6b7280"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Rechercher dans vos photos"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={submit}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    color: "#111827",
  },
  buttonWrapper: {
    marginLeft: 12,
  },
});
