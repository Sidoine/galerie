import {
  makeObservable,
  observable,
  action,
  runInAction,
  computed,
} from "mobx";
import { Photo } from "@/services/views";

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
  isLoadingBefore = false;
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
      isLoadingBefore: observable,
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
      hasScrolledUp: computed,
    });
    this.sortOrder = sortOrder;
    this.isLoading = false;
    this.hasMore = true;
    this.hasMoreBefore = false;
    this.error = null;
    this.lastScrollOffset = 0;
    this.pendingScrollRestoration = false;
  }

  get hasScrolledUp(): boolean {
    return this.offsetFromStart > 0;
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
    console.log(
      "Loading more photos before",
      this.isLoadingBefore,
      this.hasMoreBefore
    );
    if (this.isLoadingBefore || !this.hasMoreBefore) return;
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
    await this.loadChunk(true);
  }

  private get invertedSortOrder(): "asc" | "desc" {
    return this.sortOrder === "asc" ? "desc" : "asc";
  }

  /**
   * Load a chunk of photos using offset-based pagination
   * @param backward If true, load photos before the current set (negative offset)
   */
  private async loadChunk(backward: boolean) {
    if (backward ? this.isLoadingBefore : this.isLoading) return;

    runInAction(() => {
      if (backward) {
        this.isLoadingBefore = true;
      } else {
        this.isLoading = true;
      }
      this.error = null;
    });

    try {
      const offset = backward
        ? this.offsetFromStart
        : this.offsetFromStart + this.photos.length;

      const photos = await this.loadPhotosFunction(
        backward ? this.invertedSortOrder : this.sortOrder,
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
        if (backward) {
          this.isLoadingBefore = false;
        } else {
          this.isLoading = false;
        }
      });
    }
  }

  private addPhotos(newPhotos: Photo[]) {
    this.photos.push(...newPhotos);
  }

  private addPhotosBefore(newPhotos: Photo[]) {
    this.photos.unshift(...newPhotos.slice().reverse());
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
