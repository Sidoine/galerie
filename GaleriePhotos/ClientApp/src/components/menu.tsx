import { List, ListItemButton, Collapse, ListItemText } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useLocation, Link } from "react-router";
import { ExpandLess, ExpandMore, Settings } from "@mui/icons-material";
import { useDirectoriesStore } from "../stores/directories";
import { useUsersStore } from "../stores/users";
import { useState } from "react";
import { useMembersStore } from "../stores/members";

function Menu() {
    const directoriesStore = useDirectoriesStore();
    const usersStore = useUsersStore();
    const membersStore = useMembersStore();
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

            {membersStore.administrator && (
                <>
                    <ListItemButton
                        onClick={() => setSettingsOpen(!settingsOpen)}
                    >
                        <Settings sx={{ mr: 1 }} />
                        <ListItemText primary="Paramètres" />
                        {settingsOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            <ListItemButton
                                sx={{ pl: 4 }}
                                component={Link}
                                to={`/g/${directoriesStore.galleryId}/settings/gallery`}
                                selected={location.pathname.includes(
                                    "/settings/gallery"
                                )}
                            >
                                Galerie
                            </ListItemButton>
                            <ListItemButton
                                sx={{ pl: 4 }}
                                component={Link}
                                to={`/g/${directoriesStore.galleryId}/settings/visibility`}
                                selected={location.pathname.includes(
                                    "/settings/visibility"
                                )}
                            >
                                Visibilité du répertoire
                            </ListItemButton>
                            <ListItemButton
                                sx={{ pl: 4 }}
                                component={Link}
                                to={`/g/${directoriesStore.galleryId}/settings/members`}
                                selected={location.pathname.includes(
                                    "/settings/members"
                                )}
                            >
                                Membres
                            </ListItemButton>
                        </List>
                    </Collapse>
                </>
            )}

            {usersStore.administrator && (
                <>
                    <ListItemButton
                        selected={location.pathname === "/settings/users"}
                        component={Link}
                        to={`/settings/users`}
                    >
                        Paramètres globaux
                    </ListItemButton>
                </>
            )}
        </List>
    );
}

export default observer(Menu);
