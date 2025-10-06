import React, { useCallback, useMemo, memo } from "react";
import {
  SectionList,
  SectionListData,
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { observer } from "mobx-react-lite";
import { Photo } from "@/services/views";
import ImageCard from "./image-card";
import SubdirectoryCard from "./subdirectory-card";
import { PhotoContainer, usePhotoContainer } from "@/stores/photo-container";

export interface DirectoryViewProps {
  id: number;
}

function splitInRows<T>(data: T[], cols: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < data.length; i += cols) {
    rows.push(data.slice(i, i + cols));
  }
  return rows;
}

interface Section {
  title: string;
  type: "Albums" | "Photos";
}

const columnWidth = 184; // approximate desired width
const gap = 4;

export const DirectoryView = observer(() => {
  const containerStore = usePhotoContainer();
  let { width } = useWindowDimensions();
  if (width > 768) {
    // The left drawer takes 279px
    width -= 279;
  }
  const cols = Math.max(1, Math.floor((width - gap) / (columnWidth + gap)));

  const directories = containerStore.containersList;

  const directoryContent = containerStore.photoList;
  const order = containerStore.order;
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
  const photoRows = useMemo(
    () =>
      sortedValues && sortedValues.length > 0
        ? splitInRows(sortedValues, cols)
        : [],
    [sortedValues, cols]
  );

  const data = useMemo(() => {
    const result: SectionListData<(PhotoContainer | Photo)[], Section>[] = [];
    if (albumRows.length > 0) {
      result.push({ title: "Albums", data: albumRows, type: "Albums" });
    }
    if (photoRows.length > 0) {
      result.push({ title: "Photos", data: photoRows, type: "Photos" });
    }
    return result;
  }, [albumRows, photoRows]);

  // Composant de ligne optimisé (évite de recréer des closures pour chaque item)
  const Row = useMemo(
    () =>
      memo(function Row({
        items,
        type,
      }: {
        items: (PhotoContainer | Photo)[];
        type: "Albums" | "Photos";
      }) {
        if (type === "Albums") {
          return (
            <View style={styles.rowContainer}>
              {items.map((subDir, i) => (
                <View
                  key={(subDir as PhotoContainer).id}
                  style={[
                    styles.itemWrapper,
                    i === items.length - 1 && styles.itemWrapperLast,
                  ]}
                >
                  <SubdirectoryCard
                    directory={subDir as PhotoContainer}
                    size={columnWidth * 2 + gap}
                  />
                </View>
              ))}
            </View>
          );
        }
        return (
          <View style={styles.rowContainer}>
            {items.map((photo, i) => (
              <View
                key={(photo as Photo).id}
                style={[
                  styles.itemWrapper,
                  i === items.length - 1 && styles.itemWrapperLast,
                ]}
              >
                <ImageCard photo={photo as Photo} size={columnWidth} />
              </View>
            ))}
          </View>
        );
      }),
    []
  );

  const renderItem = useCallback(
    ({
      item,
      section,
    }: {
      item: (PhotoContainer | Photo)[];
      section: Section;
    }) => <Row items={item} type={section.type} />,
    [Row]
  );

  const keyExtractor = useCallback(
    (row: (PhotoContainer | Photo)[], index: number) => {
      const firstId = row[0]?.id ?? index;
      // Ajoute longueur et index pour limiter collisions; section sera préfixée dans renderItem key interne
      return `${firstId}-${row.length}-${index}`;
    },
    []
  );

  const handleSortDateDesc = useCallback(
    () => containerStore.sort("date-desc"),
    [containerStore]
  );
  const handleSortDateAsc = useCallback(
    () => containerStore.sort("date-asc"),
    [containerStore]
  );

  return (
    <>
      <SectionList
        sections={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        removeClippedSubviews
        windowSize={7}
        maxToRenderPerBatch={8}
        initialNumToRender={4}
        updateCellsBatchingPeriod={50}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.title === "Photos" && (
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
            )}
          </View>
        )}
      />
      {(!directories || !directoryContent) && (
        <ActivityIndicator size="large" />
      )}
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
    // gap n'est pas supporté partout en natif -> utiliser marges
    flexWrap: "wrap",
  },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
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
});
