import React, {
  useCallback,
  useMemo,
  memo,
  ReactNode,
  useEffect,
  useState,
} from "react";
import {
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
  AppStateStatus,
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
import { DirectoryBulkLocationModal } from "./modals/directory-bulk-location-modal";
import { MaterialIcons } from "@expo/vector-icons";
import { ActionMenu, ActionMenuItem } from "./action-menu";
import { useMembersStore } from "@/stores/members";
import { useIsFocused } from "@react-navigation/native";

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
  const membersStore = useMembersStore();
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
  const order = store.order;

  // Pré-calcule les lignes en fonction des colonnes pour limiter le travail en scroll
  const albumRows = useMemo(
    () =>
      directories && directories.length > 0
        ? splitInRows(directories, Math.max(1, Math.floor(cols / 2)))
        : [],
    [directories, cols]
  );

  const groupingStrategy = useMemo(
    () => determineGroupingStrategy(store.container),
    [store.container]
  );
  const shouldGroupPhotos = groupingStrategy !== "none";

  // Utilise le store paginé fourni par le store parent
  const paginatedStore = store.paginatedPhotosStore;

  // Photos: utilisation exclusive du paginatedStore (pagination par plage de dates)
  const paginatedPhotos = paginatedStore.photos;

  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState === "active"
  );

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      setIsAppActive(nextState === "active");
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const allowAutoLoad = isFocused && isAppActive;

  // Chargement initial si pagination
  useEffect(() => {
    if (paginatedPhotos.length === 0) {
      paginatedStore.loadInitial();
    }
  }, [paginatedStore, paginatedPhotos.length]);

  // Construction de la liste plate
  const flatData: DirectoryFlatListItem[] = useMemo(() => {
    console.log("Rebuild flatData", albumRows.length, paginatedPhotos.length);
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

    if (paginatedPhotos.length > 0) {
      items.push({ id: "photos-header", type: "photosHeader" });

      if (!shouldGroupPhotos) {
        const rows = splitPhotosIntoRows(paginatedPhotos, cols);
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
          paginatedPhotos,
          groupingStrategy === "day",
          order === "date-desc" ? "date-desc" : "date-asc"
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

    // État de chargement initial (aucune photo encore disponible)
    if (paginatedStore.isLoading && paginatedPhotos.length === 0) {
      items.push({ id: "loading", type: "loading" });
    }

    return items;
  }, [
    albumRows,
    paginatedPhotos,
    paginatedStore.isLoading,
    store.childContainersHeader,
    shouldGroupPhotos,
    cols,
    groupingStrategy,
    order,
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

  // -----------------------------
  // Gestion des actions de groupe par date (bulk GPS)
  // (déclaré avant renderItem pour éviter use-before-definition)
  // -----------------------------
  const [bulkLocationVisible, setBulkLocationVisible] = useState(false);
  const [bulkLocationPhotos, setBulkLocationPhotos] = useState<Photo[] | null>(
    null
  );
  const [groupActionsVisible, setGroupActionsVisible] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  const openGroupMenu = useCallback((groupId: string) => {
    setCurrentGroupId(groupId);
    setGroupActionsVisible(true);
  }, []);
  const closeGroupMenu = useCallback(() => {
    setGroupActionsVisible(false);
    setCurrentGroupId(null);
  }, []);

  const openBulkLocationForGroup = useCallback(
    (groupId: string) => {
      // Récupérer toutes les photos dont la groupId correspond
      // On reconstruit les groupes de la même manière que lors de la création de flatData
      let photosInGroup: Photo[] = [];
      if (!shouldGroupPhotos) {
        if (groupId === "all") {
          photosInGroup = paginatedPhotos;
        }
      } else {
        const groups = groupPhotosByDate(
          paginatedPhotos,
          groupingStrategy === "day",
          order === "date-desc" ? "date-desc" : "date-asc"
        );
        const group = groups.find((g) => g.id === groupId);
        if (group) {
          photosInGroup = group.photos;
        }
      }
      if (photosInGroup.length > 0) {
        setBulkLocationPhotos(photosInGroup);
        setBulkLocationVisible(true);
      }
    },
    [shouldGroupPhotos, paginatedPhotos, groupingStrategy, order]
  );

  const closeBulkLocation = useCallback(() => {
    setBulkLocationVisible(false);
    setBulkLocationPhotos(null);
  }, []);

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
              {membersStore.administrator && (
                <TouchableOpacity
                  accessibilityLabel="Actions sur cette date"
                  style={styles.dateHeaderActionBtn}
                  onPress={() =>
                    openGroupMenu(item.id.replace("date-header-", ""))
                  }
                >
                  <MaterialIcons name="more-vert" size={20} color="#1976d2" />
                </TouchableOpacity>
              )}
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
    },
    [
      AlbumRow,
      PhotoRow,
      directoryId,
      directoryPath,
      order,
      handleSortDateDesc,
      handleSortDateAsc,
      openGroupMenu,
      membersStore.administrator,
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
    if (!allowAutoLoad) {
      return;
    }
    if (paginatedStore && paginatedStore.shouldLoadMore()) {
      paginatedStore.loadMore();
    }
  }, [allowAutoLoad, paginatedStore]);

  // handlers déjà déclarés plus haut

  return (
    <>
      <FlashList
        data={flatData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
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
      <DirectoryBulkLocationModal
        visible={bulkLocationVisible}
        photos={bulkLocationPhotos || []}
        onClose={closeBulkLocation}
      />
      <ActionMenu
        visible={groupActionsVisible}
        onClose={closeGroupMenu}
        items={((): ActionMenuItem[] =>
          currentGroupId
            ? [
                {
                  label: "Changer la localisation (GPS)",
                  onPress: () => openBulkLocationForGroup(currentGroupId),
                  icon: (
                    <MaterialIcons
                      name="my-location"
                      size={18}
                      color="#1976d2"
                    />
                  ),
                },
              ]
            : [])()}
      />
    </>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  dateHeaderActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#e3f2fd",
    borderRadius: 16,
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
