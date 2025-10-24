import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { observer } from "mobx-react-lite";
import { Href, useRouter } from "expo-router";
import { useApiClient } from "folke-service-helpers";
import {
  PhotoContainerStore,
  BreadCrumb,
  SearchContainerFull,
} from "./photo-container";
import { useGalleriesStore } from "./galleries";
import { PaginatedPhotosStore } from "./paginated-photos";
import { SearchController } from "@/services/search";

const SearchStoreContext = createContext<PhotoContainerStore | null>(null);

export const SearchStoreProvider = observer(function SearchStoreProvider({
  children,
  galleryId,
  query,
  order = "date-desc",
}: {
  children: React.ReactNode;
  galleryId: number | undefined;
  query: string | undefined;
  order?: "date-asc" | "date-desc";
}) {
  const router = useRouter();
  const apiClient = useApiClient();
  const galleriesStore = useGalleriesStore();
  const searchService = useMemo(
    () => new SearchController(apiClient),
    [apiClient]
  );

  const gallery = galleryId ? galleriesStore.get(galleryId) : null;
  const [summary, setSummary] = useState<SearchContainerFull | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!galleryId || !query || query.trim() === "") {
      setSummary(null);
      return () => {
        cancelled = true;
      };
    }

    setSummary(null);

    const loadSummary = async () => {
      const result = await searchService.getSummary(galleryId, query);
      if (cancelled) return;
      if (result?.ok) {
        setSummary({ id: -Math.abs(galleryId) - 1, ...result.value });
      } else {
        setSummary(null);
      }
    };

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [galleryId, query, searchService]);

  const navigateToPhoto = useCallback(
    (photoId: number) => {
      if (!galleryId) return;
      router.push({
        pathname: "/(app)/gallery/[galleryId]/photos/[photoId]",
        params: { galleryId, photoId, query },
      });
    },
    [galleryId, query, router]
  );

  const navigateToContainer = useCallback(() => {
    if (!galleryId) return;

    router.replace({
      pathname: "/(app)/gallery/[galleryId]/search",
      params: { galleryId, query, order },
    });
  }, [galleryId, order, query, router]);

  const navigateToParentContainer = useCallback(() => {
    if (!galleryId) return;
    router.push({
      pathname: "/(app)/gallery/[galleryId]",
      params: { galleryId },
    });
  }, [galleryId, router]);

  const getPhotoLink = useCallback(
    (photoId: number): Href => ({
      pathname: "/(app)/gallery/[galleryId]/photos/[photoId]",
      params: { galleryId: galleryId ?? 0, photoId, query },
    }),
    [galleryId, query]
  );

  const getChildContainerLink = useCallback(
    (containerId: number): Href => {
      void containerId;
      return {
        pathname: "/(app)/gallery/[galleryId]/search",
        params: { galleryId: galleryId ?? 0, query, order },
      };
    },
    [galleryId, order, query]
  );

  const getSlideshowLink = useCallback((): Href => {
    return {
      pathname: "/(app)/gallery/[galleryId]/search/slideshow",
      params: { galleryId: galleryId ?? 0, query, order },
    };
  }, [galleryId, query, order]);

  const navigateToChildContainer = useCallback((containerId: number) => {
    void containerId;
  }, []);

  const sort = useCallback(
    (by: "date-asc" | "date-desc") => {
      if (!galleryId) return;
      router.replace({
        pathname: "/(app)/gallery/[galleryId]/search",
        params: { galleryId, query, order: by },
      });
    },
    [galleryId, query, router]
  );

  const breadCrumbs = useMemo<BreadCrumb[]>(() => {
    if (!galleryId) return [];
    const crumbs: BreadCrumb[] = [];
    if (gallery) {
      crumbs.push({
        id: gallery.id,
        name: gallery.name ?? "Galerie",
        url: `/gallery/${gallery.id}`,
      });
    }
    if (summary && query) {
      crumbs.push({
        id: summary.id,
        name: `Recherche "${summary.name}"`,
        url: `/gallery/${galleryId}/search?query=${encodeURIComponent(query)}`,
      });
    }
    return crumbs;
  }, [gallery, galleryId, query, summary]);

  const loadPhotos = useCallback(
    async (sortOrder: string, offset: number, count: number) => {
      if (!galleryId || !query) return null;
      return await searchService.getPhotos(
        galleryId,
        query,
        sortOrder,
        offset,
        count
      );
    },
    [galleryId, query, searchService]
  );

  const paginatedPhotosStore = useMemo(() => {
    const sortOrder: "asc" | "desc" = order === "date-asc" ? "asc" : "desc";
    return new PaginatedPhotosStore(summary, loadPhotos, sortOrder);
  }, [summary, loadPhotos, order]);

  const searchStore = useMemo<PhotoContainerStore>(
    () => ({
      navigateToPhoto,
      navigateToContainer,
      navigateToParentContainer,
      hasParent: Boolean(galleryId),
      containersList: [],
      sort,
      order,
      breadCrumbs,
      container: summary,
      navigateToChildContainer,
      getPhotoLink,
      childContainersHeader: null,
      getChildContainerLink,
      paginatedPhotosStore,
      getSlideshowLink,
    }),
    [
      navigateToPhoto,
      navigateToContainer,
      navigateToParentContainer,
      sort,
      order,
      breadCrumbs,
      summary,
      navigateToChildContainer,
      getPhotoLink,
      getChildContainerLink,
      paginatedPhotosStore,
      galleryId,
      getSlideshowLink,
    ]
  );

  return (
    <SearchStoreContext.Provider value={searchStore}>
      {children}
    </SearchStoreContext.Provider>
  );
});

export function useSearchStore() {
  const store = useContext(SearchStoreContext);
  if (!store) {
    throw new Error(
      "useSearchStore must be used within a SearchStoreProvider."
    );
  }
  return store;
}
