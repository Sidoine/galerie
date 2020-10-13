import { useStores } from "../stores";
import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import {
    makeStyles,
    Grid,
    Card,
    CardHeader,
    CardContent,
    CardMedia,
    Button,
    Switch,
} from "@material-ui/core";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import { useHistory } from "react-router-dom";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import { Map, TileLayer } from "react-leaflet";
import CalendarTodayIcon from "@material-ui/icons/CalendarToday";
import CameraAltIcon from "@material-ui/icons/CameraAlt";
import VisibilityIcon from "@material-ui/icons/Visibility";

const useStyles = makeStyles({
    image: {
        maxWidth: "100%",
        maxHeight: "calc(100vh - 128px)",
        imageOrientation: "from-image",
    },
    root: {
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        padding: "16px",
    },
    top: {
        flex: 1,
    },
    map: {
        width: "100%",
        height: "20rem",
    },
});

export const ImageView = observer(
    ({ id, directoryId }: { id: number; directoryId: number }) => {
        const { directoriesStore, usersStore } = useStores();
        const classes = useStyles();
        const image = directoriesStore.imageLoader.getValue({
            directoryId,
            id,
        });
        const history = useHistory();
        const handleVisibleSwitch = useCallback(
            (e: unknown, checked: boolean) => {
                if (image)
                    directoriesStore.patchPhoto(directoryId, image, {
                        visible: checked,
                    });
            },
            [image, directoryId, directoriesStore]
        );
        const handleSlideshow = useCallback(() => {
            history.push(`/directory/${directoryId}/images/${id}/slideshow`);
        }, [directoryId, id, history]);
        if (image) {
            return (
                <div className={classes.root}>
                    <Grid container spacing={4} className={classes.top}>
                        <Grid item xs={9}>
                            {!image.video && (
                                <img
                                    alt=""
                                    src={directoriesStore.getImage(
                                        directoryId,
                                        id
                                    )}
                                    className={classes.image}
                                />
                            )}
                            {image.video && (
                                <video
                                    src={directoriesStore.getImage(
                                        directoryId,
                                        id
                                    )}
                                    controls
                                    className={classes.image}
                                />
                            )}
                        </Grid>
                        <Grid item xs={3}>
                            <Card>
                                <CardHeader title={image.name} />
                                {image.latitude && image.longitude && (
                                    <CardMedia>
                                        <Map
                                            viewport={{
                                                zoom: 13,
                                                center: [
                                                    image.latitude,
                                                    image.longitude,
                                                ],
                                            }}
                                            className={classes.map}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                            ></TileLayer>
                                        </Map>
                                    </CardMedia>
                                )}
                                <CardContent>
                                    <Grid
                                        container
                                        direction="column"
                                        spacing={1}
                                    >
                                        {image.dateTime && (
                                            <Grid item>
                                                <CalendarTodayIcon />
                                                {new Date(
                                                    image.dateTime
                                                ).toLocaleDateString()}
                                            </Grid>
                                        )}
                                        {image.camera && (
                                            <Grid item>
                                                <CameraAltIcon /> {image.camera}
                                            </Grid>
                                        )}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                    <Grid container justify="center" spacing={2}>
                        <Grid item>
                            <Button
                                disabled={image.previousId === null}
                                color="primary"
                                startIcon={<ArrowBackIcon />}
                                onClick={() =>
                                    history.push(
                                        `/directory/${directoryId}/images/${image.previousId}`
                                    )
                                }
                            >
                                Précédent
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                disabled={image.nextId === null}
                                color="primary"
                                startIcon={<ArrowForwardIcon />}
                                onClick={() =>
                                    history.push(
                                        `/directory/${directoryId}/images/${image.nextId}`
                                    )
                                }
                            >
                                Suivant
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                startIcon={<ArrowUpwardIcon />}
                                onClick={() =>
                                    history.push(`/directory/${directoryId}`)
                                }
                            >
                                Retour
                            </Button>
                        </Grid>
                        {usersStore.isAdministrator && (
                            <Grid item>
                                <Switch
                                    onChange={handleVisibleSwitch}
                                    checked={image.visible}
                                />
                                <VisibilityIcon />
                            </Grid>
                        )}
                        <Grid item>
                            <Button onClick={handleSlideshow}>Diapo</Button>
                        </Grid>
                    </Grid>
                </div>
            );
        }
        return <div>...</div>;
    }
);
