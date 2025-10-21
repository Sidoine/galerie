import { makeObservable, observable, action, runInAction } from "mobx";
import { Photo } from "@/services/views";
import { PhotoContainerFull } from "./photo-container";

export type PhotoResponse<TD> =
  | {
      value: TD;
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export type LoadPhotosFunction = (
  sortOrder: string,
  offset: number,
  count: number
) => Promise<PhotoResponse<Photo[]> | null>;

/**
 * Store for handling paginated photo loading with offset-based chunks
 */
export class PaginatedPhotosStore {
  photos: Photo[] = [];
  isLoading = false;
  hasMore = true;
  error: string | null = null;
  private sortOrder: "asc" | "desc";
  private readonly pageSize = 25;
  lastScrollOffset = 0;
  pendingScrollRestoration = false;

  constructor(
    private container: PhotoContainerFull | null,
    private loadPhotosFunction: LoadPhotosFunction,
    sortOrder: "asc" | "desc" = "desc"
  ) {
    makeObservable<typeof this, "addPhotos">(this, {
      photos: observable.shallow,
      isLoading: observable,
      hasMore: observable,
      error: observable,
      loadMore: action,
      addPhotos: action,
      pendingScrollRestoration: observable,
      requestScrollRestoration: action,
      clearScrollRestoration: action,
    });
    this.sortOrder = sortOrder;
    this.photos = [];
    this.isLoading = false;
    this.hasMore = true;
    this.error = null;
    this.lastScrollOffset = 0;
    this.pendingScrollRestoration = false;
  }

  /**
   * Load more photos
   */
  async loadMore() {
    if (this.isLoading || !this.hasMore) return;
    await this.loadChunk();
  }

  /**
   * Load a chunk of photos using offset-based pagination
   */
  private async loadChunk() {
    if (this.isLoading) return;

    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const offset = this.photos.length;
      const photos = await this.loadPhotosFunction(
        this.sortOrder,
        offset,
        this.pageSize
      );

      runInAction(() => {
        if (photos && photos.ok) {
          this.addPhotos(photos.value);
          // If we received fewer photos than requested, there are no more
          this.hasMore = photos.value.length === this.pageSize;
        } else {
          this.hasMore = false;
          this.error = photos?.message || "Failed to load photos";
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
        this.hasMore = false;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  private addPhotos(newPhotos: Photo[]) {
    // Avoid duplicates
    const existingIds = new Set(this.photos.map((p) => p.id));
    const uniqueNewPhotos = newPhotos.filter((p) => !existingIds.has(p.id));
    this.photos.push(...uniqueNewPhotos);
  }

  /**
   * Check if we should trigger loading more photos
   */
  shouldLoadMore(): boolean {
    return !this.isLoading && this.hasMore;
  }

  requestScrollRestoration() {
    this.pendingScrollRestoration = true;
  }

  clearScrollRestoration() {
    this.pendingScrollRestoration = false;
  }
}
