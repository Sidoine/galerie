import React, { useCallback, useMemo, memo, ReactNode, useEffect } from "react";
import {
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import { Photo } from "@/services/views";
import ImageCard from "./image-card";
import SubdirectoryCard from "./subdirectory-card";
import { PhotoContainer, PhotoContainerStore } from "@/stores/photo-container";
import { DirectoryAdminMenu } from "./directory-admin-menu";
import {
  determineGroupingStrategy,
  groupPhotosByDate,
  splitPhotosIntoRows,
} from "./photo-date-grouping";
import { PaginatedPhotosStore } from "@/stores/paginated-photos";

export interface DirectoryViewProps {
  store: PhotoContainerStore;
}

function splitInRows<T>(data: T[], cols: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < data.length; i += cols) {
    rows.push(data.slice(i, i + cols));
  }
  return rows;
}

// -----------------------------
// Types d'items pour la FlashList plate
// -----------------------------
interface BaseItem {
  id: string;
  type: string;
}

interface AlbumsHeaderItem extends BaseItem {
  type: "albumsHeader";
  title: ReactNode;
}
interface AlbumRowItem extends BaseItem {
  type: "albumRow";
  items: PhotoContainer[];
}
interface PhotosHeaderItem extends BaseItem {
  type: "photosHeader";
}
interface DateHeaderItem extends BaseItem {
  type: "dateHeader";
  title: string;
}
interface PhotoRowItem extends BaseItem {
  type: "photoRow";
  items: Photo[];
  groupId: string;
}
interface LoadingItem extends BaseItem {
  type: "loading";
}

type DirectoryFlatListItem =
  | AlbumsHeaderItem
  | AlbumRowItem
  | PhotosHeaderItem
  | DateHeaderItem
  | PhotoRowItem
  | LoadingItem;

const gap = 4;

export const DirectoryView = observer(function DirectoryView({
  store,
}: DirectoryViewProps) {
  // Get directory info for admin menu
  const directoryId = store.container?.id;
  const directoryPath = store.breadCrumbs.map((crumb) => crumb.name).join("/");
  let { width } = useWindowDimensions();
  if (width > 768) {
    // The left drawer takes 279px
    width -= 279;
  }
  let columnWidth = 184; // approximate desired width
  let cols = Math.max(1, Math.floor((width - gap) / (columnWidth + gap)));
  if (cols < 2) {
    cols = 2;
  }
  columnWidth = (width - gap) / cols - gap;

  const directories = store.containersList;

  const directoryContent = store.photoList;
  const order = store.order;
  const values = directoryContent || [];
  const sortedValues =
    order === "date-desc" ? values.slice().reverse() : values;

  // Pré-calcule les lignes en fonction des colonnes pour limiter le travail en scroll
  const albumRows = useMemo(
    () =>
      directories && directories.length > 0
        ? splitInRows(directories, Math.max(1, Math.floor(cols / 2)))
        : [],
    [directories, cols]
  );

  const groupingStrategy = useMemo(
    () => determineGroupingStrategy(sortedValues),
    [sortedValues]
  );
  const shouldGroupPhotos = groupingStrategy !== "none";

  // Create paginated store for large photo collections
  const paginatedStore = useMemo(() => {
    if (directoryId && sortedValues.length > 500) {
      // Placeholder pagination logic; real impl devrait interroger API avec plages de dates
      const loadPhotosFunction = async () => sortedValues;
      return new PaginatedPhotosStore(loadPhotosFunction);
    }
    return undefined;
  }, [directoryId, sortedValues]);

  // Chargement initial si pagination
  useEffect(() => {
    if (paginatedStore && paginatedStore.getAllPhotos().length === 0) {
      paginatedStore.loadInitial();
    }
  }, [paginatedStore]);

  // Construction de la liste plate
  const flatData: DirectoryFlatListItem[] = useMemo(() => {
    const items: DirectoryFlatListItem[] = [];

    if (albumRows.length > 0) {
      items.push({
        id: "albums-header",
        type: "albumsHeader",
        title: store.childContainersHeader,
      });
      albumRows.forEach((row, idx) => {
        items.push({ id: `album-row-${idx}`, type: "albumRow", items: row });
      });
    }

    if (sortedValues.length > 0) {
      items.push({ id: "photos-header", type: "photosHeader" });

      if (!shouldGroupPhotos) {
        const rows = splitPhotosIntoRows(sortedValues, cols);
        rows.forEach((row, idx) =>
          items.push({
            id: `photo-row-${idx}`,
            type: "photoRow",
            items: row,
            groupId: "all",
          })
        );
      } else {
        const groups = groupPhotosByDate(
          sortedValues,
          groupingStrategy === "day"
        );
        groups.forEach((group) => {
          items.push({
            id: `date-header-${group.id}`,
            type: "dateHeader",
            title: group.displayTitle,
          });
          const rows = splitPhotosIntoRows(group.photos, cols);
          rows.forEach((row, idx) =>
            items.push({
              id: `${group.id}-row-${idx}`,
              type: "photoRow",
              items: row,
              groupId: group.id,
            })
          );
        });
      }
    }

    if ((!directories || !directoryContent) && items.length === 0) {
      items.push({ id: "loading", type: "loading" });
    }

    return items;
  }, [
    albumRows,
    sortedValues,
    shouldGroupPhotos,
    groupingStrategy,
    cols,
    store.childContainersHeader,
    directories,
    directoryContent,
  ]);

  // Composant de ligne optimisé (évite de recréer des closures pour chaque item)
  // Rendu d'une ligne d'albums
  const AlbumRow = useMemo(
    () =>
      memo(function AlbumRow({ items }: { items: PhotoContainer[] }) {
        return (
          <View style={styles.rowContainer}>
            {items.map((subDir, i) => (
              <View
                key={subDir.id}
                style={[
                  styles.itemWrapper,
                  i === items.length - 1 && styles.itemWrapperLast,
                ]}
              >
                <SubdirectoryCard
                  directory={subDir}
                  size={columnWidth * 2 + gap}
                  store={store}
                />
              </View>
            ))}
          </View>
        );
      }),
    [columnWidth, store]
  );

  // Rendu d'une ligne de photos
  const PhotoRow = useMemo(
    () =>
      memo(function PhotoRow({ items }: { items: Photo[] }) {
        return (
          <View style={styles.rowContainer}>
            {items.map((photo, i) => (
              <View
                key={photo.id}
                style={[
                  styles.itemWrapper,
                  i === items.length - 1 && styles.itemWrapperLast,
                ]}
              >
                <ImageCard photo={photo} size={columnWidth} store={store} />
              </View>
            ))}
          </View>
        );
      }),
    [columnWidth, store]
  );

  const handleSortDateDesc = useCallback(
    () => store.sort("date-desc"),
    [store]
  );
  const handleSortDateAsc = useCallback(() => store.sort("date-asc"), [store]);

  const renderItem: ListRenderItem<DirectoryFlatListItem> = useCallback(
    ({ item }) => {
      switch (item.type) {
        case "albumsHeader":
          return (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>{item.title}</View>
            </View>
          );
        case "albumRow":
          return <AlbumRow items={item.items} />;
        case "photosHeader":
          return (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Photos</Text>
                {directoryId && (
                  <DirectoryAdminMenu
                    directoryId={directoryId}
                    directoryPath={directoryPath}
                  />
                )}
              </View>
              <View style={styles.buttonRow}>
                <SortButton
                  selected={order === "date-desc"}
                  label="Plus récent en premier"
                  onPress={handleSortDateDesc}
                />
                <SortButton
                  selected={order !== "date-desc"}
                  label="Plus ancien en premier"
                  onPress={handleSortDateAsc}
                />
              </View>
            </View>
          );
        case "dateHeader":
          return (
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>{item.title}</Text>
            </View>
          );
        case "photoRow":
          return <PhotoRow items={item.items} />;
        case "loading":
          return (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="large" />
            </View>
          );
        default:
          return null;
      }
      // handlers declared later are stable (useCallback), but to avoid linter 'used before defined', list primitive deps only
    },
    [
      AlbumRow,
      PhotoRow,
      directoryId,
      directoryPath,
      order,
      handleSortDateDesc,
      handleSortDateAsc,
    ]
  );

  const keyExtractor = useCallback(
    (item: DirectoryFlatListItem) => item.id,
    []
  );
  const getItemType = useCallback(
    (item: DirectoryFlatListItem) => item.type,
    []
  );

  const handleEndReached = useCallback(() => {
    if (paginatedStore) {
      paginatedStore.loadMore();
    }
  }, [paginatedStore]);

  // handlers déjà déclarés plus haut

  return (
    <FlashList
      data={flatData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      estimatedItemSize={120}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      removeClippedSubviews
      ListFooterComponent={
        paginatedStore?.isLoading ? (
          <View style={styles.loadingFooter}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Chargement des photos...</Text>
          </View>
        ) : null
      }
    />
  );
});

const SortButton = ({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.sortButton, selected && styles.sortButtonSelected]}
  >
    <Text
      style={[styles.sortButtonText, selected && styles.sortButtonTextSelected]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  rowContainer: {
    flex: 1,
    padding: 4,
    flexDirection: "row",
    // Remplace gap (coût potentiel layout) par marges sur enfants
  },
  itemWrapper: {
    marginRight: 4,
    marginBottom: 0,
  },
  itemWrapperLast: {
    marginRight: 0,
  },
  buttonRow: {
    flexDirection: "row",
    flexGrow: 0,
    flexShrink: 0,
    gap: 4,
    flexWrap: "wrap",
  },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 6,
    color: "#222",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  sortButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  sortButtonSelected: {
    backgroundColor: "#1976d2",
  },
  sortButtonText: {
    color: "#333",
  },
  sortButtonTextSelected: {
    color: "white",
  },
  photosSection: {
    flex: 1,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
  },
  dateHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
});
