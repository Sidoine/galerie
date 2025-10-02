import BreadCrumbs from "@/components/bread-crumbs";
import { PlaceStoreProvider } from "@/stores/place";
import { Stack, useGlobalSearchParams } from "expo-router";

export default function PlacePhotosLayout() {
  const { placeId, order, year, month } = useGlobalSearchParams<{
    placeId: string;
    order?: "date-asc" | "date-desc";
    year?: string;
    month?: string;
  }>();
  return (
    <PlaceStoreProvider
      placeId={Number(placeId)}
      order={order}
      year={year ? Number(year) : undefined}
      month={month ? Number(month) : undefined}
    >
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            header: () => <BreadCrumbs />,
          }}
        />
        <Stack.Screen
          name="photos"
          options={{ header: () => <BreadCrumbs /> }}
        />
      </Stack>
    </PlaceStoreProvider>
  );
}
