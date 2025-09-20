import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    CircularProgress,
    IconButton,
    Stack,
    TextField,
    Tooltip,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import CloseIcon from "@mui/icons-material/Close";
import { FaceController } from "../../services/face";
import { Face } from "../../services/views";
import Autocomplete from "@mui/material/Autocomplete";
import { useApiClient } from "folke-service-helpers";
import { useDirectoriesStore } from "../../stores/directories";

/**
 * Composant permettant d'afficher et modifier le nom associé à un visage.
 * - Si face.name existe : l'affiche.
 * - Sinon affiche "Visage inconnu".
 * - Un clic sur le nom ouvre un champ d'édition avec autocomplétion des noms connus.
 */
export function FaceSelector({
    face,
    onNameAssigned,
    dense,
}: {
    face: Face; // objet Face (doit contenir id et name)
    onNameAssigned?: (name: string) => void;
    dense?: boolean;
}) {
    const apiClient = useApiClient();
    const directoriesStore = useDirectoriesStore();
    const faceController = useMemo(
        () => new FaceController(apiClient),
        [apiClient]
    );
    const [names, setNames] = useState<string[]>([]);
    const [loadingNames, setLoadingNames] = useState(false);
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState<string>(face.name ?? "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestionLoading, setSuggestionLoading] = useState(false);
    const [suggestedName, setSuggestedName] = useState<string | null>(null);
    const [suggestedSimilarity, setSuggestedSimilarity] = useState<
        number | null
    >(null);

    // Charger la liste des noms quand on passe en édition
    useEffect(() => {
        if (!editing) return;
        let cancelled = false;
        setLoadingNames(true);
        async function loadFaceNames() {
            const n = await faceController.getDistinctNames(
                directoriesStore.galleryId
            );
            if (cancelled) return;
            if (n.ok) setNames(n.value);
            else setNames([]);
            setLoadingNames(false);
        }
        loadFaceNames();
        return () => {
            cancelled = true;
        };
    }, [directoriesStore.galleryId, editing, faceController]);

    const displayLabel = face.name || "Visage inconnu";

    const fetchSuggestion = useCallback(async () => {
        if (face.name) return; // déjà nommé
        setSuggestionLoading(true);
        setSuggestedName(null);
        setSuggestedSimilarity(null);
        try {
            const resp = await faceController.suggestName(
                directoriesStore.galleryId,
                face.id,
                { threshold: 0.7 }
            );
            if (resp.ok) {
                setSuggestedName(resp.value.name);
                setSuggestedSimilarity(resp.value.similarity);
            }
        } finally {
            setSuggestionLoading(false);
        }
    }, [directoriesStore.galleryId, face.id, face.name, faceController]);

    const handleEnterEdit = useCallback(() => {
        setError(null);
        setValue(face.name ?? "");
        setEditing(true);
        // lancer suggestion si pas de nom
        if (!face.name) {
            fetchSuggestion();
        }
    }, [face.name, fetchSuggestion]);

    const handleCancel = useCallback(() => {
        setEditing(false);
        setValue(face.name ?? "");
        setError(null);
        setSuggestedName(null);
        setSuggestedSimilarity(null);
    }, [face.name]);

    const canSubmit = value.trim().length > 0 && value.trim() !== face.name;

    const acceptSuggestion = useCallback(() => {
        if (suggestedName) {
            setValue(suggestedName);
        }
    }, [suggestedName]);

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) {
            setEditing(false);
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await faceController.assignName(
                directoriesStore.galleryId,
                face.id,
                { name: value.trim() }
            );
            onNameAssigned?.(value.trim());
            setEditing(false);
        } catch (e) {
            if (e instanceof Error) setError(e.message);
            else setError("Erreur inconnue");
        } finally {
            setSubmitting(false);
        }
    }, [
        canSubmit,
        directoriesStore.galleryId,
        face.id,
        faceController,
        onNameAssigned,
        value,
    ]);

    if (!editing) {
        return (
            <Stack direction="row" spacing={0.5} alignItems="center">
                <Box
                    onClick={handleEnterEdit}
                    sx={{
                        cursor: "pointer",
                        fontSize: dense ? 10 : 12,
                        fontWeight: face.name ? 600 : 400,
                        color: face.name ? "#00e5ff" : "#ccc",
                        textDecoration: "underline dotted",
                        userSelect: "none",
                        lineHeight: 1.2,
                    }}
                >
                    {displayLabel}
                </Box>
                <Tooltip title="Modifier le nom">
                    <IconButton
                        size="small"
                        onClick={handleEnterEdit}
                        sx={{ color: "#00e5ff" }}
                    >
                        <EditIcon fontSize="inherit" />
                    </IconButton>
                </Tooltip>
            </Stack>
        );
    }

    return (
        <Stack
            direction="row"
            alignItems="flex-start"
            spacing={0.5}
            sx={{ bgcolor: "white" }}
        >
            <Autocomplete
                size={dense ? "small" : "medium"}
                freeSolo
                loading={loadingNames}
                options={names}
                value={value}
                sx={{ flex: 1, minWidth: 120 }}
                onChange={(_, newValue) => setValue(newValue || "")}
                onInputChange={(_, newInput) => setValue(newInput)}
                slotProps={{
                    popper: {
                        sx: { zIndex: 4000 },
                    },
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Nom"
                        variant="filled"
                        error={!!error}
                        helperText={
                            error ||
                            (suggestionLoading
                                ? "Recherche suggestion..."
                                : suggestedName
                                ? `Suggestion: ${suggestedName} (${(
                                      suggestedSimilarity ?? 0
                                  ).toFixed(2)})`
                                : " ")
                        }
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loadingNames ? (
                                        <CircularProgress
                                            color="inherit"
                                            size={16}
                                        />
                                    ) : null}
                                    {suggestionLoading && !suggestedName ? (
                                        <CircularProgress
                                            color="warning"
                                            size={16}
                                        />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSubmit();
                            } else if (e.key === "Escape") {
                                e.preventDefault();
                                handleCancel();
                            }
                        }}
                    />
                )}
            />
            <Stack direction="row" spacing={0.5}>
                {suggestedName && value.trim() !== suggestedName && (
                    <Tooltip title="Accepter la suggestion">
                        <IconButton
                            size="small"
                            onClick={acceptSuggestion}
                            sx={{ color: "#ffca28" }}
                        >
                            <LightbulbIcon fontSize="inherit" />
                        </IconButton>
                    </Tooltip>
                )}
                <Tooltip title={canSubmit ? "Valider" : "Aucun changement"}>
                    <span>
                        <IconButton
                            size="small"
                            disabled={!canSubmit || submitting}
                            onClick={handleSubmit}
                            sx={{ color: canSubmit ? "#00e5ff" : "#888" }}
                        >
                            {submitting ? (
                                <CircularProgress size={16} />
                            ) : (
                                <CheckIcon fontSize="inherit" />
                            )}
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Annuler">
                    <IconButton
                        size="small"
                        onClick={handleCancel}
                        sx={{ color: "#ff9800" }}
                    >
                        <CloseIcon fontSize="inherit" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Stack>
    );
}

export default FaceSelector;
