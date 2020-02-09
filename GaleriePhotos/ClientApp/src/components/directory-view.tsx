import React from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { useStores } from "../stores";
import { ListItem, ListItemText, List } from "@material-ui/core";
import { ImagesView } from "./images-view";

export interface DirectoryViewProps {
  path: string | null;
}

export const DirectoryView = observer(({ path }: DirectoryViewProps) => {
  const { directoriesStore } = useStores();
  const directories = directoriesStore.loader.getValue(path);

  if (!directories) return <div>Loading directory {path}</div>;
  return (
    <>
      <List>
        {directories.map(x => (
          <ListItem
            button
            component={Link}
            key={x.path}
            to={`directory/${x.path}`}
          >
            <ListItemText>{x.name}</ListItemText>
          </ListItem>
        ))}
      </List>
      <ImagesView path={path} />
    </>
  );
});
