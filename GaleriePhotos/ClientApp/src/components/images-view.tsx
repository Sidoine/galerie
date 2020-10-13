import { observer } from "mobx-react-lite";
import React, { useState, useCallback } from "react";
import { useStores } from "../stores";
import {
    makeStyles,
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
    CardContent,
    Checkbox,
    FormControlLabel,
} from "@material-ui/core";
import VisibilityIcon from "@material-ui/icons/Visibility";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { Photo } from "../services/views";
import { Visibility } from "../atoms/visibility";
import { useHistory, useLocation } from "react-router-dom";

const useStyles = makeStyles({
    root: {
        width: 270,
    },
    media: {
        height: 140,
    },
    video: {
        fontSize: 140,
    },
    action: {
        textAlign: "center",
    },
});

const ImageCard = observer(
    ({ value, directoryId }: { value: Photo; directoryId: number }) => {
        const classes = useStyles();
        const history = useHistory();
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
            <Card className={classes.root}>
                <CardActionArea
                    className={classes.action}
                    onClick={() =>
                        history.push(
                            `/directory/${directoryId}/images/${value.id}`
                        )
                    }
                >
                    {!value.video && (
                        <CardMedia
                            className={classes.media}
                            image={directoriesStore.getThumbnail(
                                directoryId,
                                value.id
                            )}
                            title={value.name}
                        />
                    )}
                    {value.video && (
                        <CardContent>
                            <PlayArrowIcon className={classes.video} />
                        </CardContent>
                    )}
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

export const ImagesView = observer(
    ({ directoryId }: { directoryId: number }) => {
        const { directoriesStore, usersStore } = useStores();
        const history = useHistory();
        const location = useLocation();
        const order = location.search.replace("?", "");
        const [pages, setPages] = useState(1);
        const directoryContent = directoriesStore.contentLoader.getValue(
            directoryId
        );
        let values = directoryContent || [];
        const [onlyHidden, setOnlyHidden] = useState(false);
        const handleSetOnlyHidden = useCallback(
            (_: unknown, checked: boolean) => {
                setOnlyHidden(checked);
            },
            []
        );
        if (onlyHidden) {
            values = values.filter((x) => !x.visible);
        }
        const sortedValues = order === "date-desc" ? values.reverse() : values;
        const page = sortedValues.slice(0, pages * 9);
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
            () => history.push(`/directory/${directoryId}?date-desc`),
            [history, directoryId]
        );
        const handleSortDateAsc = useCallback(
            () => history.push(`/directory/${directoryId}`),
            [history, directoryId]
        );
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
                                        : "default"
                                }
                            >
                                Plus récent en premier
                            </Button>
                            <Button
                                onClick={handleSortDateAsc}
                                color={
                                    order !== "date-desc"
                                        ? "primary"
                                        : "default"
                                }
                            >
                                Plus ancien en premier
                            </Button>
                        </Grid>
                    )}
                </Grid>

                <Grid container spacing={4} wrap="wrap">
                    {page.map((x) => (
                        <Grid item key={x.id}>
                            <ImageCard directoryId={directoryId} value={x} />
                        </Grid>
                    ))}
                </Grid>
                <Visibility
                    onChange={(x) => {
                        if (x) setPages(pages + 1);
                    }}
                    length={values.length}
                />
            </>
        );
    }
);
