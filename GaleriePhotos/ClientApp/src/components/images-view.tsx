import { observer } from "mobx-react-lite";
import React, { useState, useCallback, useEffect } from "react";
import { useStores } from "../stores";
import {
    Card,
    CardActionArea,
    CardMedia,
    Grid,
    CardActions,
    Switch,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    CircularProgress,
    Checkbox,
    FormControlLabel,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Photo } from "../services/views";
import { useVisibility } from "../atoms/visibility";
import { Link, useLocation, useNavigate } from "react-router-dom";

const ImageCard = observer(
    ({ value, directoryId }: { value: Photo; directoryId: number }) => {
        const { directoriesStore, usersStore } = useStores();
        const handleSwitchVisible = useCallback(
            (_: unknown, checked: boolean) => {
                directoriesStore.patchPhoto(directoryId, value, {
                    visible: checked,
                });
            },
            [directoriesStore, directoryId, value]
        );

        return (
            <Card sx={{ width: 165 }}>
                <CardActionArea
                    sx={{ textAlign: "center" }}
                    component={Link}
                    to={`/directory/${directoryId}/images/${value.id}`}
                >
                    <CardMedia
                        sx={{ height: 140 }}
                        image={directoriesStore.getThumbnail(
                            directoryId,
                            value.id
                        )}
                        title={value.name}
                    >
                        {value.video && (
                            <PlayArrowIcon sx={{ fontSize: 140 }} />
                        )}
                    </CardMedia>
                </CardActionArea>

                <CardActions>
                    {usersStore.isAdministrator && (
                        <>
                            <Switch
                                color="primary"
                                checked={value.visible}
                                onChange={handleSwitchVisible}
                            />
                            <VisibilityIcon />
                        </>
                    )}
                </CardActions>
            </Card>
        );
    }
);

enum DialogMode {
    Closed,
    SeeAll,
    HideAll,
}

function createUrl(
    directoryId: number,
    order: "date-desc" | "date-asc",
    image: number,
    onlyHidden: boolean | undefined
) {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.set("order", order);
    urlSearchParams.set("image", image.toString());
    if (onlyHidden) urlSearchParams.set("only-hidden", "true");
    return `/directory/${directoryId}?${urlSearchParams}`;
}

export const ImagesView = observer(
    ({ directoryId }: { directoryId: number }) => {
        const { directoriesStore, usersStore } = useStores();
        const [needNextPage, setNextPageNeeded] = useState(false);
        const navigate = useNavigate();
        const location = useLocation();
        const params = new URLSearchParams(location.search);
        const order =
            params.get("order") === "date-desc" ? "date-desc" : "date-asc";
        const [image, setImage] = useState(
            parseInt(params.get("image") || "0")
        );
        const directoryContent =
            directoriesStore.contentLoader.getValue(directoryId);
        let values = directoryContent || [];
        const [onlyHidden, setOnlyHidden] = useState(
            params.get("only-hidden") === "true"
        );
        const handleSetOnlyHidden = useCallback(
            (_: unknown, checked: boolean) => {
                setOnlyHidden(checked);
                navigate(createUrl(directoryId, order, image, checked));
            },
            [directoryId, navigate, order, image]
        );
        if (onlyHidden) {
            values = values.filter((x) => !x.visible);
        }
        const sortedValues = order === "date-desc" ? values.reverse() : values;
        const pageSize = 9;
        let imageIndex = sortedValues.findIndex((x) => x.id === image);
        if (imageIndex < 0) imageIndex = 0;
        const page = sortedValues.slice(0, imageIndex + pageSize);
        const hasMorePages = page.length < sortedValues.length;
        const [dialogMode, setDialogMode] = useState(DialogMode.Closed);
        const handleConfirm = useCallback(async () => {
            if (dialogMode === DialogMode.SeeAll) {
                await directoriesStore.patchAll(directoryId, { visible: true });
            } else if (dialogMode === DialogMode.HideAll) {
                await directoriesStore.patchAll(directoryId, {
                    visible: false,
                });
            }
            setDialogMode(DialogMode.Closed);
        }, [directoriesStore, directoryId, dialogMode]);
        const handleCancel = useCallback(() => {
            setDialogMode(DialogMode.Closed);
        }, []);
        const handleShowAll = useCallback(() => {
            setDialogMode(DialogMode.SeeAll);
        }, []);
        const handleHideAll = useCallback(() => {
            setDialogMode(DialogMode.HideAll);
        }, []);
        const handleSortDateDesc = useCallback(
            () =>
                navigate(
                    createUrl(directoryId, "date-desc", image, onlyHidden)
                ),
            [navigate, directoryId, image, onlyHidden]
        );
        const handleSortDateAsc = useCallback(
            () =>
                navigate(createUrl(directoryId, "date-asc", image, onlyHidden)),
            [navigate, directoryId, image, onlyHidden]
        );
        const handleNextPage = useCallback(() => {
            setNextPageNeeded(true);
            const newImageIndex = Math.min(
                sortedValues.length - pageSize,
                imageIndex + pageSize
            );
            const newImageId = sortedValues[newImageIndex].id;
            setImage(newImageId);
            navigate(createUrl(directoryId, order, newImageId, onlyHidden), {
                replace: true,
            });
            setTimeout(() => setNextPageNeeded(false), 100);
        }, [
            sortedValues,
            imageIndex,
            navigate,
            directoryId,
            order,
            onlyHidden,
        ]);
        const [ref, visible] = useVisibility<HTMLDivElement>();

        useEffect(() => {
            if (visible && hasMorePages && !needNextPage) {
                handleNextPage();
            }
        }, [handleNextPage, hasMorePages, needNextPage, visible]);

        return (
            <>
                <Dialog
                    open={dialogMode !== DialogMode.Closed}
                    onClose={handleCancel}
                >
                    <DialogTitle>Veuillez confirmer</DialogTitle>
                    <DialogContent>
                        {dialogMode === DialogMode.HideAll
                            ? "Cacher toutes les photos ?"
                            : "Montrer toutes les photos ?"}
                    </DialogContent>
                    <DialogActions>
                        <Button color="secondary" onClick={handleCancel}>
                            Annuler
                        </Button>
                        <Button color="primary" onClick={handleConfirm}>
                            Confirmer
                        </Button>
                    </DialogActions>
                </Dialog>
                <Grid container spacing={1}>
                    {directoryContent === null && <CircularProgress />}
                    {values.length > 0 && usersStore.isAdministrator && (
                        <>
                            <Grid item>
                                <Button onClick={handleShowAll}>
                                    Tout montrer
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button onClick={handleHideAll}>
                                    Tout cacher
                                </Button>
                            </Grid>
                            <Grid item>
                                <FormControlLabel
                                    label="Que les cachées"
                                    control={
                                        <Checkbox
                                            checked={onlyHidden}
                                            onChange={handleSetOnlyHidden}
                                        />
                                    }
                                />
                            </Grid>
                        </>
                    )}
                    {values.length > 0 && (
                        <Grid item>
                            <Button
                                onClick={handleSortDateDesc}
                                color={
                                    order === "date-desc"
                                        ? "primary"
                                        : "inherit"
                                }
                            >
                                Plus récent en premier
                            </Button>
                            <Button
                                onClick={handleSortDateAsc}
                                color={
                                    order !== "date-desc"
                                        ? "primary"
                                        : "inherit"
                                }
                            >
                                Plus ancien en premier
                            </Button>
                        </Grid>
                    )}
                </Grid>
                <Grid container spacing={2} wrap="wrap">
                    {page.map((x) => (
                        <Grid item key={x.id} id={`image${x.id}`}>
                            <ImageCard directoryId={directoryId} value={x} />
                        </Grid>
                    ))}
                </Grid>
                {hasMorePages && (
                    <div ref={ref}>
                        {visible && <CircularProgress />}
                        {!visible && <VisibilityIcon />}
                    </div>
                )}
            </>
        );
    }
);
