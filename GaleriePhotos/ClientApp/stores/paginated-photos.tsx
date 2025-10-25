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
  count: number,
  startDate?: string | null
) => Promise<PhotoResponse<Photo[]> | null>;

/**
 * Store for handling paginated photo loading with offset-based chunks
 * Supports bidirectional loading (forward and backward) with date-based jumps
 */
export class PaginatedPhotosStore {
  photos = observable.array<Photo>([]);
  isLoading = false;
  hasMore = true;
  hasMoreBefore = true;
  error: string | null = null;
  private sortOrder: "asc" | "desc";
  private readonly pageSize = 25;
  lastScrollOffset = 0;
  pendingScrollRestoration = false;
  private startDate: string | null = null;
  private offsetFromStart = 0;

  constructor(
    private loadPhotosFunction: LoadPhotosFunction,
    sortOrder: "asc" | "desc" = "desc"
  ) {
    makeObservable<typeof this, "addPhotos" | "addPhotosBefore">(this, {
      photos: observable.shallow,
      isLoading: observable,
      hasMore: observable,
      hasMoreBefore: observable,
      error: observable,
      loadMore: action,
      loadMoreBefore: action,
      addPhotos: action,
      addPhotosBefore: action,
      pendingScrollRestoration: observable,
      requestScrollRestoration: action,
      clearScrollRestoration: action,
      jumpToDate: action,
    });
    this.sortOrder = sortOrder;
    this.isLoading = false;
    this.hasMore = true;
    this.hasMoreBefore = true;
    this.error = null;
    this.lastScrollOffset = 0;
    this.pendingScrollRestoration = false;
  }

  /**
   * Load more photos (forward direction)
   */
  async loadMore() {
    if (this.isLoading || !this.hasMore) return;
    await this.loadChunk(false);
  }

  /**
   * Load more photos (backward direction)
   */
  async loadMoreBefore() {
    if (this.isLoading || !this.hasMoreBefore) return;
    await this.loadChunk(true);
  }

  /**
   * Jump to a specific date and reload photos from that point
   */
  async jumpToDate(date: string) {
    runInAction(() => {
      this.photos.clear();
      this.startDate = date;
      this.offsetFromStart = 0;
      this.hasMore = true;
      this.hasMoreBefore = true;
      this.error = null;
    });
    await this.loadChunk(false);
  }

  /**
   * Load a chunk of photos using offset-based pagination
   * @param backward If true, load photos before the current set (negative offset)
   */
  private async loadChunk(backward: boolean) {
    if (this.isLoading) return;

    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const offset = backward 
        ? -(this.offsetFromStart + this.pageSize)
        : this.offsetFromStart + this.photos.length;
      
      const photos = await this.loadPhotosFunction(
        this.sortOrder,
        offset,
        this.pageSize,
        this.startDate
      );

      runInAction(() => {
        if (photos && photos.ok) {
          if (backward) {
            this.addPhotosBefore(photos.value);
            this.hasMoreBefore = photos.value.length === this.pageSize;
            if (photos.value.length > 0) {
              this.offsetFromStart += photos.value.length;
            }
          } else {
            this.addPhotos(photos.value);
            this.hasMore = photos.value.length === this.pageSize;
          }
        } else {
          if (backward) {
            this.hasMoreBefore = false;
          } else {
            this.hasMore = false;
          }
          this.error = photos?.message || "Failed to load photos";
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
        if (backward) {
          this.hasMoreBefore = false;
        } else {
          this.hasMore = false;
        }
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

  private addPhotosBefore(newPhotos: Photo[]) {
    // Avoid duplicates and add at the beginning
    const existingIds = new Set(this.photos.map((p) => p.id));
    const uniqueNewPhotos = newPhotos.filter((p) => !existingIds.has(p.id));
    this.photos.unshift(...uniqueNewPhotos);
  }

  /**
   * Check if we should trigger loading more photos
   */
  shouldLoadMore(): boolean {
    return !this.isLoading && this.hasMore;
  }

  /**
   * Check if we should trigger loading more photos before the current set
   */
  shouldLoadMoreBefore(): boolean {
    return !this.isLoading && this.hasMoreBefore;
  }

  requestScrollRestoration() {
    this.pendingScrollRestoration = true;
  }

  clearScrollRestoration() {
    this.pendingScrollRestoration = false;
  }
}
