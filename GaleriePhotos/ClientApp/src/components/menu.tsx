import { List, ListItemButton } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useLocation, Link } from "react-router";
import { useDirectoriesStore } from "../stores/directories";
import { useUsersStore } from "../stores/users";

function Menu() {
    const directoriesStore = useDirectoriesStore();
    const usersStore = useUsersStore();
    const location = useLocation();
    return (
        <List>
            <ListItemButton
                selected={
                    location.pathname === "/" ||
                    location.pathname.startsWith("/directory")
                }
                component={Link}
                to={`/g/${directoriesStore.galleryId}`}
            >
                Galerie
            </ListItemButton>
            <ListItemButton
                component={Link}
                to={`/g/${directoriesStore.galleryId}/members`}
            >
                Membres
            </ListItemButton>
            {usersStore.isAdministrator && (
                <ListItemButton
                    selected={location.pathname === "/users"}
                    component={Link}
                    to={`/users`}
                >
                    Utilisateurs
                </ListItemButton>
            )}
        </List>
    );
}

export default observer(Menu);
