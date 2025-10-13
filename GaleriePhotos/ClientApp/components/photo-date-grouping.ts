import { Photo } from "@/services/views";

export interface DateGroupedPhoto {
  date: string;
  photos: Photo[];
}

export interface DateGroup extends DateGroupedPhoto {
  id: string;
  displayTitle: string;
}

/**
 * Groups photos by date for display in FlashList
 * @param photos Array of photos sorted by date
 * @param groupByDay Whether to group by day (true) or month (false)
 * @returns Array of date groups with display titles
 */
export function groupPhotosByDate(
  photos: Photo[],
  groupByDay = true
): DateGroup[] {
  const groups = new Map<string, Photo[]>();

  photos.forEach((photo) => {
    const date = new Date(photo.dateTime);
    const key = groupByDay
      ? date.toISOString().split("T")[0] // YYYY-MM-DD
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(photo);
  });

  return Array.from(groups.entries())
    .map(([date, photos]) => ({
      id: date,
      date,
      photos,
      displayTitle: formatDateGroupTitle(date, groupByDay),
    }))
    .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first
}

/**
 * Formats the date group title for display
 */
function formatDateGroupTitle(dateKey: string, isDay: boolean): string {
  if (isDay) {
    const date = new Date(dateKey + "T00:00:00");
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } else {
    const [year, month] = dateKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
    }).format(date);
  }
}

/**
 * Determines the optimal grouping strategy based on photo count and date range
 */
export function determineGroupingStrategy(
  photos: Photo[]
): "day" | "month" | "none" {
  if (photos.length <= 20) return "none";

  if (photos.length === 0) return "none";

  // Calculate date range
  const dates = photos
    .map((p) => new Date(p.dateTime))
    .sort((a, b) => a.getTime() - b.getTime());
  const daysDiff = Math.ceil(
    (dates[dates.length - 1].getTime() - dates[0].getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // If photos span more than 90 days, group by month
  if (daysDiff > 90) return "month";

  // Otherwise group by day
  return "day";
}

/**
 * Splits photos into rows for grid display
 */
export function splitPhotosIntoRows<T>(items: T[], cols: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }
  return rows;
}
