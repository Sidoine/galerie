import { Href } from "expo-router";
import {
  Directory,
  DirectoryFull,
  FaceName,
  FaceNameFull,
  Month,
  MonthFull,
  Place,
  PlaceFull,
  Year,
  YearFull,
  GalleryFull,
  Gallery,
  SearchResultFull,
} from "@/services/views";
import { ReactNode } from "react";
import { PaginatedPhotosStore } from "./paginated-photos";

export type PhotoContainer =
  | Year
  | Month
  | Directory
  | Place
  | FaceName
  | Gallery;

export type PhotoContainerFull =
  | YearFull
  | MonthFull
  | DirectoryFull
  | PlaceFull
  | FaceNameFull
  | GalleryFull
  | SearchContainerFull;

export type SearchContainerFull = SearchResultFull & { id: number };

export interface BreadCrumb {
  id: number;
  name: string;
  url: Href;
}

export interface PhotoContainerStore {
  navigateToPhoto(photoId: number): void;
  navigateToContainer(): void;
  navigateToParentContainer(): void;
  navigateToChildContainer(containerId: number): void;
  hasParent: boolean;
  containersList: PhotoContainer[] | null;
  sort(by: "date-asc" | "date-desc"): void;
  order: "date-asc" | "date-desc";
  breadCrumbs: BreadCrumb[];
  container: PhotoContainerFull | null;
  getPhotoLink(photoId: number): Href;
  /** Store de pagination adaptative (jours/mois). Présent quand la vue supporte le chargement progressif. */
  paginatedPhotosStore: PaginatedPhotosStore;
  setCover?(photoId: number): Promise<void>;
  setParentCover?(containerId: number): Promise<void>;
  renameContainer?(newName: string): Promise<void>;
  childContainersHeader: ReactNode;
  getChildContainerLink(containerId: number): Href;
  getSlideshowLink(): Href;
}
