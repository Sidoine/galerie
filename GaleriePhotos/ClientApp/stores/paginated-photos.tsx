import { makeObservable, observable, action, runInAction } from "mobx";
import { Photo } from "@/services/views";
import { PhotoContainerFull } from "./photo-container";
import { ApiResponse } from "folke-service-helpers";

export interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

export type LoadPhotosFunction = (
  startDate?: string | null,
  endDate?: string | null
) => Promise<ApiResponse<Photo[]> | null>;

/**
 * Store for handling paginated photo loading with date-based chunks
 */
export class PaginatedPhotosStore {
  photos: Photo[] = [];
  isLoading = false;
  hasMore = true;
  lastLimitDate: string | null = null; // borne inférieure (exclusive) déjà chargée
  error: string | null = null;
  private chunkMode: "days" | "months";
  private chunkSize: number; // selon chunkMode
  private sortOrder: "asc" | "desc";

  constructor(
    private container: PhotoContainerFull | null,
    private loadPhotosFunction: LoadPhotosFunction,
    sortOrder: "asc" | "desc" = "desc"
  ) {
    makeObservable<typeof this, "addPhotos">(this, {
      photos: observable.shallow,
      isLoading: observable,
      hasMore: observable,
      lastLimitDate: observable,
      error: observable,
      loadInitial: action,
      loadMore: action,
      addPhotos: action,
    });
    const strategy = this.computeChunkStrategy();
    this.chunkMode = strategy.mode;
    this.chunkSize = strategy.size;
    this.sortOrder = sortOrder;
  }

  private computeChunkStrategy(): { mode: "days" | "months"; size: number } {
    if (!this.container) return { mode: "months", size: 3 }; // fallback
    const { minDate, maxDate, numberOfPhotos } = this.container;
    if (!minDate || !maxDate || !numberOfPhotos || numberOfPhotos === 0) {
      return { mode: "months", size: 3 };
    }
    const min = new Date(minDate);
    const max = new Date(maxDate);
    const totalDays = Math.max(
      1,
      Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24))
    );
    const totalMonths = Math.max(
      1,
      (max.getFullYear() - min.getFullYear()) * 12 +
        (max.getMonth() - min.getMonth()) +
        1
    );
    const densityPerDay = numberOfPhotos / totalDays; // photos / jour
    const densityPerMonth = numberOfPhotos / totalMonths; // photos / mois
    const target = 200; // cible approximative de photos par batch

    // Décision du mode:
    // - Si faible densité journalière (< 2/jour) mais distribution étalée (> 12 mois), utiliser des mois
    // - Sinon rester en jours
    if (densityPerDay < 2 && totalMonths > 12) {
      // Calcul du nombre de mois pour approcher la cible
      let months = Math.ceil(target / Math.max(1, densityPerMonth));
      months = Math.min(Math.max(months, 1), 2); // min 1 mois, max 2 mois
      return { mode: "months", size: months };
    }

    // Mode jours
    let days = Math.ceil(target / Math.max(1, densityPerDay));
    days = Math.min(Math.max(days, 3), 15); // 3 jours à 15 jours
    return { mode: "days", size: days };
  }

  get chunkDescription(): string {
    return this.chunkMode === "days"
      ? `${this.chunkSize} jours`
      : `${this.chunkSize} mois`;
  }

  /**
   * Load initial batch of photos (most recent)
   */
  async loadInitial() {
    this.reset();
    await this.loadChunk();
  }

  /**
   * Load more photos (older photos)
   */
  async loadMore() {
    if (this.isLoading || !this.hasMore) return;
    await this.loadChunk();
  }

  /**
   * Charge un chunk de photos.
   * @param initial Indique s'il s'agit du premier chargement
   */
  private async loadChunk() {
    if (this.isLoading || !this.container) return;
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      if (!this.lastLimitDate) return; // rien à faire
      const endDate = new Date(this.lastLimitDate);
      const startDate = new Date(this.lastLimitDate);

      // Appliquer la fenêtre de chunk
      if (this.chunkMode === "days") {
        if (this.sortOrder === "asc") {
          endDate.setDate(endDate.getDate() + this.chunkSize);
        } else {
          startDate.setDate(startDate.getDate() - this.chunkSize);
        }
      } else {
        if (this.sortOrder === "asc") {
          endDate.setMonth(endDate.getMonth() + this.chunkSize);
        } else {
          startDate.setMonth(startDate.getMonth() - this.chunkSize);
        }
      }

      const startIso = startDate.toISOString().split("T")[0];
      const endIso = endDate.toISOString().split("T")[0];
      const photos = await this.loadPhotosFunction(startIso, endIso);

      runInAction(() => {
        if (photos && photos.ok) {
          this.addPhotos(photos.value);
          if (this.sortOrder === "asc") {
            this.lastLimitDate = endIso;
            this.hasMore =
              endDate < new Date(this.container?.maxDate || "2100-01-01");
          } else {
            this.lastLimitDate = startIso;
            this.hasMore =
              startDate > new Date(this.container?.minDate || "1970-01-01");
          }
        } else {
          this.hasMore = false;
          this.error = photos?.message || "Failed to load photos";
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Unknown error";
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

    // Tri selon l'ordre demandé (par dateTime)
    this.photos.sort((a, b) => {
      const diff =
        new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
      return this.sortOrder === "asc" ? diff : -diff;
    });
  }

  private reset() {
    this.photos = [];
    this.isLoading = false;
    this.hasMore = true;
    if (this.container) {
      this.lastLimitDate =
        this.sortOrder === "asc"
          ? this.container.minDate
          : this.container.maxDate;
    }
    this.error = null;
  }

  /**
   * Check if we should trigger loading more photos
   */
  shouldLoadMore(): boolean {
    return !this.isLoading && this.hasMore;
  }
}
