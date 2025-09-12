import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { useDirectoriesStore } from "../../stores/directories";
import { GalleryController } from "../../services/gallery";
import { useApiClient } from "folke-service-helpers";
import { Gallery, GalleryPatch } from "../../services/views";

const GallerySettings = observer(() => {
    const directoriesStore = useDirectoriesStore();
    const apiClient = useApiClient();
    const galleryController = new GalleryController(apiClient);
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [gallery, setGallery] = useState<Gallery | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [rootDirectory, setRootDirectory] = useState("");
    const [thumbnailsDirectory, setThumbnailsDirectory] = useState("");

    useEffect(() => {
        if (directoriesStore.galleryId) {
            loadGallery();
        }
    }, [directoriesStore.galleryId]);

    const loadGallery = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await galleryController.getById(directoriesStore.galleryId);
            setGallery(result);
            setName(result.name);
            setRootDirectory(result.rootDirectory);
            setThumbnailsDirectory(result.thumbnailsDirectory || "");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load gallery");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!gallery) return;

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const patchData: GalleryPatch = {
                name: name !== gallery.name ? name : null,
                rootDirectory: rootDirectory !== gallery.rootDirectory ? rootDirectory : null,
                thumbnailsDirectory: thumbnailsDirectory !== (gallery.thumbnailsDirectory || "") ? thumbnailsDirectory || null : null,
            };

            // Only send patch if there are actual changes
            if (patchData.name !== null || patchData.rootDirectory !== null || patchData.thumbnailsDirectory !== null) {
                const result = await galleryController.update(gallery.id, patchData);
                setGallery(result);
                setSuccess(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save gallery");
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = gallery && (
        name !== gallery.name ||
        rootDirectory !== gallery.rootDirectory ||
        thumbnailsDirectory !== (gallery.thumbnailsDirectory || "")
    );

    if (loading) {
        return (
            <Container maxWidth="md">
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (!gallery) {
        return (
            <Container maxWidth="md">
                <Alert severity="error">Gallery not found</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Typography variant="h4" component="h1" gutterBottom>
                Paramètres de la galerie
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Galerie mise à jour avec succès
                </Alert>
            )}

            <Paper elevation={2} sx={{ p: 3 }}>
                <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <TextField
                        label="Nom de la galerie"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        required
                        variant="outlined"
                    />

                    <TextField
                        label="Répertoire racine"
                        value={rootDirectory}
                        onChange={(e) => setRootDirectory(e.target.value)}
                        fullWidth
                        required
                        variant="outlined"
                        helperText="Chemin vers le répertoire contenant les photos"
                    />

                    <TextField
                        label="Répertoire des miniatures"
                        value={thumbnailsDirectory}
                        onChange={(e) => setThumbnailsDirectory(e.target.value)}
                        fullWidth
                        variant="outlined"
                        helperText="Chemin vers le répertoire des miniatures (optionnel)"
                    />

                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                        >
                            {saving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
});

export default GallerySettings;