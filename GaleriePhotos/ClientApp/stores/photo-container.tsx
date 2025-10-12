import { Href } from "expo-router";
import {
  Directory,
  FaceName,
  Month,
  Photo,
  Place,
  Year,
} from "@/services/views";
import { ReactNode } from "react";

export type PhotoContainer = Year | Month | Directory | Place | FaceName;

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
  setCover?(photoId: number): Promise<void>;
  setParentCover?(containerId: number): Promise<void>;
  childContainersHeader: ReactNode;
  getChildContainerLink(containerId: number): Href;
}
