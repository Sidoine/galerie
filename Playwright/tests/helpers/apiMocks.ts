const JSON_HEADERS = { "content-type": "application/json" };

function respond(route, body, status = 200) {
  route.fulfill({ status, headers: JSON_HEADERS, body: JSON.stringify(body) });
}

function respondText(route, body, status = 200) {
  route.fulfill({ status, headers: JSON_HEADERS, body });
}

export async function registerApiMocks(page, config) {
  const {
    galleryId,
    user,
    galleries = [],
    gallery,
    galleryPhotos = [],
    members = [],
    visibilities = [],
    places = {},
    photoDetailsById = {},
  } = config;

  await page.addInitScript(() => {
    window.localStorage.setItem(
      "authToken",
      JSON.stringify({ tokenType: "cookie" })
    );
  });

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;

    if (method === "GET" && pathname === "/api/me/me") {
      return respond(route, user ?? null);
    }

    if (method === "GET" && pathname === "/api/me/galleries") {
      return respond(route, galleries);
    }

    if (method === "GET" && pathname === `/api/galleries/${galleryId}`) {
      return respond(route, gallery ?? null);
    }

    if (
      method === "GET" &&
      pathname === `/api/galleries/${galleryId}/members`
    ) {
      return respond(route, members);
    }

    if (
      method === "GET" &&
      pathname === `/api/galleries/${galleryId}/directory-visibilities/`
    ) {
      return respond(route, visibilities);
    }

    if (
      method === "GET" &&
      pathname.startsWith(`/api/galleries/${galleryId}/photos`)
    ) {
      const offset = Number(searchParams.get("offset") ?? "0");
      const count = Number(searchParams.get("count") ?? galleryPhotos.length);
      const slice = galleryPhotos.slice(offset, offset + count);
      return respond(route, slice);
    }

    if (
      method === "GET" &&
      pathname === `/api/places/gallery/${galleryId}/countries`
    ) {
      return respond(route, places.countries ?? []);
    }

    const countryMatch = pathname.match(
      /^\/api\/places\/gallery\/(\d+)\/countries\/(\d+)\/cities$/
    );
    if (method === "GET" && countryMatch) {
      const countryId = Number(countryMatch[2]);
      const cities = places.citiesByCountry?.[countryId] ?? [];
      return respond(route, cities);
    }

    const placeMatch = pathname.match(/^\/api\/places\/(\d+)$/);
    if (method === "GET" && placeMatch) {
      const placeId = Number(placeMatch[1]);
      const place = places.placesById?.[placeId] ?? null;
      return respond(route, place);
    }

    const placePhotosMatch = pathname.match(/^\/api\/places\/(\d+)\/photos$/);
    if (method === "GET" && placePhotosMatch) {
      const placeId = Number(placePhotosMatch[1]);
      const key = placeId;
      const store = places.placePhotos ?? {};
      const photos = store[key] ?? [];
      const offset = Number(searchParams.get("offset") ?? "0");
      const count = Number(searchParams.get("count") ?? photos.length);
      const slice = photos.slice(offset, offset + count);
      return respond(route, slice);
    }

    const placePhotoCountMatch = pathname.match(
      /^\/api\/places\/(\d+)\/photos\/count$/
    );
    if (method === "GET" && placePhotoCountMatch) {
      const placeId = Number(placePhotoCountMatch[1]);
      const counts = places.photoCount ?? {};
      const value =
        counts[placeId] ?? places.placePhotos?.[placeId]?.length ?? 0;
      return respond(route, value);
    }

    const placeYearsMatch = pathname.match(/^\/api\/places\/(\d+)\/years$/);
    if (method === "GET" && placeYearsMatch) {
      const placeId = Number(placeYearsMatch[1]);
      const years = places.yearsByPlace?.[placeId] ?? [];
      return respond(route, years);
    }

    const placeYearMatch = pathname.match(
      /^\/api\/places\/(\d+)\/years\/(\d+)$/
    );
    if (method === "GET" && placeYearMatch) {
      const placeId = Number(placeYearMatch[1]);
      const year = Number(placeYearMatch[2]);
      const key = `${placeId}-${year}`;
      const yearEntry = places.placeYear?.[key] ?? null;
      return respond(route, yearEntry);
    }

    const placeMonthsMatch = pathname.match(
      /^\/api\/places\/(\d+)\/years\/(\d+)\/monthes$/
    );
    if (method === "GET" && placeMonthsMatch) {
      const placeId = Number(placeMonthsMatch[1]);
      const year = Number(placeMonthsMatch[2]);
      const key = `${placeId}-${year}`;
      const months = places.monthsByPlaceYear?.[key] ?? [];
      return respond(route, months);
    }

    const photoDetailsMatch = pathname.match(/^\/api\/photos\/(\d+)$/);
    if (method === "GET" && photoDetailsMatch) {
      const photoId = Number(photoDetailsMatch[1]);
      const photoDetails =
        photoDetailsById?.[photoId] ?? photoDetailsById?.get?.(photoId) ?? null;
      return respond(route, photoDetails);
    }

    const placeMonthMatch = pathname.match(
      /^\/api\/places\/(\d+)\/years\/(\d+)\/months\/(\d+)$/
    );
    if (method === "GET" && placeMonthMatch) {
      const placeId = Number(placeMonthMatch[1]);
      const year = Number(placeMonthMatch[2]);
      const month = Number(placeMonthMatch[3]);
      const key = `${placeId}-${year}-${month}`;
      const entry = places.placeMonth?.[key] ?? null;
      return respond(route, entry);
    }

    if (method === "POST" && pathname.startsWith("/api/")) {
      return respondText(route, "", 200);
    }

    return respondText(route, "null", 200);
  });
}
