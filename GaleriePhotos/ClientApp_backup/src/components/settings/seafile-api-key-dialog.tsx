import {
    Dialog,
    DialogTitle,
    DialogContent,
    Alert,
    TextField,
    DialogActions,
    Button,
    CircularProgress,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useDirectoriesStore } from "../../stores/directories";
import { useApiClient } from "folke-service-helpers";
import { GalleryController } from "../../services/gallery";

function SeafileApiKeyDialog({
    onClose,
    onSave,
    open,
}: {
    onClose: () => void;
    onSave: (apiKey: string) => void;
    open: boolean;
}) {
    const apiClient = useApiClient();

    const { galleryId } = useDirectoriesStore();
    const [seafileUsername, setSeafileUsername] = useState("");
    const [seafilePassword, setSeafilePassword] = useState("");
    const [fetchingApiKey, setFetchingApiKey] = useState(false);
    const [fetchApiKeyError, setFetchApiKeyError] = useState<string | null>(
        null
    );

    const handleClick = useCallback(async () => {
        setFetchingApiKey(true);
        setFetchApiKeyError(null);
        const service = new GalleryController(apiClient);
        const response = await service.getSeafileApiKey(galleryId, {
            username: seafileUsername,
            password: seafilePassword,
        });
        if (response.ok) {
            onSave(response.value.apiKey);
            onClose();
            setSeafilePassword("");
        } else {
            setFetchApiKeyError("Échec: " + response.message);
        }
        setFetchingApiKey(false);
    }, [
        apiClient,
        galleryId,
        onClose,
        onSave,
        seafilePassword,
        seafileUsername,
    ]);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Obtenir une clé API Seafile</DialogTitle>
            <DialogContent
                sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
                {fetchApiKeyError && (
                    <Alert severity="error">{fetchApiKeyError}</Alert>
                )}
                <TextField
                    label="Nom d'utilisateur"
                    value={seafileUsername}
                    onChange={(e) => setSeafileUsername(e.target.value)}
                    fullWidth
                    autoFocus
                />
                <TextField
                    label="Mot de passe"
                    value={seafilePassword}
                    onChange={(e) => setSeafilePassword(e.target.value)}
                    fullWidth
                    type="password"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button
                    variant="contained"
                    disabled={
                        fetchingApiKey || !seafileUsername || !seafilePassword
                    }
                    onClick={handleClick}
                    startIcon={
                        fetchingApiKey ? (
                            <CircularProgress size={18} />
                        ) : undefined
                    }
                >
                    {fetchingApiKey ? "Obtention..." : "Obtenir"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default SeafileApiKeyDialog;
