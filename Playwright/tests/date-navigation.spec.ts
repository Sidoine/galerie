import { test, expect } from "@playwright/test";
import { registerApiMocks } from "./helpers/apiMocks.ts";

const galleryId = 1;
const rootDirectoryId = 10;
const totalPhotos = 120; // Enough photos to span multiple months

const mockUser = {
  id: "user-1",
  name: "Alice",
  administrator: true,
};

const mockGalleries = [
  {
    id: galleryId,
    name: "Test Gallery 2024",
    rootDirectoryId,
    numberOfPhotos: totalPhotos,
    coverPhotoId: "cover-1",
  },
];

// Create photos spanning 4 months (January to April 2024)
const mockPhotos = Array.from({ length: totalPhotos }, (_, index) => {
  const id = 101 + index;
  // Distribute photos across 4 months
  const monthIndex = Math.floor(index / 30);
  const dayInMonth = (index % 30) + 1;
  const date = new Date(Date.UTC(2024, monthIndex, dayInMonth, 12, 0, 0));
  return {
    id,
    publicId: `photo-${id}`,
    name: `Photo ${index + 1}`,
    video: false,
    directoryId: rootDirectoryId,
    dateTime: date.toISOString(),
    place: null,
  };
});

const mockGalleryFull = {
  minDate: mockPhotos[0]!.dateTime,
  maxDate: mockPhotos[mockPhotos.length - 1]!.dateTime,
  id: galleryId,
  name: "Test Gallery 2024",
  rootDirectoryId,
  numberOfPhotos: totalPhotos,
  coverPhotoId: null,
  dateJumps: [
    {
      type: 1, // Month
      date: "2024-01-01T00:00:00Z",
      label: "janvier 2024",
    },
    {
      type: 1, // Month
      date: "2024-02-01T00:00:00Z",
      label: "février 2024",
    },
    {
      type: 1, // Month
      date: "2024-03-01T00:00:00Z",
      label: "mars 2024",
    },
    {
      type: 1, // Month
      date: "2024-04-01T00:00:00Z",
      label: "avril 2024",
    },
  ],
};

const galleryPhotoDetailsById = Object.fromEntries(
  mockPhotos.map((photo, index, array) => [
    photo.id,
    {
      ...photo,
      nextId: index < array.length - 1 ? array[index + 1]!.id : null,
      previousId: index > 0 ? array[index - 1]!.id : null,
      latitude: null,
      longitude: null,
      camera: null,
      private: false,
      faceDetectionStatus: 2,
    },
  ])
);

const mockMembers = [
  {
    id: 1,
    galleryId,
    galleryName: "Test Gallery 2024",
    userId: mockUser.id,
    userName: mockUser.name,
    directoryVisibility: 1,
    isAdministrator: true,
  },
];

const mockVisibilities = [
  {
    id: 1,
    galleryId,
    name: "All",
    icon: "all",
    value: 1,
  },
];

const rootDirectorySummary = {
  id: rootDirectoryId,
  visibility: 1,
  name: "All Photos",
  coverPhotoId: null,
  numberOfPhotos: totalPhotos,
  numberOfSubDirectories: 0,
};

const mockRootDirectoryFull = {
  ...rootDirectorySummary,
  parent: null,
  minDate: mockPhotos[0]!.dateTime,
  maxDate: mockPhotos[mockPhotos.length - 1]!.dateTime,
  dateJumps: [
    {
      type: 1, // Month
      date: "2024-01-01T00:00:00Z",
      label: "janvier 2024",
    },
    {
      type: 1, // Month
      date: "2024-02-01T00:00:00Z",
      label: "février 2024",
    },
    {
      type: 1, // Month
      date: "2024-03-01T00:00:00Z",
      label: "mars 2024",
    },
    {
      type: 1, // Month
      date: "2024-04-01T00:00:00Z",
      label: "avril 2024",
    },
  ],
};

const mockDirectories = {
  infoById: {
    [rootDirectoryId]: mockRootDirectoryFull,
  },
  subDirectoriesById: {
    [rootDirectoryId]: [],
  },
  photosByDirectoryId: {
    [rootDirectoryId]: mockPhotos,
  },
};

test.describe("Date Navigation Sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await registerApiMocks(page, {
      galleryId,
      user: mockUser,
      galleries: mockGalleries,
      gallery: mockGalleryFull,
      galleryPhotos: mockPhotos,
      members: mockMembers,
      visibilities: mockVisibilities,
      photoDetailsById: galleryPhotoDetailsById,
      directories: mockDirectories,
    });
  });

  test("shows date navigation sidebar on scroll", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for photos to load
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();

    // Initially, the date navigation sidebar should not be visible
    const dateNavigation = page.getByTestId("date-navigation-sidebar");
    
    // Scroll down by finding a photo further down and scrolling to it
    const targetPhoto = photoLinks.nth(15);
    await targetPhoto.scrollIntoViewIfNeeded();
    
    // Wait a bit for the sidebar to appear
    await page.waitForTimeout(200);
    
    // The sidebar should become visible after scrolling
    await expect(dateNavigation).toBeVisible({ timeout: 5000 });
  });

  test("hides date navigation sidebar after 2 seconds of no scrolling", async ({
    page,
  }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for photos to load
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();

    // Scroll to show the sidebar
    const targetPhoto = photoLinks.nth(15);
    await targetPhoto.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Check that sidebar is visible
    const dateNavigation = page.getByTestId("date-navigation-sidebar");
    await expect(dateNavigation).toBeVisible({ timeout: 5000 });

    // Wait for auto-hide (2 seconds + buffer)
    await page.waitForTimeout(2500);

    // Sidebar should be hidden
    await expect(dateNavigation).not.toBeVisible();
  });

  test("navigates to selected date when clicking on date link", async ({
    page,
  }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for photos to load
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();

    // Scroll to show the sidebar
    const targetPhoto = photoLinks.nth(15);
    await targetPhoto.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Check that sidebar is visible
    const dateNavigation = page.getByTestId("date-navigation-sidebar");
    await expect(dateNavigation).toBeVisible({ timeout: 5000 });

    // Find any date link in the sidebar
    const dateLink = dateNavigation.locator('[data-testid^="date-link-"]').first();
    await expect(dateLink).toBeVisible();

    // Click on the date link
    await dateLink.click();

    // Wait for API call with startDate parameter (gallery endpoint)
    await page.waitForResponse(
      (response) =>
        response.url().includes(`/api/galleries/${galleryId}/photos`) &&
        response.url().includes("startDate") &&
        response.request().method() === "GET",
      { timeout: 5000 }
    );

    // After clicking, photos should reload and scroll to top
    await expect(photoLinks.first()).toBeVisible();
  });

  test("resets hide timer when scrolling again", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for photos to load
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();

    // First scroll
    const targetPhoto1 = photoLinks.nth(15);
    await targetPhoto1.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Check that sidebar is visible
    const dateNavigation = page.getByTestId("date-navigation-sidebar");
    await expect(dateNavigation).toBeVisible({ timeout: 5000 });

    // Wait 1.5 seconds (less than 2 seconds)
    await page.waitForTimeout(1500);

    // Scroll again to reset the timer
    const targetPhoto2 = photoLinks.nth(20);
    await targetPhoto2.scrollIntoViewIfNeeded();

    // Wait another 1.5 seconds
    await page.waitForTimeout(1500);

    // Sidebar should still be visible because timer was reset
    await expect(dateNavigation).toBeVisible();

    // Wait for the full 2 seconds after last scroll
    await page.waitForTimeout(2500);

    // Now it should be hidden
    await expect(dateNavigation).not.toBeVisible();
  });

  test("loads more photos when scrolling up after date jump (loadMoreBefore)", async ({
    page,
  }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for initial photos to load
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();

    // Scroll down to show the sidebar
    const targetPhoto = photoLinks.nth(20);
    await targetPhoto.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Click on March (a later date) to jump ahead
    const dateNavigation = page.getByTestId("date-navigation-sidebar");
    await expect(dateNavigation).toBeVisible({ timeout: 2000 });
    
    const marchDateLink = dateNavigation.locator('text=/mars/i').first();
    await expect(marchDateLink).toBeVisible();
    
    // Set up listener for API call with negative offset before clicking
    const negativeOffsetPromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/galleries/${galleryId}/photos`) &&
        response.url().includes("offset=-") &&
        response.request().method() === "GET",
      { timeout: 10000 }
    );
    
    // Click on March to jump to that date
    await marchDateLink.click();
    
    // Wait for the jump to complete (API call with startDate)
    await page.waitForResponse(
      (response) =>
        response.url().includes(`/api/galleries/${galleryId}/photos`) &&
        response.url().includes("startDate") &&
        response.request().method() === "GET",
      { timeout: 5000 }
    );
    
    // Wait for photos to load
    await page.waitForTimeout(500);
    
    // Now scroll to the very top to trigger loadMoreBefore
    await page.keyboard.press("Home");
    await page.waitForTimeout(500);
    
    // Verify that the API was called with negative offset (loadMoreBefore)
    const negativeOffsetResponse = await negativeOffsetPromise;
    expect(negativeOffsetResponse.url()).toMatch(/offset=-\d+/);
    
    // Verify that photos before March are now visible
    // The test should confirm that scrolling up after jumping to a date works correctly
    await expect(photoLinks.first()).toBeVisible();
  });
});
