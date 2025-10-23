import React, { createContext, useContext, ReactNode } from "react";
import { observable, action, makeObservable, computed } from "mobx";

export class PhotoSelectionStore {
  selectedPhotoIds = new Set<number>();

  constructor() {
    makeObservable(this, {
      selectedPhotoIds: observable,
      toggleSelection: action,
      clearSelection: action,
      selectPhoto: action,
      deselectPhoto: action,
      hasSelection: computed,
      selectedCount: computed,
      selectedPhotosArray: computed,
    });
  }

  toggleSelection(photoId: number) {
    if (this.selectedPhotoIds.has(photoId)) {
      this.selectedPhotoIds.delete(photoId);
    } else {
      this.selectedPhotoIds.add(photoId);
    }
  }

  selectPhoto(photoId: number) {
    this.selectedPhotoIds.add(photoId);
  }

  deselectPhoto(photoId: number) {
    this.selectedPhotoIds.delete(photoId);
  }

  clearSelection() {
    this.selectedPhotoIds.clear();
  }

  get hasSelection(): boolean {
    return this.selectedPhotoIds.size > 0;
  }

  get selectedCount(): number {
    return this.selectedPhotoIds.size;
  }

  get selectedPhotosArray(): number[] {
    return Array.from(this.selectedPhotoIds);
  }

  isSelected(photoId: number): boolean {
    return this.selectedPhotoIds.has(photoId);
  }
}

const PhotoSelectionContext = createContext<PhotoSelectionStore | null>(null);

export function PhotoSelectionProvider({ children }: { children: ReactNode }) {
  const [store] = React.useState(() => new PhotoSelectionStore());

  return (
    <PhotoSelectionContext.Provider value={store}>
      {children}
    </PhotoSelectionContext.Provider>
  );
}

export function usePhotoSelectionStore(): PhotoSelectionStore {
  const store = useContext(PhotoSelectionContext);
  if (!store) {
    throw new Error(
      "usePhotoSelectionStore must be used within PhotoSelectionProvider"
    );
  }
  return store;
}
