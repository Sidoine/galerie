import React from "react";
import { DirectoryView } from "@/components/directory-view";
import { useLocalSearchParams } from "expo-router";

function DirectoryPage() {
  const { directoryId } = useLocalSearchParams<{ directoryId: string }>();
  return <DirectoryView id={Number(directoryId)} />;
}

export default DirectoryPage;
