import { List, ListItemButton, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router";
import { useGalleriesStore } from "../stores/galleries";
import { useEffect } from "react";

const GalleryChooser = observer(function GalleryChooser() {
    const galleriesStore = useGalleriesStore();
    const navigate = useNavigate();
    if (!galleriesStore.memberships && !galleriesStore.loading) {
        galleriesStore.load();
    }
    const memberships = galleriesStore.memberships;
    useEffect(() => {
        if (memberships && memberships.length === 1) {
            const galleryId = memberships[0].galleryId;
            navigate(`/g/${galleryId}`, { replace: true });
        }
    }, [memberships, navigate]);
    if (!memberships) return <>Chargement...</>;
    return (
        <List>
            {memberships.map((m) => (
                <ListItemButton
                    key={m.galleryId}
                    onClick={() => {
                        navigate(`/g/${m.galleryId}`);
                    }}
                >
                    {m.galleryName}
                </ListItemButton>
            ))}
            {memberships.length === 0 && (
                <Typography variant="body1">
                    Vous n'êtes membre d'aucune galerie. Demandez à en rejoindre
                    une ou demandez à l'administrateur de créer une nouvelle
                    galerie.
                </Typography>
            )}
        </List>
    );
});

export default GalleryChooser;
