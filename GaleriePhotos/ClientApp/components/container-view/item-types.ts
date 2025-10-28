// -----------------------------
// Types d'items pour la FlashList plate

import { Photo } from "@/services/views";
import { PhotoContainer } from "@/stores/photo-container";
import { ReactNode } from "react";

export const gap = 4;

// -----------------------------
export interface BaseItem {
  id: string;
  type: string;
}

export interface AlbumsHeaderItem extends BaseItem {
  type: "albumsHeader";
  title: ReactNode;
}

export interface AlbumRowItem extends BaseItem {
  type: "albumRow";
  items: PhotoContainer[];
}

export interface AlbumCarouselItem extends BaseItem {
  type: "albumCarousel";
  items: PhotoContainer[];
}

export interface DateHeaderItem extends BaseItem {
  type: "dateHeader";
  title: string;
  placeNames: string[];
  photoIds: number[];
}

export interface PhotoRowItem extends BaseItem {
  type: "photoRow";
  items: Photo[];
  groupId: string;
}

export interface LoadingItem extends BaseItem {
  type: "loading";
}

export type DirectoryFlatListItem =
  | AlbumsHeaderItem
  | AlbumRowItem
  | AlbumCarouselItem
  | DateHeaderItem
  | PhotoRowItem
  | LoadingItem;
