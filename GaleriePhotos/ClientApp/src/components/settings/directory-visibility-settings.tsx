import React, { useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Stack,
    Alert,
    CircularProgress,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useDirectoryVisibilitiesStore } from "../../stores/directory-visibilities";
import {
    GalleryDirectoryVisibility,
    GalleryDirectoryVisibilityCreate,
    GalleryDirectoryVisibilityPatch,
} from "../../services/views";

const DirectoryVisibilitySettings = observer(() => {
    const store = useDirectoryVisibilitiesStore();
    const [editDialog, setEditDialog] = useState<{
        visibility?: GalleryDirectoryVisibility;
        open: boolean;
    }>({ open: false });
    const [deleteDialog, setDeleteDialog] = useState<{
        visibility?: GalleryDirectoryVisibility;
        open: boolean;
    }>({ open: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const visibilities = store.visibilities;

    const handleCreate = useCallback(() => {
        setEditDialog({ open: true });
    }, []);

    const handleEdit = useCallback((visibility: GalleryDirectoryVisibility) => {
        setEditDialog({ visibility, open: true });
    }, []);

    const handleDelete = useCallback(
        (visibility: GalleryDirectoryVisibility) => {
            setDeleteDialog({ visibility, open: true });
        },
        []
    );

    const handleSubmit = useCallback(
        async (
            data:
                | GalleryDirectoryVisibilityCreate
                | GalleryDirectoryVisibilityPatch
        ) => {
            setLoading(true);
            setError(null);
            try {
                if (editDialog.visibility) {
                    await store.updateVisibility(
                        editDialog.visibility.id,
                        data as GalleryDirectoryVisibilityPatch
                    );
                } else {
                    await store.createVisibility(
                        data as GalleryDirectoryVisibilityCreate
                    );
                }
                setEditDialog({ open: false });
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "An error occurred"
                );
            } finally {
                setLoading(false);
            }
        },
        [store, editDialog.visibility]
    );

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteDialog.visibility) return;
        setLoading(true);
        setError(null);
        try {
            await store.deleteVisibility(deleteDialog.visibility.id);
            setDeleteDialog({ open: false });
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [store, deleteDialog.visibility]);

    if (!visibilities.length && !loading) {
        store.visibilitiesLoader.getValue(store.galleryId);
    }

    return (
        <Container maxWidth="lg">
            <Stack spacing={3}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography variant="h4">
                        Directory Visibility Settings
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreate}
                        disabled={loading}
                    >
                        Add Visibility
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Icon</TableCell>
                                <TableCell align="center">Value</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visibilities.map((visibility) => (
                                <TableRow key={visibility.id}>
                                    <TableCell>{visibility.name}</TableCell>
                                    <TableCell>
                                        <Box
                                            component="span"
                                            dangerouslySetInnerHTML={{
                                                __html: visibility.icon,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {visibility.value}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleEdit(visibility)
                                            }
                                            disabled={loading}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleDelete(visibility)
                                            }
                                            disabled={loading}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {visibilities.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        {loading ? (
                                            <CircularProgress />
                                        ) : (
                                            "No visibility settings found"
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Stack>

            <EditVisibilityDialog
                open={editDialog.open}
                visibility={editDialog.visibility}
                onClose={() => setEditDialog({ open: false })}
                onSubmit={handleSubmit}
                loading={loading}
            />

            <DeleteConfirmDialog
                open={deleteDialog.open}
                visibility={deleteDialog.visibility}
                onClose={() => setDeleteDialog({ open: false })}
                onConfirm={handleConfirmDelete}
                loading={loading}
            />
        </Container>
    );
});

interface EditVisibilityDialogProps {
    open: boolean;
    visibility?: GalleryDirectoryVisibility;
    onClose: () => void;
    onSubmit: (
        data: GalleryDirectoryVisibilityCreate | GalleryDirectoryVisibilityPatch
    ) => void;
    loading: boolean;
}

const EditVisibilityDialog = ({
    open,
    visibility,
    onClose,
    onSubmit,
    loading,
}: EditVisibilityDialogProps) => {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("");
    const [value, setValue] = useState(1);

    React.useEffect(() => {
        if (visibility) {
            setName(visibility.name);
            setIcon(visibility.icon);
            setValue(visibility.value);
        } else {
            setName("");
            setIcon("");
            setValue(1);
        }
    }, [visibility, open]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (visibility) {
            onSubmit({ name, icon, value });
        } else {
            onSubmit({ name, icon, value });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {visibility ? "Edit Visibility" : "Create Visibility"}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Stack spacing={2}>
                        <TextField
                            label="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            fullWidth
                            disabled={loading}
                        />
                        <TextField
                            label="Icon (HTML/SVG)"
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            required
                            fullWidth
                            multiline
                            rows={3}
                            disabled={loading}
                            helperText="Enter the icon"
                        />
                        <TextField
                            label="Value (Power of 2)"
                            type="number"
                            value={value}
                            onChange={(e) =>
                                setValue(parseInt(e.target.value) || 1)
                            }
                            required
                            fullWidth
                            disabled={loading}
                            helperText="Must be a power of 2 (1, 2, 4, 8, 16, etc.)"
                        />
                        {icon && (
                            <Box>
                                <Typography variant="caption">
                                    Preview:
                                </Typography>
                                <Box
                                    component="span"
                                    dangerouslySetInnerHTML={{ __html: icon }}
                                />
                            </Box>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !name || !icon || value < 1}
                    >
                        {loading ? (
                            <CircularProgress size={20} />
                        ) : visibility ? (
                            "Update"
                        ) : (
                            "Create"
                        )}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

interface DeleteConfirmDialogProps {
    open: boolean;
    visibility?: GalleryDirectoryVisibility;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
}

const DeleteConfirmDialog = ({
    open,
    visibility,
    onClose,
    onConfirm,
    loading,
}: DeleteConfirmDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to delete the visibility "
                    {visibility?.name}"? This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    color="error"
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={20} /> : "Delete"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DirectoryVisibilitySettings;
