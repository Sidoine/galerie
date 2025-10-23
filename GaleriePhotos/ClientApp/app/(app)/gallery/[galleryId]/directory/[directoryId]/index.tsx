import React from "react";
import { DirectoryView } from "@/components/container-view/directory-view";
import { useDirectoryStore } from "@/stores/directory";

function DirectoryScreen() {
  return <DirectoryView store={useDirectoryStore()} />;
}

export default DirectoryScreen;
