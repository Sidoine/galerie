import React from "react";
import { observer } from "mobx-react-lite";
import { DirectoryView } from "@/components/directory-view";
import { useDirectoryStore } from "@/stores/directory";

function DirectoriesScreen() {
  const directoryStore = useDirectoryStore();
  return <DirectoryView store={directoryStore} />;
}

export default observer(DirectoriesScreen);
