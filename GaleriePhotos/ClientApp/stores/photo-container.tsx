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
} from "@/services/views";
import { ReactNode } from "react";
import { PaginatedPhotosStore } from "./paginated-photos";

export type PhotoContainer = Year | Month | Directory | Place | FaceName;
export type PhotoContainerFull =
  | YearFull
  | MonthFull
  | DirectoryFull
  | PlaceFull
  | FaceNameFull;

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
  childContainersHeader: ReactNode;
  getChildContainerLink(containerId: number): Href;
}
