import BreadCrumbs from "@/components/bread-crumbs";
import { Stack, useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";

const Header = observer(function Header() {
  const { directoryId } = useLocalSearchParams<{ directoryId: string }>();
  return <BreadCrumbs directoryId={Number(directoryId)} />;
});

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerTitle: () => <Header /> }} />
    </Stack>
  );
}
