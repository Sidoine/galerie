import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useApiClient } from "folke-service-helpers";
import { FaceController } from "../services/face";
import { FaceName } from "../services/views";
import { useParams, Link } from "react-router";
import {
    Box,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Typography,
} from "@mui/material";

const FaceNames = observer(function FaceNames() {
    const { galleryId } = useParams();
    const apiClient = useApiClient();
    const [names, setNames] = useState<FaceName[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!galleryId) return;
        const controller = new FaceController(apiClient);
        setLoading(true);
        controller
            .getNames(Number(galleryId))
            .then((resp) => {
                if (!resp.ok) {
                    setError(resp.message || "Erreur inconnue");
                    return;
                }
                setNames(resp.value);
                setError(null);
            })
            .catch((e) => {
                console.error(e);
                setError("Erreur lors du chargement des noms de visages");
            })
            .finally(() => setLoading(false));
    }, [apiClient, galleryId]);

    if (loading && !names) return <CircularProgress />;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Noms des visages
            </Typography>
            {!names && <Typography>Aucun nom trouvé.</Typography>}
            {names && names.length === 0 && (
                <Typography>Aucun nom trouvé.</Typography>
            )}
            {names && names.length > 0 && (
                <List>
                    {names.map((n) => (
                        <ListItem
                            key={n.id}
                            disableGutters
                            component={Link}
                            to={`/g/${galleryId}/face-names/${n.id}`}
                            sx={{ textDecoration: "none", color: "inherit" }}
                        >
                            <ListItemText primary={n.name} />
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
});

export default FaceNames;
