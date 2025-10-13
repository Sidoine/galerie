import { makeObservable, observable, action, runInAction } from "mobx";
import { Photo } from "@/services/views";

export interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

/**
 * Store for handling paginated photo loading with date-based chunks
 */
export class PaginatedPhotosStore {
  photos: Photo[] = [];
  isLoading = false;
  hasMore = true;
  currentEndDate: string | null = null;
  error: string | null = null;

  constructor(
    private loadPhotosFunction: (startDate?: string | null, endDate?: string | null) => Promise<Photo[]>,
    private chunkSizeMonths = 3 // Load 3 months at a time
  ) {
    makeObservable(this, {
      photos: observable,
      isLoading: observable,
      hasMore: observable,
      currentEndDate: observable,
      error: observable,
      loadInitial: action,
      loadMore: action,
    });
  }

  /**
   * Load initial batch of photos (most recent)
   */
  async loadInitial() {
    runInAction(() => {
      this.photos = [];
      this.isLoading = false;
      this.hasMore = true;
      this.currentEndDate = null;
      this.error = null;
    });
    runInAction(() => {
      this.isLoading = true;
    });
    
    try {
      // Load photos from now back to 3 months ago
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - this.chunkSizeMonths);
      
      const photos = await this.loadPhotosFunction(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      runInAction(() => {
        this.addPhotos(photos);
        this.currentEndDate = startDate.toISOString().split('T')[0];
        
        // If we got fewer photos than expected, we might have reached the end
        if (photos.length < 50) { // Arbitrary threshold
          this.hasMore = false;
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Load more photos (older photos)
   */
  async loadMore() {
    if (this.isLoading || !this.hasMore || !this.currentEndDate) {
      return;
    }

    runInAction(() => {
      this.isLoading = true;
    });
    
    try {
      // Load photos from currentEndDate back another chunk
      const endDate = new Date(this.currentEndDate);
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - this.chunkSizeMonths);
      
      const photos = await this.loadPhotosFunction(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      runInAction(() => {
        this.addPhotos(photos);
        this.currentEndDate = startDate.toISOString().split('T')[0];
        
        // If we got fewer photos than expected, we might have reached the end
        if (photos.length === 0) {
          this.hasMore = false;
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  private addPhotos(newPhotos: Photo[]) {
    // Sort photos by date (newest first) and avoid duplicates
    const existingIds = new Set(this.photos.map(p => p.id));
    const uniqueNewPhotos = newPhotos.filter(p => !existingIds.has(p.id));
    
    this.photos.push(...uniqueNewPhotos);
    
    // Keep photos sorted by date (newest first)
    this.photos.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }

  private reset() {
    this.photos = [];
    this.isLoading = false;
    this.hasMore = true;
    this.currentEndDate = null;
    this.error = null;
  }

  /**
   * Get all loaded photos
   */
  getAllPhotos(): Photo[] {
    return this.photos;
  }

  /**
   * Check if we should trigger loading more photos
   */
  shouldLoadMore(): boolean {
    return !this.isLoading && this.hasMore;
  }
}