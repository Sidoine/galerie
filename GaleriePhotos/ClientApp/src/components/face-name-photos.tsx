import { Box, CircularProgress, ImageList, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useApiClient } from "folke-service-helpers";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { FaceController } from "../services/face";
import { Photo } from "../services/views";
import ImageCard from "./image-card";

/**
 * Page affichant toutes les photos liées à un FaceName donné.
 * URL attendue: /g/:galleryId/face-names/:faceNameId
 */
const FaceNamePhotos = observer(function FaceNamePhotos() {
    const { galleryId, faceNameId } = useParams();
    const apiClient = useApiClient();
    const [photos, setPhotos] = useState<Photo[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!galleryId || !faceNameId) return;
        const controller = new FaceController(apiClient);
        setLoading(true);
        controller
            .getPhotosByFaceName(Number(galleryId), Number(faceNameId))
            .then((resp) => {
                if (!resp.ok) {
                    setError(resp.message || "Erreur de chargement");
                    return;
                }
                setPhotos(resp.value);
                setError(null);
            })
            .catch((e) => {
                console.error(e);
                setError("Erreur de chargement");
            })
            .finally(() => setLoading(false));
    }, [apiClient, galleryId, faceNameId]);

    if (loading && !photos) return <CircularProgress />;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Photos associées au visage
            </Typography>
            {!photos && <Typography>Aucune photo.</Typography>}
            {photos && photos.length === 0 && (
                <Typography>Aucune photo pour ce nom.</Typography>
            )}
            {photos && photos.length > 0 && (
                <ImageList variant="masonry" cols={5} gap={8}>
                    {photos.map((p) => (
                        <ImageCard key={p.id} value={p} />
                    ))}
                </ImageList>
            )}
        </Box>
    );
});

export default FaceNamePhotos;
