import { Href } from "@/.expo/types/router";
import { Directory, Month, Photo, Year } from "@/services/views";

export type PhotoContainer = Year | Month | Directory;

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
  photoList: Photo[] | null;
  containersList: PhotoContainer[] | null;
  sort(by: "date-asc" | "date-desc"): void;
  order: "date-asc" | "date-desc";
  breadCrumbs: BreadCrumb[];
  container: PhotoContainer | null;
  getPhotoLink(photoId: number): Href;
}
