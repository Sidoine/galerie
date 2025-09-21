import { useCallback, useEffect, useMemo, useState } from "react";
import { useApiClient } from "folke-service-helpers";
import { GalleryController } from "../../services/gallery";
import {
    Alert,
    Box,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography,
    IconButton,
    Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

interface Props {
    label: string;
    value: string;
    onChange: (id: string) => void;
    apiKey: string;
    serverUrl: string;
    helperText?: string;
    required?: boolean;
}

export function SeafileRepositorySelect({
    label,
    value,
    onChange,
    apiKey,
    serverUrl,
    helperText,
    required,
}: Props) {
    const apiClient = useApiClient();
    const galleryController = useMemo(
        () => new GalleryController(apiClient),
        [apiClient]
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [repositories, setRepositories] = useState<
        {
            id: string;
            name: string;
            permission: string;
            encrypted: boolean;
            owner: string;
            size: number;
        }[]
    >([]);

    const load = useCallback(async () => {
        if (!apiKey || !serverUrl) return;
        setLoading(true);
        setError(null);
        const response = await galleryController.getSeafileRepositories({
            apiKey,
            serverUrl,
        });
        if (response.ok) {
            setRepositories(response.value.repositories);
        } else {
            setError(response.message || "Erreur lors du chargement");
        }
        setLoading(false);
    }, [apiKey, serverUrl, galleryController]);

    useEffect(() => {
        load();
    }, [load]);

    const handleSelect = (e: SelectChangeEvent<string>) => {
        onChange(e.target.value as string);
    };

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={1}>
                <FormControl fullWidth required={required} size="medium">
                    <InputLabel>{label}</InputLabel>
                    <Select
                        label={label}
                        value={value}
                        onChange={handleSelect}
                        disabled={loading || !apiKey || !serverUrl || !!error}
                        renderValue={(val) => {
                            const repo = repositories.find((r) => r.id === val);
                            return repo ? repo.name : val;
                        }}
                    >
                        {repositories.map((r) => (
                            <MenuItem key={r.id} value={r.id}>
                                <Box display="flex" flexDirection="column">
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                    >
                                        {r.name}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {r.id}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Tooltip title="Rafraîchir la liste">
                    <span>
                        <IconButton
                            onClick={load}
                            disabled={loading || !apiKey || !serverUrl}
                        >
                            {loading ? (
                                <CircularProgress size={20} />
                            ) : (
                                <RefreshIcon />
                            )}
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
            {helperText && (
                <Typography variant="caption" color="text.secondary">
                    {helperText}
                </Typography>
            )}
            {error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    {error}
                </Alert>
            )}
            {!error &&
                !loading &&
                repositories.length === 0 &&
                apiKey &&
                serverUrl && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        Aucun repository disponible.
                    </Typography>
                )}
        </Box>
    );
}

export default SeafileRepositorySelect;
