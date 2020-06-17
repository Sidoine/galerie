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
} from "@material-ui/core";
import VisibilityIcon from "@material-ui/icons/Visibility";

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
                    onClick={() =>
                        history.push(
                            `/directory/${directoryId}/images/${value.id}`
                        )
                    }
                >
                    <CardMedia
                        className={classes.media}
                        image={directoriesStore.getThumbnail(
                            directoryId,
                            value.id
                        )}
                        title={value.name}
                    />
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

export const ImagesView = observer(
    ({ directoryId }: { directoryId: number }) => {
        const { directoriesStore, usersStore } = useStores();
        const history = useHistory();
        const location = useLocation();
        const order = location.search.replace("?", "");
        const [pages, setPages] = useState(1);
        const values =
            directoriesStore.contentLoader.getValue(directoryId) || [];
        const sortedValues = order === "date-desc" ? values.reverse() : values;
        const page = sortedValues.slice(0, pages * 9);
        const handleShowAll = useCallback(() => {
            directoriesStore.patchAll(directoryId, { visible: true });
        }, [directoriesStore, directoryId]);
        const handleHideAll = useCallback(() => {
            directoriesStore.patchAll(directoryId, { visible: false });
        }, [directoriesStore, directoryId]);
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
                <Grid container spacing={1}>
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
                        </>
                    )}
                    {
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
                    }
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
