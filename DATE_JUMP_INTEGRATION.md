# Date Jump Feature Integration Guide

This document explains how to integrate the DateJumpList component into photo grid screens.

## Backend Implementation

The backend now supports:

1. **DateJumps in FullViewModels**: All `FullViewModel` types (GalleryFullViewModel, PlaceFullViewModel, DirectoryFullViewModel, etc.) now include a `DateJumps` property that contains a list of date jump points.

2. **Date-based filtering**: All photo endpoints now accept an optional `startDate` parameter that filters photos starting from that date.

3. **Negative offset support**: Photo endpoints support negative offsets, which means you can load photos backwards from a starting point by passing negative values for the `offset` parameter.

## Frontend Implementation

### PaginatedPhotosStore

The `PaginatedPhotosStore` has been updated with:

- `jumpToDate(date: string)`: Jump to a specific date and reload photos from that point
- `loadMoreBefore()`: Load photos before the current set (backward pagination)
- `hasMoreBefore`: Boolean flag indicating if more photos are available before the current set

### DateJumpList Component

A new `DateJumpList` component has been created at `components/date-jump-list.tsx` that displays a list of date jumps on the right side of the screen.

## Integration Example

Here's how to integrate the DateJumpList into a photo grid screen:

```tsx
import React, { useState, useCallback } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { DateJumpList } from "@/components/date-jump-list";
import { usePhotoContainerStore } from "@/stores/photo-container";

export const PhotoGridScreen = observer(function PhotoGridScreen() {
  const store = usePhotoContainerStore();
  const [showDateJumps, setShowDateJumps] = useState(false);
  
  // Get date jumps from the container
  const dateJumps = store.container?.dateJumps || [];
  
  // Handle date jump
  const handleJumpToDate = useCallback((date: string) => {
    store.paginatedPhotosStore.jumpToDate(date);
  }, [store]);
  
  // Show date jumps when scrolling
  const handleScroll = useCallback((event) => {
    const { contentOffset } = event.nativeEvent;
    setShowDateJumps(contentOffset.y > 100);
  }, []);
  
  return (
    <View style={{ flex: 1 }}>
      {/* Your existing photo grid component */}
      <FlashList
        data={/* your data */}
        renderItem={/* your render function */}
        onScroll={handleScroll}
      />
      
      {/* Date jump list overlay */}
      <DateJumpList
        dateJumps={dateJumps}
        onJumpToDate={handleJumpToDate}
        visible={showDateJumps}
      />
    </View>
  );
});
```

## API Examples

### Fetching photos from a specific date

```typescript
// Load photos starting from June 1, 2024
const photos = await galleryController.getPhotos(
  galleryId,
  "desc",
  0,
  25,
  "2024-06-01T00:00:00Z"
);
```

### Loading photos backwards

```typescript
// Load 25 photos before the current position
const photos = await galleryController.getPhotos(
  galleryId,
  "desc",
  -25,  // Negative offset
  25,
  "2024-06-01T00:00:00Z"
);
```

## Testing

Tests have been added for the DateJumpHelper to verify:
- Empty list for date ranges < 2 months
- Year-based jumps for ranges > 24 months
- Month-based jumps for ranges between 2 and 24 months
- Proper ordering and deduplication

All tests pass successfully.

## Next Steps

To complete the integration:

1. **Add UI controls**: Add a button or gesture to show/hide the date jump list
2. **Improve UX**: Add animations when jumping to dates
3. **Handle edge cases**: Consider what happens when jumping to a date with no photos
4. **Optimize loading**: Implement smart preloading when near date boundaries
5. **Add visual feedback**: Show which date range is currently visible
