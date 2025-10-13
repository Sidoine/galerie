import React, { useCallback, useMemo, memo, useEffect } from "react";
import {
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { observer } from "mobx-react-lite";
import { Photo } from "@/services/views";
import ImageCard from "./image-card";
import { PhotoContainerStore } from "@/stores/photo-container";
import { 
  groupPhotosByDate, 
  determineGroupingStrategy, 
  splitPhotosIntoRows
} from "./photo-date-grouping";
import { PaginatedPhotosStore } from "@/stores/paginated-photos";

export interface PhotosFlashListProps {
  store: PhotoContainerStore;
  paginatedStore?: PaginatedPhotosStore;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

interface ListItem {
  type: 'dateHeader' | 'photoRow';
  id: string;
  data?: unknown;
}

interface DateHeaderItem extends ListItem {
  type: 'dateHeader';
  data: { title: string };
}

interface PhotoRowItem extends ListItem {
  type: 'photoRow';
  data: { photos: Photo[]; groupId: string };
}

const gap = 4;

export const PhotosFlashList = observer(function PhotosFlashList({
  store,
  paginatedStore,
  onEndReached,
  onEndReachedThreshold = 0.3,
}: PhotosFlashListProps) {
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

  // Use paginated store if available, otherwise fall back to regular store
  const directoryContent = paginatedStore ? paginatedStore.getAllPhotos() : store.photoList;
  const order = store.order;
  const values = directoryContent || [];
  const sortedValues =
    order === "date-desc" ? values.slice().reverse() : values;

  // Load initial photos if using paginated store
  useEffect(() => {
    if (paginatedStore && paginatedStore.getAllPhotos().length === 0) {
      paginatedStore.loadInitial();
    }
  }, [paginatedStore]);

  // Determine grouping strategy and create list data
  const listData = useMemo(() => {
    const strategy = determineGroupingStrategy(sortedValues);
    
    if (strategy === 'none') {
      // No grouping - create photo rows directly
      const photoRows = splitPhotosIntoRows(sortedValues, cols);
      return photoRows.map((row, index): PhotoRowItem => ({
        type: 'photoRow',
        id: `row-${index}`,
        data: { photos: row, groupId: 'all' },
      }));
    }

    // Group photos by date
    const groups = groupPhotosByDate(sortedValues, strategy === 'day');
    const items: ListItem[] = [];
    
    groups.forEach((group) => {
      // Add date header
      items.push({
        type: 'dateHeader',
        id: `header-${group.id}`,
        data: { title: group.displayTitle },
      });
      
      // Add photo rows for this group
      const photoRows = splitPhotosIntoRows(group.photos, cols);
      photoRows.forEach((row, rowIndex) => {
        items.push({
          type: 'photoRow',
          id: `${group.id}-row-${rowIndex}`,
          data: { photos: row, groupId: group.id },
        });
      });
    });
    
    return items;
  }, [sortedValues, cols]);

  const renderItem: ListRenderItem<ListItem> = useCallback(({ item }) => {
    if (item.type === 'dateHeader') {
      const headerItem = item as DateHeaderItem;
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>{headerItem.data.title}</Text>
        </View>
      );
    }

    if (item.type === 'photoRow') {
      const rowItem = item as PhotoRowItem;
      return (
        <PhotoRow
          photos={rowItem.data.photos}
          columnWidth={columnWidth}
          store={store}
        />
      );
    }

    return null;
  }, [columnWidth, store]);

  const keyExtractor = useCallback((item: ListItem) => item.id, []);

  const getItemType = useCallback((item: ListItem) => item.type, []);

  // Handle end reached for paginated loading
  const handleEndReached = useCallback(() => {
    if (paginatedStore) {
      paginatedStore.loadMore();
    } else if (onEndReached) {
      onEndReached();
    }
  }, [paginatedStore, onEndReached]);

  // Create footer component for loading indicator
  const renderFooter = useCallback(() => {
    if (paginatedStore?.isLoading) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Chargement des photos...</Text>
        </View>
      );
    }
    return null;
  }, [paginatedStore?.isLoading]);

  return (
    <FlashList
      data={listData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      estimatedItemSize={120}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      removeClippedSubviews
      ListFooterComponent={renderFooter}
    />
  );
});

const PhotoRow = memo(function PhotoRow({
  photos,
  columnWidth,
  store,
}: {
  photos: Photo[];
  columnWidth: number;
  store: PhotoContainerStore;
}) {
  return (
    <View style={styles.rowContainer}>
      {photos.map((photo, i) => (
        <View
          key={photo.id}
          style={[
            styles.itemWrapper,
            i === photos.length - 1 && styles.itemWrapperLast,
          ]}
        >
          <ImageCard
            photo={photo}
            size={columnWidth}
            store={store}
          />
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  rowContainer: {
    flex: 1,
    padding: 4,
    flexDirection: "row",
  },
  itemWrapper: {
    marginRight: 4,
    marginBottom: 0,
  },
  itemWrapperLast: {
    marginRight: 0,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  dateHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});