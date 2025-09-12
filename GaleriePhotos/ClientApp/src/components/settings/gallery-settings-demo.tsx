import { useState } from "react";
import {
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { Save } from "@mui/icons-material";

// Mock enum for demo
const DataProviderType = {
    FileSystem: 0,
    Seafile: 1
};

const GallerySettingsDemo = () => {
    // Form state with sample data
    const [name, setName] = useState("My Gallery");
    const [rootDirectory, setRootDirectory] = useState("/photos");
    const [thumbnailsDirectory, setThumbnailsDirectory] = useState("/thumbnails");
    const [dataProvider, setDataProvider] = useState(DataProviderType.FileSystem);
    const [seafileServerUrl, setSeafileServerUrl] = useState("");
    const [seafileApiKey, setSeafileApiKey] = useState("");

    const handleSave = () => {
        console.log("Save clicked");
    };

    return (
        <Container maxWidth="md">
            <Typography variant="h4" component="h1" gutterBottom>
                Paramètres de la galerie
            </Typography>

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
                            onChange={(e) => setDataProvider(e.target.value)}
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
                        </>
                    )}

                    {dataProvider === DataProviderType.Seafile && (
                        <>
                            <TextField
                                label="URL du serveur Seafile"
                                value={seafileServerUrl}
                                onChange={(e) => setSeafileServerUrl(e.target.value)}
                                fullWidth
                                required
                                variant="outlined"
                                helperText="URL complète du serveur Seafile (ex: https://cloud.example.com)"
                                placeholder="https://cloud.example.com"
                            />

                            <TextField
                                label="Clé API Seafile"
                                value={seafileApiKey}
                                onChange={(e) => setSeafileApiKey(e.target.value)}
                                fullWidth
                                required
                                variant="outlined"
                                type="password"
                                helperText="Clé API générée dans votre profil Seafile"
                            />

                            <TextField
                                label="ID de la bibliothèque Seafile"
                                value={rootDirectory}
                                onChange={(e) => setRootDirectory(e.target.value)}
                                fullWidth
                                required
                                variant="outlined"
                                helperText="ID de la bibliothèque Seafile où sont stockées les photos"
                            />

                            <TextField
                                label="Chemin des miniatures"
                                value={thumbnailsDirectory}
                                onChange={(e) => setThumbnailsDirectory(e.target.value)}
                                fullWidth
                                variant="outlined"
                                helperText="Chemin vers le dossier des miniatures dans la bibliothèque (optionnel)"
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
                            startIcon={<Save />}
                        >
                            Enregistrer
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default GallerySettingsDemo;