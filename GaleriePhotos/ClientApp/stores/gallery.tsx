import { createContext, useCallback, useContext, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Href, useRouter } from "expo-router";
import {
  PhotoContainerStore,
  BreadCrumb,
  PhotoContainer,
} from "./photo-container";
import { useGalleriesStore } from "./galleries";
import { PaginatedPhotosStore } from "./paginated-photos";
import { GalleryFull } from "@/services/views";

export interface GalleryStore extends PhotoContainerStore {
  galleryId: number;
  gallery: GalleryFull | null;
}

const GalleryStoreContext = createContext<GalleryStore | null>(null);

const emptyPhotoContainersList: PhotoContainer[] = [];

export const GalleryStoreProvider = observer(function GalleryStoreProvider({
  children,
  galleryId,
  order = "date-desc",
}: {
  children: React.ReactNode;
  galleryId: number;
  order?: "date-asc" | "date-desc";
}) {
  const router = useRouter();
  const galleriesStore = useGalleriesStore();
  const gallery = galleryId ? galleriesStore.get(galleryId) : null;

  // À ce niveau, pas de route spécifique pour une photo de galerie (sans répertoire).
  // On renvoie donc le lien vers la galerie elle-même; un composant consumer pourra décider de rediriger vers un album.
  const getPhotoLink = useCallback(
    (photoId: number): Href => ({
      pathname: "/(app)/gallery/[galleryId]/photos/[photoId]",
      params: { galleryId: galleryId ?? 0, order, photoId },
    }),
    [galleryId, order]
  );

  const navigateToPhoto = useCallback(
    (photoId: number) => router.push(getPhotoLink(photoId)),
    [router, getPhotoLink]
  );

  const navigateToContainer = useCallback(() => {
    router.replace({
      pathname: "/gallery/[galleryId]",
      params: { galleryId: galleryId ?? 0, order },
    });
  }, [router, galleryId, order]);

  const navigateToParentContainer = useCallback(() => {
    // Une galerie n'a pas de parent; on pourrait aller vers l'écran de choix de galerie.
    router.push({ pathname: "/(app)/gallery/choose" });
  }, [router]);

  const getChildContainerLink = useCallback(
    (directoryId: number): Href => {
      return {
        pathname: "/(app)/gallery/[galleryId]/directory/[directoryId]",
        params: { galleryId: galleryId ?? 0, directoryId, order },
      };
    },
    [galleryId, order]
  );

  const getSlideshowLink = useCallback((): Href => {
    return {
      pathname: "/(app)/gallery/[galleryId]/slideshow",
      params: { galleryId: galleryId ?? 0, order },
    };
  }, [galleryId, order]);

  const navigateToChildContainer = useCallback(
    (directoryId: number) => router.push(getChildContainerLink(directoryId)),
    [router, getChildContainerLink]
  );

  // Fil d'ariane: juste la galerie comme racine
  const breadCrumbs = useMemo<BreadCrumb[]>(() => {
    if (!gallery) return [];
    return [
      {
        id: gallery.id,
        name: gallery.name ?? "Galerie",
        url: `/gallery/${gallery.id}`,
      },
    ];
  }, [gallery]);

  // Pour l'instant la galerie ne fournit pas containersList (les albums seront via DirectoryStoreProvider sur la route)
  const containersList = emptyPhotoContainersList;
  const hasParent = false;

  // PaginatedPhotosStore requiert un conteneur complet et une fonction loadPhotos; ordre asc/desc
  const paginatedPhotosStore = useMemo(() => {
    const sortOrder: "asc" | "desc" = order === "date-asc" ? "asc" : "desc";
    const loadPhotos = galleriesStore.loadPhotos.bind(
      galleriesStore,
      galleryId ?? 0
    );
    return new PaginatedPhotosStore(gallery, loadPhotos, sortOrder);
  }, [galleriesStore, gallery, galleryId, order]);

  const galleryStore = useMemo<GalleryStore>(
    () => ({
      navigateToPhoto: (photoId: number) => navigateToPhoto(photoId),
      navigateToContainer,
      navigateToParentContainer,
      hasParent,
      containersList,
      sort: (by: "date-asc" | "date-desc") => {
        router.replace({
          pathname: "/gallery/[galleryId]",
          params: { galleryId: galleryId ?? 0, order: by },
        });
      },
      order,
      breadCrumbs,
      container: gallery,
      navigateToChildContainer,
      getPhotoLink,
      childContainersHeader: null,
      getChildContainerLink,
      paginatedPhotosStore,
      galleryId,
      gallery,
      getSlideshowLink,
    }),
    [
      navigateToContainer,
      navigateToParentContainer,
      hasParent,
      containersList,
      order,
      breadCrumbs,
      gallery,
      navigateToChildContainer,
      getPhotoLink,
      getChildContainerLink,
      paginatedPhotosStore,
      navigateToPhoto,
      router,
      galleryId,
      getSlideshowLink,
    ]
  );

  return (
    <GalleryStoreContext.Provider value={galleryStore}>
      {children}
    </GalleryStoreContext.Provider>
  );
});

export function useGalleryStore() {
  const store = useContext(GalleryStoreContext);
  if (!store)
    throw new Error(
      "useGalleryStore must be used within a GalleryStoreProvider."
    );
  return store;
}
