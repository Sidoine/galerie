import { useStores } from "../stores";
import React, { CSSProperties } from "react";
import { observer } from "mobx-react-lite";
import {
    makeStyles,
    Grid,
    BottomNavigation,
    BottomNavigationAction,
    Card,
    CardHeader,
    CardContent,
    CardMedia,
} from "@material-ui/core";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import { useHistory } from "react-router-dom";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import { Map, TileLayer } from "react-leaflet";
import CalendarTodayIcon from "@material-ui/icons/CalendarToday";
import CameraAltIcon from "@material-ui/icons/CameraAlt";

const useStyles = makeStyles({
    image: {
        width: "100%",
        height: "100%",
        backgroundSize: "100%",
        backgroundRepeat: "no-repeat",
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
        const { directoriesStore } = useStores();
        const classes = useStyles();
        const image = directoriesStore.imageLoader.getValue({
            directoryId,
            id,
        });
        const history = useHistory();
        if (image) {
            const style: CSSProperties = {
                backgroundImage: `url(${directoriesStore.getImage(
                    directoryId,
                    id
                )})`,
            };
            return (
                <div className={classes.root}>
                    <Grid container spacing={4} className={classes.top}>
                        <Grid item xs={9}>
                            <div className={classes.image} style={style}></div>
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
                    <BottomNavigation showLabels>
                        <BottomNavigationAction
                            disabled={image.previousId === null}
                            label="Précédent"
                            icon={<ArrowBackIcon />}
                            onClick={() =>
                                history.push(
                                    `/directory/${directoryId}/images/${image.previousId}`
                                )
                            }
                        />
                        <BottomNavigationAction
                            disabled={image.nextId === null}
                            label="Suivant"
                            icon={<ArrowForwardIcon />}
                            onClick={() =>
                                history.push(
                                    `/directory/${directoryId}/images/${image.nextId}`
                                )
                            }
                        />
                        <BottomNavigationAction
                            label="Retour"
                            icon={<ArrowUpwardIcon />}
                            onClick={() =>
                                history.push(`/directory/${directoryId}`)
                            }
                        />
                    </BottomNavigation>
                </div>
            );
        }
        return <div>...</div>;
    }
);
