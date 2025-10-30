import React, {
  useCallback,
  useMemo,
  useEffect,
  useState,
  useRef,
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
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ViewStyle,
} from "react-native";
import { FlashList, ListRenderItem, ViewToken } from "@shopify/flash-list";
import type { FlashListRef } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import { PhotoContainerStore } from "@/stores/photo-container";
import {
  determineGroupingStrategy,
  groupPhotosByDate,
  splitPhotosIntoRows,
} from "../photo-date-grouping";
import { MaterialIcons } from "@expo/vector-icons";
import { ActionMenu } from "../action-menu";
import { useIsFocused } from "@react-navigation/native";
import { DirectoryFlatListItem, gap } from "./item-types";
import DateHeader from "./date-header";
import { AlbumRow } from "./album-row";
import { AlbumCarousel } from "./album-carousel";
import { PhotoRow } from "./photo-row";
import { DateNavigationSidebar } from "./date-navigation-sidebar";
import { DateJump } from "@/services/views";

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

export const DirectoryView = observer(function DirectoryView({
  store,
}: DirectoryViewProps) {
  // Get directory info for admin menu
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
  const listRef = useRef<FlashListRef<DirectoryFlatListItem> | null>(null);
  const shouldRestoreScroll = useRef(false);

  // Date navigation sidebar state
  const [showDateNavigation, setShowDateNavigation] = useState(false);
  const [firstVisibleDate, setFirstVisibleDate] = useState<DateJump | null>(
    null
  );
  const hideTimerRef = useRef<number | null>(null);

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
      // Cleanup hide timer on unmount
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  // Autorisation de chargement et de rendu des photos uniquement quand l'écran est
  // effectivement focalisé ET que l'app est active. Cela évite que les images
  // continuent à se monter/consommer des ressources quand l'utilisateur est sur
  // un autre onglet / écran.
  const allowAutoLoad = isFocused && isAppActive;

  // Chargement initial si pagination
  useEffect(() => {
    // Empêche le premier chargement si l'écran n'est pas actif.
    if (!allowAutoLoad) return;
    paginatedStore.loadMore();
  }, [paginatedStore, allowAutoLoad]);

  // Construction de la liste plate
  const flatData: DirectoryFlatListItem[] = useMemo(() => {
    const items: DirectoryFlatListItem[] = [];

    // Determine if we should use carousel (when both containers and photos exist)
    const hasPhotos = paginatedPhotos.length > 0;
    const hasContainers = directories && directories.length > 0;
    const shouldUseCarousel = hasPhotos && hasContainers;

    if (paginatedStore.isLoadingBefore) {
      items.push({ id: "loading", type: "loading" });
    }

    if (hasContainers) {
      items.push({
        id: "albums-header",
        type: "albumsHeader",
        title: store.childContainersHeader,
      });

      if (shouldUseCarousel) {
        // Display all containers in a single carousel
        items.push({
          id: "album-carousel",
          type: "albumCarousel",
          items: directories,
        });
      } else {
        // Display containers in grid rows as before
        albumRows.forEach((row, idx) => {
          items.push({ id: `album-row-${idx}`, type: "albumRow", items: row });
        });
      }
    }

    if (paginatedPhotos.length > 0) {
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
        groups.forEach((group, groupIndex) => {
          const placeNames = Array.from(
            new Set(
              group.photos
                .map((photo) => photo.place?.name?.trim())
                .filter((name): name is string => !!name && name.length > 0)
            )
          );
          // Show date header if:
          // 1. This is not the first group (there are photos from a previous date), OR
          // 2. This is the first group AND we're at the beginning of the gallery (no more photos before)
          const isFirstGroup = groupIndex === 0;
          const isAtGalleryStart = !paginatedStore.hasMoreBefore;
          const shouldShowDateHeader =
            !isFirstGroup || isAtGalleryStart || !paginatedStore.hasScrolledUp;

          if (shouldShowDateHeader) {
            items.push({
              id: `date-header-${group.id}`,
              type: "dateHeader",
              title: group.displayTitle,
              placeNames,
              photoIds: group.photos.map((photo) => photo.id),
              date: group.date,
            });
          }
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
    if (paginatedStore.isLoading) {
      items.push({ id: "loading", type: "loading" });
    }

    return items;
  }, [
    paginatedPhotos,
    directories,
    paginatedStore.isLoadingBefore,
    paginatedStore.isLoading,
    paginatedStore.hasMoreBefore,
    paginatedStore.hasScrolledUp,
    store.childContainersHeader,
    albumRows,
    shouldGroupPhotos,
    cols,
    groupingStrategy,
    order,
  ]);

  const handleSortDateDesc = useCallback(
    () => store.sort("date-desc"),
    [store]
  );
  const handleSortDateAsc = useCallback(() => store.sort("date-asc"), [store]);

  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const openSortMenu = useCallback(() => setSortMenuVisible(true), []);
  const closeSortMenu = useCallback(() => setSortMenuVisible(false), []);

  const renderItem: ListRenderItem<DirectoryFlatListItem> = useCallback(
    ({ item }) => {
      switch (item.type) {
        case "albumsHeader":
          if (item.title == null) return null;
          if (
            typeof item.title === "string" ||
            typeof item.title === "number"
          ) {
            return (
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                </View>
              </View>
            );
          }
          return (
            <View style={[styles.sectionHeader, styles.sectionHeaderCustom]}>
              <View style={styles.sectionCustomContent}>{item.title}</View>
            </View>
          );
        case "albumRow":
          return (
            <AlbumRow
              items={item.items}
              store={store}
              columnWidth={columnWidth}
            />
          );
        case "albumCarousel":
          return (
            <AlbumCarousel
              items={item.items}
              store={store}
              columnWidth={columnWidth}
            />
          );
        case "dateHeader":
          return <DateHeader item={item} store={store} />;
        case "photoRow":
          return (
            <PhotoRow
              items={item.items}
              store={store}
              columnWidth={columnWidth}
            />
          );
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
    [columnWidth, store]
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
    if (paginatedStore.shouldLoadMore()) {
      paginatedStore.loadMore();
    }
  }, [allowAutoLoad, paginatedStore]);

  const handleStartReached = useCallback(() => {
    if (!allowAutoLoad) {
      return;
    }
    if (paginatedStore.shouldLoadMoreBefore()) {
      paginatedStore.loadMoreBefore();
    }
  }, [allowAutoLoad, paginatedStore]);

  const handleDateSelect = useCallback(
    async (date: string) => {
      // Hide the sidebar immediately
      setShowDateNavigation(false);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      // Jump to the selected date
      await paginatedStore.jumpToDate(date);

      // Scroll to top after jumping to date
      if (listRef.current) {
        listRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    },
    [paginatedStore]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      paginatedStore.lastScrollOffset = Math.max(
        0,
        event.nativeEvent.contentOffset.y
      );

      // Show date navigation sidebar on scroll if we have date jumps
      if (store.container?.dateJumps && store.container.dateJumps.length > 0) {
        setShowDateNavigation(true);

        // Reset hide timer
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }

        // Hide after 2 seconds of no scrolling
        hideTimerRef.current = setTimeout(() => {
          setShowDateNavigation(false);
        }, 2000);
      }
    },
    [paginatedStore, store.container]
  );

  const handleViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<DirectoryFlatListItem>[];
    }) => {
      if (
        !viewableItems ||
        viewableItems.length === 0 ||
        !store.container?.dateJumps
      ) {
        return;
      }

      // Find the first photo row that's visible
      const firstPhotoRow = viewableItems
        .filter((x) => x.isViewable && x.item)
        .map((x) => x.item)
        .find((item) => item.type === "photoRow");

      if (firstPhotoRow) {
        const photo = firstPhotoRow.items[0];
        const photoDate = photo.dateTime;
        let selectedJump: null | DateJump = null;
        if (order === "date-asc") {
          for (const jump of store.container.dateJumps) {
            selectedJump = jump;
            if (jump.date > photoDate) {
              break;
            }
          }
        } else {
          for (const jump of store.container.dateJumps.slice().reverse()) {
            selectedJump = jump;
            if (jump.date < photoDate) {
              break;
            }
          }
        }

        if (selectedJump) {
          setFirstVisibleDate(selectedJump);
        }
      }
    },
    [order, store.container?.dateJumps]
  );

  useEffect(() => {
    const needsRestore =
      shouldRestoreScroll.current || paginatedStore.pendingScrollRestoration;

    if (!isFocused) {
      if (paginatedStore.lastScrollOffset > 0) {
        shouldRestoreScroll.current = true;
      }
      return;
    }

    if (!needsRestore) {
      return;
    }

    if (!listRef.current) {
      return;
    }

    if (flatData.length === 0) {
      return;
    }

    const offset = paginatedStore.lastScrollOffset;
    if (offset <= 0) {
      shouldRestoreScroll.current = false;
      if (paginatedStore.pendingScrollRestoration) {
        paginatedStore.clearScrollRestoration();
      }
      return;
    }

    const raf = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset, animated: false });
      shouldRestoreScroll.current = false;
      if (paginatedStore.pendingScrollRestoration) {
        paginatedStore.clearScrollRestoration();
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [
    flatData,
    isFocused,
    paginatedStore,
    paginatedStore.pendingScrollRestoration,
  ]);

  return (
    <>
      <FlashList
        ref={listRef}
        data={flatData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        onStartReached={handleStartReached}
        onStartReachedThreshold={0.3}
        removeClippedSubviews
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 10,
        }}
      />
      {paginatedPhotos.length === 0 &&
        !paginatedStore.isLoading &&
        directories &&
        directories.length === 0 &&
        store.container !== null && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Aucune photo trouvée</Text>
          </View>
        )}
      <DateNavigationSidebar
        dateJumps={store.container?.dateJumps ?? []}
        visible={showDateNavigation}
        onDateSelect={handleDateSelect}
        sortOrder={order}
        firstVisibleDate={firstVisibleDate}
      />
      {paginatedPhotos.length > 0 && (
        <TouchableOpacity
          style={styles.sortFloatingButton}
          onPress={openSortMenu}
          accessibilityLabel="Ouvrir les options de tri"
          accessibilityRole="button"
        >
          <MaterialIcons name="sort" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      <ActionMenu
        visible={sortMenuVisible}
        onClose={closeSortMenu}
        items={[
          {
            label: "Plus récent en premier",
            onPress: handleSortDateDesc,
            icon: (
              <MaterialIcons name="expand-more" size={18} color="#1976d2" />
            ),
          },
          {
            label: "Plus ancien en premier",
            onPress: handleSortDateAsc,
            icon: (
              <MaterialIcons name="expand-less" size={18} color="#1976d2" />
            ),
          },
        ]}
      />
    </>
  );
});

type ShadowStyle = ViewStyle & { boxShadow?: string };

const floatingButtonShadowStyle = Platform.select<ShadowStyle>({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  android: {
    elevation: 5,
  },
  web: {
    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
  },
  default: {
    elevation: 5,
  },
});

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
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: "100%",
  },
  sectionHeaderCustom: {
    paddingHorizontal: 0,
    paddingVertical: 0,
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
  sectionCustomContent: {
    width: "100%",
  },
  photosSection: {
    flex: 1,
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
  emptyState: {
    position: "absolute",
    top: 54,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  emptyStateText: {
    fontSize: 18,
    color: "#666",
  },
  sortFloatingButton: {
    position: "absolute",
    right: -10,
    bottom: "25%",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1976d2",
    alignItems: "center",
    justifyContent: "center",
    ...floatingButtonShadowStyle,
  },
});
