import { createContext, useContext, useMemo } from "react";
import { makeObservable, observable, action } from "mobx";
import { observer } from "mobx-react-lite";
import { Photo } from "@/services/views";

/**
 * Store to manage selected photos across the gallery.
 * This allows for bulk operations like changing dates or locations.
 */
class SelectedPhotosStore {
  selectedPhotos = new Map<number, Photo>();

  constructor() {
    makeObservable(this, {
      selectedPhotos: observable,
      togglePhoto: action,
      selectPhoto: action,
      deselectPhoto: action,
      clearSelection: action,
      selectPhotos: action,
      deselectPhotos: action,
    });
  }

  togglePhoto(photo: Photo) {
    if (this.selectedPhotos.has(photo.id)) {
      this.selectedPhotos.delete(photo.id);
    } else {
      this.selectedPhotos.set(photo.id, photo);
    }
  }

  selectPhoto(photo: Photo) {
    this.selectedPhotos.set(photo.id, photo);
  }

  deselectPhoto(photoId: number) {
    this.selectedPhotos.delete(photoId);
  }

  clearSelection() {
    this.selectedPhotos.clear();
  }

  selectPhotos(photos: Photo[]) {
    photos.forEach((photo) => {
      this.selectedPhotos.set(photo.id, photo);
    });
  }

  deselectPhotos(photoIds: number[]) {
    photoIds.forEach((photoId) => {
      this.selectedPhotos.delete(photoId);
    });
  }

  isSelected(photoId: number): boolean {
    return this.selectedPhotos.has(photoId);
  }

  areAllSelected(photoIds: number[]): boolean {
    return photoIds.every((id) => this.selectedPhotos.has(id));
  }

  areSomeSelected(photoIds: number[]): boolean {
    return photoIds.some((id) => this.selectedPhotos.has(id));
  }

  get count(): number {
    return this.selectedPhotos.size;
  }

  get photos(): Photo[] {
    return Array.from(this.selectedPhotos.values());
  }

  get photoIds(): number[] {
    return Array.from(this.selectedPhotos.keys());
  }
}

const SelectedPhotosStoreContext = createContext<SelectedPhotosStore | null>(
  null
);

export const SelectedPhotosStoreProvider = observer(
  function SelectedPhotosStoreProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const store = useMemo(() => new SelectedPhotosStore(), []);

    return (
      <SelectedPhotosStoreContext.Provider value={store}>
        {children}
      </SelectedPhotosStoreContext.Provider>
    );
  }
);

export function useSelectedPhotosStore() {
  const store = useContext(SelectedPhotosStoreContext);
  if (!store) {
    throw new Error(
      "useSelectedPhotosStore must be used within a SelectedPhotosStoreProvider."
    );
  }
  return store;
}
