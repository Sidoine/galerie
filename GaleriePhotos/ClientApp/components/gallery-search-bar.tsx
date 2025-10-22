import { SearchController } from "@/services/search";
import { RecentSearch } from "@/services/views";
import { useDirectoriesStore } from "@/stores/directories";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useApiClient } from "folke-service-helpers";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import Icon from "./Icon";

export function GallerySearchBar() {
  const galleryId = useDirectoriesStore().galleryId;
  const apiClient = useApiClient();
  const searchService = useMemo(
    () => new SearchController(apiClient),
    [apiClient]
  );
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearBlurTimeout = useCallback(() => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
  }, []);

  const handleSearch = useCallback(
    (nextQuery: string) => {
      if (!galleryId) return;
      router.push({
        pathname: "/(app)/gallery/[galleryId]/search",
        params: { galleryId, query: nextQuery },
      });
    },
    [galleryId, router]
  );

  const loadRecentSearches = useCallback(async () => {
    if (!galleryId) {
      setRecentSearches([]);
      return;
    }

    const result = await searchService.getRecentSearches(galleryId);
    if (result?.ok && result.value) {
      setRecentSearches(result.value);
    } else {
      setRecentSearches([]);
    }
  }, [galleryId, searchService]);

  const handleFocus = useCallback(() => {
    clearBlurTimeout();
    setIsFocused(true);
    void loadRecentSearches();
  }, [clearBlurTimeout, loadRecentSearches]);

  const handleBlur = useCallback(() => {
    clearBlurTimeout();
    blurTimeout.current = setTimeout(() => {
      setIsFocused(false);
    }, 150);
  }, [clearBlurTimeout]);

  const performSearch = useCallback(
    async (rawQuery: string) => {
      if (!galleryId) return;
      const trimmed = rawQuery.trim();
      if (!trimmed) {
        return;
      }

      clearBlurTimeout();
      setIsFocused(false);
      setQuery(trimmed);
      handleSearch(trimmed);

      const response = await searchService.addRecentSearch(galleryId, {
        query: trimmed,
      });

      if (response?.ok && response.value) {
        setRecentSearches(response.value);
      }
    },
    [clearBlurTimeout, galleryId, handleSearch, searchService]
  );

  const submit = useCallback(() => {
    void performSearch(query);
  }, [performSearch, query]);

  const handleSelectRecent = useCallback(
    (selectedQuery: string) => {
      void performSearch(selectedQuery);
    },
    [performSearch]
  );

  useEffect(() => {
    setQuery("");
    setRecentSearches([]);
  }, [galleryId]);

  useEffect(() => {
    return () => {
      clearBlurTimeout();
    };
  }, [clearBlurTimeout]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
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
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </View>
        {isFocused && recentSearches.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {recentSearches.map((item, index) => (
              <TouchableOpacity
                key={`${item.query}-${item.createdAtUtc}`}
                style={[
                  styles.suggestionItem,
                  index === recentSearches.length - 1 &&
                    styles.suggestionItemLast,
                ]}
                onPress={() => handleSelectRecent(item.query)}
              >
                <Icon
                  name="time-outline"
                  set="ion"
                  size={16}
                  color="#6b7280"
                  style={styles.suggestionIcon}
                />
                <Text style={styles.suggestionText}>{item.query}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  content: {
    flex: 1,
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
  suggestionsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    marginRight: 8,
  },
  suggestionText: {
    flex: 1,
    color: "#374151",
  },
});
