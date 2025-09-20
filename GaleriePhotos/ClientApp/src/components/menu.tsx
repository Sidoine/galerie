import { List, ListItemButton, Collapse, ListItemText } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useLocation, Link } from "react-router";
import { ExpandLess, ExpandMore, Settings } from "@mui/icons-material";
import { useDirectoriesStore } from "../stores/directories";
import { useState } from "react";
import { useMembersStore } from "../stores/members";
import { useMeStore } from "../stores/me";

function Menu() {
    const directoriesStore = useDirectoriesStore();
    const meStore = useMeStore();
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
            <ListItemButton
                component={Link}
                to={`/g/${directoriesStore.galleryId}/face-names`}
                selected={location.pathname.includes("/face-names")}
            >
                Noms des visages
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

            {meStore.administrator && (
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
