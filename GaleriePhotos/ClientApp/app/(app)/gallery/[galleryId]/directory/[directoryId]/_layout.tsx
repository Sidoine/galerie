import BreadCrumbs from "@/components/bread-crumbs";
import { DirectoryStoreProvider } from "@/stores/directory";
import { Stack, useLocalSearchParams } from "expo-router";

export default function Layout() {
  const { directoryId } =
    useLocalSearchParams<"/gallery/[galleryId]/directory/[directoryId]">();
  return (
    <DirectoryStoreProvider directoryId={Number(directoryId)}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerTitle: () => <BreadCrumbs /> }}
        />
        <Stack.Screen
          name="photos"
          options={{ title: "Photos", headerShown: false }}
        />
      </Stack>
    </DirectoryStoreProvider>
  );
}
