import { test, expect } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { registerApiMocks } from "./helpers/apiMocks.ts";

const galleryId = 1;
const rootDirectoryId = 10;
const totalPhotos = 60;
const FACE_DETECTION_COMPLETED = 2;

const mockUser = {
  id: "user-1",
  name: "Alice",
  administrator: true,
};

const mockGalleries = [
  {
    id: galleryId,
    name: "Famille 2024",
    rootDirectoryId,
    numberOfPhotos: totalPhotos,
    coverPhotoId: "cover-1",
  },
];

const mockGalleryFull = {
  minDate: "2024-01-01T00:00:00Z",
  maxDate: "2024-12-31T23:59:59Z",
  id: galleryId,
  name: "Famille 2024",
  rootDirectoryId,
  numberOfPhotos: totalPhotos,
  coverPhotoId: null,
};

const mockPhotos = Array.from({ length: totalPhotos }, (_, index) => {
  const id = 101 + index;
  const day = Math.min(index + 1, 28);
  const date = new Date(Date.UTC(2024, 0, day, 12, 0, 0));
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
      faceDetectionStatus: FACE_DETECTION_COMPLETED,
    },
  ])
);

const mockMembers = [
  {
    id: 1,
    galleryId,
    galleryName: "Famille 2024",
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
    name: "Famille",
    icon: "family",
    value: 1,
  },
];

async function getScrollContainerInfo(locator: Locator) {
  return locator.evaluate((node) => {
    const SCROLL_EPSILON = 1;
    let current: HTMLElement | null = node.parentElement;

    while (current) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      const hasScrollableContent =
        current.scrollHeight - current.clientHeight > SCROLL_EPSILON;

      if (
        hasScrollableContent &&
        (overflowY === "auto" ||
          overflowY === "scroll" ||
          overflowY === "overlay")
      ) {
        return {
          scrollTop: current.scrollTop,
          tagName: current.tagName,
          id: current.id,
          className: current.className,
        };
      }
      current = current.parentElement;
    }

    return {
      scrollTop: window.scrollY,
      tagName: "WINDOW",
      id: "",
      className: "",
    };
  });
}

const childDirectoryId = 20;
const childAlbumName = "Vacances Bretagne";

const childDirectoryPhotos = Array.from({ length: 3 }, (_, index) => {
  const id = 1001 + index;
  const day = index + 1;
  const date = new Date(Date.UTC(2024, 5, day, 14, 30, 0));
  return {
    id,
    publicId: `child-photo-${id}`,
    name: `Photo enfant ${index + 1}`,
    video: false,
    directoryId: childDirectoryId,
    dateTime: date.toISOString(),
    place: null,
  };
});

const childPhotoDetailsById = Object.fromEntries(
  childDirectoryPhotos.map((photo, index, array) => [
    photo.id,
    {
      ...photo,
      nextId: index < array.length - 1 ? array[index + 1]!.id : null,
      previousId: index > 0 ? array[index - 1]!.id : null,
      latitude: null,
      longitude: null,
      camera: null,
      private: false,
      faceDetectionStatus: FACE_DETECTION_COMPLETED,
    },
  ])
);

const rootDirectorySummary = {
  id: rootDirectoryId,
  visibility: 1,
  name: "Tous les albums",
  coverPhotoId: null,
  numberOfPhotos: totalPhotos,
  numberOfSubDirectories: 1,
};

const childDirectorySummary = {
  id: childDirectoryId,
  visibility: 1,
  name: childAlbumName,
  coverPhotoId: null,
  numberOfPhotos: childDirectoryPhotos.length,
  numberOfSubDirectories: 0,
};

const mockRootDirectoryFull = {
  ...rootDirectorySummary,
  parent: null,
  minDate: mockPhotos[0]!.dateTime,
  maxDate: mockPhotos[mockPhotos.length - 1]!.dateTime,
};

const mockChildDirectoryFull = {
  ...childDirectorySummary,
  parent: rootDirectorySummary,
  minDate: childDirectoryPhotos[0]!.dateTime,
  maxDate: childDirectoryPhotos[childDirectoryPhotos.length - 1]!.dateTime,
};

const mockDirectories = {
  infoById: {
    [rootDirectoryId]: mockRootDirectoryFull,
    [childDirectoryId]: mockChildDirectoryFull,
  },
  subDirectoriesById: {
    [rootDirectoryId]: [childDirectorySummary],
    [childDirectoryId]: [],
  },
  photosByDirectoryId: {
    [rootDirectoryId]: mockPhotos,
    [childDirectoryId]: childDirectoryPhotos,
  },
};

test.describe("Gallery page", () => {
  test.beforeEach(async ({ page }) => {
    const photoDetailsById = {
      ...galleryPhotoDetailsById,
      ...childPhotoDetailsById,
    };
    await registerApiMocks(page, {
      galleryId,
      user: mockUser,
      galleries: mockGalleries,
      gallery: mockGalleryFull,
      galleryPhotos: mockPhotos,
      members: mockMembers,
      visibilities: mockVisibilities,
      photoDetailsById,
      directories: mockDirectories,
    });
  });

  test("renders gallery overview", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    await expect(
      page.getByPlaceholder("Rechercher dans vos photos")
    ).toBeVisible();

    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();
  });

  test("navigates to search results", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    const searchInput = page.getByPlaceholder("Rechercher dans vos photos");
    await searchInput.fill("montagne");
    await searchInput.press("Enter");

    await page.waitForURL(`**/gallery/${galleryId}/search?query=montagne`);
  });

  test("restores scroll position after closing a photo", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for photos to be fully loaded
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();
    
    // Wait a bit for any animations/transitions to complete
    await page.waitForTimeout(300);

    const targetIndex = 24;
    const targetPhoto = mockPhotos[targetIndex]!;
    const targetLocator = page.locator(`a[href*="/photos/${targetPhoto.id}"]`);

    await targetLocator.scrollIntoViewIfNeeded();
    await expect(targetLocator).toBeVisible();
    
    // Wait for scroll to stabilize
    await page.waitForTimeout(200);

    const scrollBefore = await getScrollContainerInfo(targetLocator);
    expect(scrollBefore.scrollTop).toBeGreaterThan(0);

    await targetLocator.click();

    const backButton = page.getByRole("button", {
      name: "Retour à la galerie",
    });
    await expect(backButton).toBeVisible();

    await backButton.click();
    await expect(backButton).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`/gallery/${galleryId}(\\?.*)?$`));

    await expect(targetLocator).toBeVisible();
    
    // Wait for scroll position to stabilize after restoration
    // The scroll restoration uses requestAnimationFrame and may need time to complete
    await page.waitForTimeout(1000);

    const scrollAfter = await getScrollContainerInfo(targetLocator);

    expect(scrollAfter.tagName).toBe(scrollBefore.tagName);
    if (scrollBefore.id || scrollAfter.id) {
      expect(scrollAfter.id).toBe(scrollBefore.id);
    }

    const scrollDelta = Math.abs(
      scrollAfter.scrollTop - scrollBefore.scrollTop
    );
    expect(scrollDelta).toBeLessThanOrEqual(5);
  });

  test.skip("keeps child album context after closing a photo", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    const drawerToggle = page
      .getByRole("button", { name: /drawer|menu|navigation/i })
      .first();
    if (await drawerToggle.isVisible()) {
      await drawerToggle.click();
    }

    const albumLinks = page.getByRole("link", { name: /Album/ });
    const albumButtons = page.getByRole("button", { name: /Album/ });
    const albumText = page.getByText("Albums", { exact: true });

    let albumsEntry;
    if ((await albumLinks.count()) > 0) {
      albumsEntry = albumLinks.first();
    } else if ((await albumButtons.count()) > 0) {
      albumsEntry = albumButtons.first();
    } else {
      albumsEntry = albumText.first();
    }

    await expect(albumsEntry).toBeVisible();
    await albumsEntry.click();

    await page.waitForURL(`**/gallery/${galleryId}/directory`);

    // Wait a bit for the directory page to render
    await page.waitForTimeout(1000);

    const childAlbumLink = page
      .locator(`a[href*="/directory/${childDirectoryId}"]`)
      .first();
    await expect(childAlbumLink).toBeVisible({ timeout: 15000 });
    await childAlbumLink.click();

    await page.waitForURL(
      new RegExp(`/gallery/${galleryId}/directory/${childDirectoryId}(\\?.*)?$`)
    );

    await page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(`/api/directories/${childDirectoryId}/photos`) &&
        response.request().method() === "GET"
    );

    const firstPhotoId = childDirectoryPhotos[0]!.id;

    const firstPhotoLink = page
      .locator(
        `a[href*="/directory/${childDirectoryId}/photos/${firstPhotoId}"]`
      )
      .last();
    await expect(firstPhotoLink).toBeVisible();
    await firstPhotoLink.click();

    await page.waitForURL(
      `**/gallery/${galleryId}/directory/${childDirectoryId}/photos/${firstPhotoId}?order=date-asc`
    );

    const closeButton = page.getByRole("button", {
      name: "Retour à la galerie",
    });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(page).toHaveURL(
      new RegExp(`/gallery/${galleryId}/directory/${childDirectoryId}(\\?.*)?$`)
    );
  });
});
