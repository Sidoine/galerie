import { useState, useEffect, useMemo } from "react";
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { useDirectoriesStore } from "../../stores/directories";
import { GalleryController } from "../../services/gallery";
import { useApiClient } from "folke-service-helpers";
import { Gallery, GalleryPatch } from "../../services/views";
import { DataProviderType } from "../../services/enums";

const GallerySettings = observer(() => {
    const directoriesStore = useDirectoriesStore();
    const apiClient = useApiClient();
    const galleryController = useMemo(
        () => new GalleryController(apiClient),
        [apiClient]
    );

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [gallery, setGallery] = useState<Gallery | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [rootDirectory, setRootDirectory] = useState("");
    const [thumbnailsDirectory, setThumbnailsDirectory] = useState("");
    const [dataProvider, setDataProvider] = useState<DataProviderType>(
        DataProviderType.FileSystem
    );
    const [seafileServerUrl, setSeafileServerUrl] = useState("");
    const [seafileApiKey, setSeafileApiKey] = useState("");

    const loadGallery = useMemo(
        () => async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await galleryController.getById(
                    directoriesStore.galleryId
                );
                if (result.ok) {
                    setGallery(result.value);
                    setName(result.value.name);
                    setRootDirectory(result.value.rootDirectory);
                    setThumbnailsDirectory(
                        result.value.thumbnailsDirectory || ""
                    );
                    setDataProvider(result.value.dataProvider);
                    setSeafileServerUrl(result.value.seafileServerUrl || "");
                    setSeafileApiKey(result.value.seafileApiKey || "");
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load gallery"
                );
            } finally {
                setLoading(false);
            }
        },
        [directoriesStore.galleryId, galleryController]
    );

    useEffect(() => {
        if (directoriesStore.galleryId) {
            loadGallery();
        }
    }, [directoriesStore.galleryId, loadGallery]);

    const handleSave = async () => {
        if (!gallery) return;

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const patchData: GalleryPatch = {
                name: name !== gallery.name ? name : null,
                rootDirectory:
                    rootDirectory !== gallery.rootDirectory
                        ? rootDirectory
                        : null,
                thumbnailsDirectory:
                    thumbnailsDirectory !== (gallery.thumbnailsDirectory || "")
                        ? thumbnailsDirectory || null
                        : null,
                dataProvider:
                    dataProvider !== gallery.dataProvider ? dataProvider : null,
                seafileServerUrl:
                    seafileServerUrl !== (gallery.seafileServerUrl || "")
                        ? seafileServerUrl || null
                        : null,
                seafileApiKey:
                    seafileApiKey !== (gallery.seafileApiKey || "")
                        ? seafileApiKey || null
                        : null,
            };

            // Only send patch if there are actual changes
            if (
                patchData.name !== null ||
                patchData.rootDirectory !== null ||
                patchData.thumbnailsDirectory !== null ||
                patchData.dataProvider !== null ||
                patchData.seafileServerUrl !== null ||
                patchData.seafileApiKey !== null
            ) {
                const result = await galleryController.update(
                    gallery.id,
                    patchData
                );
                if (result.ok) {
                    setGallery(result.value);
                    setSuccess(true);
                }
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to save gallery"
            );
        } finally {
            setSaving(false);
        }
    };

    const hasChanges =
        gallery &&
        (name !== gallery.name ||
            rootDirectory !== gallery.rootDirectory ||
            thumbnailsDirectory !== (gallery.thumbnailsDirectory || "") ||
            dataProvider !== gallery.dataProvider ||
            seafileServerUrl !== (gallery.seafileServerUrl || "") ||
            seafileApiKey !== (gallery.seafileApiKey || ""));

    if (loading) {
        return (
            <Container maxWidth="md">
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="200px"
                >
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
                <Box
                    component="form"
                    sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
                    <TextField
                        label="Nom de la galerie"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        required
                        variant="outlined"
                    />

                    <FormControl fullWidth variant="outlined">
                        <InputLabel>Type de stockage</InputLabel>
                        <Select
                            value={dataProvider}
                            onChange={(e) =>
                                setDataProvider(
                                    e.target.value as DataProviderType
                                )
                            }
                            label="Type de stockage"
                        >
                            <MenuItem value={DataProviderType.FileSystem}>
                                Système de fichiers local
                            </MenuItem>
                            <MenuItem value={DataProviderType.Seafile}>
                                Seafile
                            </MenuItem>
                        </Select>
                    </FormControl>

                    {dataProvider === DataProviderType.FileSystem && (
                        <>
                            <TextField
                                label="Répertoire racine"
                                value={rootDirectory}
                                onChange={(e) =>
                                    setRootDirectory(e.target.value)
                                }
                                fullWidth
                                required
                                variant="outlined"
                                helperText="Chemin vers le répertoire contenant les photos"
                            />

                            <TextField
                                label="Répertoire des miniatures"
                                value={thumbnailsDirectory}
                                onChange={(e) =>
                                    setThumbnailsDirectory(e.target.value)
                                }
                                fullWidth
                                variant="outlined"
                                helperText="Chemin vers le répertoire des miniatures (optionnel)"
                            />
                        </>
                    )}

                    {dataProvider === DataProviderType.Seafile && (
                        <>
                            <TextField
                                label="URL du serveur Seafile"
                                value={seafileServerUrl}
                                onChange={(e) =>
                                    setSeafileServerUrl(e.target.value)
                                }
                                fullWidth
                                required
                                variant="outlined"
                                helperText="URL complète du serveur Seafile (ex: https://cloud.example.com)"
                                placeholder="https://cloud.example.com"
                            />

                            <TextField
                                label="Clé API Seafile"
                                value={seafileApiKey}
                                onChange={(e) =>
                                    setSeafileApiKey(e.target.value)
                                }
                                fullWidth
                                required
                                variant="outlined"
                                type="password"
                                helperText="Clé API générée dans votre profil Seafile"
                            />

                            <TextField
                                label="ID de la bibliothèque Seafile"
                                value={rootDirectory}
                                onChange={(e) =>
                                    setRootDirectory(e.target.value)
                                }
                                fullWidth
                                required
                                variant="outlined"
                                helperText="ID de la bibliothèque Seafile où sont stockées les photos"
                            />

                            <TextField
                                label="Chemin des miniatures"
                                value={thumbnailsDirectory}
                                onChange={(e) =>
                                    setThumbnailsDirectory(e.target.value)
                                }
                                fullWidth
                                required
                                variant="outlined"
                                helperText="ID de la bibliothèque Seafile où sont stockées les miniatures"
                            />
                        </>
                    )}

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 2,
                        }}
                    >
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            startIcon={
                                saving ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    <Save />
                                )
                            }
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
