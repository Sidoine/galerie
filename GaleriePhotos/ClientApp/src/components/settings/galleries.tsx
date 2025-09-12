import { useState, useEffect, useMemo } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Paper,
    Chip,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useApiClient } from "folke-service-helpers";
import { GalleryController } from "../../services/gallery";
import { UserController } from "../../services/user";
import * as views from "../../services/views";

const Galleries = observer(function Galleries() {
    const apiClient = useApiClient();
    const galleryController = useMemo(
        () => new GalleryController(apiClient),
        [apiClient]
    );
    const userController = useMemo(
        () => new UserController(apiClient),
        [apiClient]
    );

    const [galleries, setGalleries] = useState<views.Gallery[]>([]);
    const [users, setUsers] = useState<views.User[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: "",
        rootDirectory: "",
        thumbnailsDirectory: "",
        userId: "",
    });

    const loadData = useMemo(
        () => async () => {
            setLoading(true);
            try {
                const [galleriesResult, usersResult] = await Promise.all([
                    galleryController.getAll(),
                    userController.getAll(),
                ]);

                if (galleriesResult.ok) {
                    setGalleries(galleriesResult.value);
                }
                if (usersResult.ok) {
                    setUsers(usersResult.value);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        },
        [galleryController, userController]
    );

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateGallery = async () => {
        try {
            const result = await galleryController.create({
                name: createForm.name,
                rootDirectory: createForm.rootDirectory,
                thumbnailsDirectory: createForm.thumbnailsDirectory || null,
                userId: createForm.userId,
            });

            if (result.ok) {
                await loadData();
                setCreateDialogOpen(false);
                setCreateForm({
                    name: "",
                    rootDirectory: "",
                    thumbnailsDirectory: "",
                    userId: "",
                });
            }
        } catch (error) {
            console.error("Error creating gallery:", error);
        }
    };

    if (loading) {
        return <Typography>Chargement...</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                }}
            >
                <Typography variant="h4">Galeries</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setCreateDialogOpen(true)}
                >
                    Nouvelle galerie
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom</TableCell>
                            <TableCell>Répertoire racine</TableCell>
                            <TableCell>Répertoire des miniatures</TableCell>
                            <TableCell>Administrateurs</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {galleries.map((gallery) => (
                            <TableRow key={gallery.id}>
                                <TableCell>{gallery.name}</TableCell>
                                <TableCell>{gallery.rootDirectory}</TableCell>
                                <TableCell>
                                    {gallery.thumbnailsDirectory || "—"}
                                </TableCell>
                                <TableCell>
                                    {gallery.administratorNames.map((name) => (
                                        <Chip
                                            key={name}
                                            label={name}
                                            size="small"
                                            sx={{ mr: 1 }}
                                        />
                                    ))}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Créer une nouvelle galerie</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Nom"
                        fullWidth
                        margin="normal"
                        value={createForm.name}
                        onChange={(e) =>
                            setCreateForm({
                                ...createForm,
                                name: e.target.value,
                            })
                        }
                    />
                    <TextField
                        label="Répertoire racine"
                        fullWidth
                        margin="normal"
                        value={createForm.rootDirectory}
                        onChange={(e) =>
                            setCreateForm({
                                ...createForm,
                                rootDirectory: e.target.value,
                            })
                        }
                    />
                    <TextField
                        label="Répertoire des miniatures (optionnel)"
                        fullWidth
                        margin="normal"
                        value={createForm.thumbnailsDirectory}
                        onChange={(e) =>
                            setCreateForm({
                                ...createForm,
                                thumbnailsDirectory: e.target.value,
                            })
                        }
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Administrateur initial</InputLabel>
                        <Select
                            value={createForm.userId}
                            label="Administrateur initial"
                            onChange={(e) =>
                                setCreateForm({
                                    ...createForm,
                                    userId: e.target.value,
                                })
                            }
                        >
                            {users.map((user) => (
                                <MenuItem key={user.id} value={user.id}>
                                    {user.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleCreateGallery}
                        variant="contained"
                        disabled={
                            !createForm.name ||
                            !createForm.rootDirectory ||
                            !createForm.userId
                        }
                    >
                        Créer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
});

export default Galleries;
