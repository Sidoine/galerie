import { List, ListItemButton, Collapse, ListItemText } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useLocation, Link } from "react-router";
import { ExpandLess, ExpandMore, Settings } from "@mui/icons-material";
import { useDirectoriesStore } from "../stores/directories";
import { useUsersStore } from "../stores/users";
import { useState } from "react";

function Menu() {
    const directoriesStore = useDirectoriesStore();
    const usersStore = useUsersStore();
    const location = useLocation();
    const [settingsOpen, setSettingsOpen] = useState(false);
    
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
                <>
                    <ListItemButton onClick={() => setSettingsOpen(!settingsOpen)}>
                        <Settings sx={{ mr: 1 }} />
                        <ListItemText primary="Settings" />
                        {settingsOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            <ListItemButton
                                sx={{ pl: 4 }}
                                component={Link}
                                to={`/g/${directoriesStore.galleryId}/settings/visibility`}
                                selected={location.pathname.includes("/settings/visibility")}
                            >
                                Directory Visibility
                            </ListItemButton>
                        </List>
                    </Collapse>
                    <ListItemButton
                        selected={location.pathname === "/users"}
                        component={Link}
                        to={`/users`}
                    >
                        Utilisateurs
                    </ListItemButton>
                </>
            )}
        </List>
    );
}

export default observer(Menu);
