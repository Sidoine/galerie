import { useStores } from "../stores";
import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import {
    Grid,
    Card,
    CardHeader,
    CardContent,
    CardMedia,
    Button,
    Switch,
    Box,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link, useNavigate, useParams } from "react-router-dom";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { MapContainer, TileLayer } from "react-leaflet";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";

export function ImagePage() {
    const { directoryId, id } = useParams();
    return <ImageView directoryId={Number(directoryId)} id={Number(id)} />;
}

export const ImageView = observer(
    ({ directoryId, id }: { directoryId: number; id: number }) => {
        const { directoriesStore, usersStore } = useStores();
        const image = directoriesStore.imageLoader.getValue(
            Number(directoryId),
            Number(id)
        );
        const navigate = useNavigate();
        const handleVisibleSwitch = useCallback(
            (e: unknown, checked: boolean) => {
                if (image)
                    directoriesStore.patchPhoto(Number(directoryId), image, {
                        visible: checked,
                    });
            },
            [image, directoryId, directoriesStore]
        );
        const handleSlideshow = useCallback(() => {
            navigate(`/directory/${directoryId}/images/${id}/slideshow`);
        }, [directoryId, id, navigate]);
        if (image) {
            return (
                <Box
                    sx={{
                        height: "calc(100vh - 64px)",
                        display: "flex",
                        flexDirection: "column",
                        padding: "16px",
                    }}
                >
                    <Grid container spacing={4} sx={{ flex: 1 }}>
                        <Grid
                            item
                            xs={9}
                            onClick={
                                image.visible ? handleSlideshow : undefined
                            }
                        >
                            {!image.video && (
                                <Box
                                    component="img"
                                    alt=""
                                    src={directoriesStore.getImage(
                                        directoryId,
                                        id
                                    )}
                                    sx={{
                                        maxWidth: "100%",
                                        maxHeight: "calc(100vh - 128px)",
                                        imageOrientation: "from-image",
                                    }}
                                />
                            )}
                            {image.video && (
                                <Box
                                    component="video"
                                    src={directoriesStore.getImage(
                                        directoryId,
                                        id
                                    )}
                                    controls
                                    sx={{
                                        maxWidth: "100%",
                                        maxHeight: "calc(100vh - 128px)",
                                        imageOrientation: "from-image",
                                    }}
                                />
                            )}
                        </Grid>
                        <Grid item xs={3}>
                            <Card>
                                <CardHeader title={image.name} />
                                {image.latitude && image.longitude && (
                                    <CardMedia>
                                        <Box
                                            component={MapContainer}
                                            center={[
                                                image.latitude,
                                                image.longitude,
                                            ]}
                                            zoom={13}
                                            sx={{
                                                width: "100%",
                                                height: "20rem",
                                            }}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                            ></TileLayer>
                                        </Box>
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
                    <Grid container spacing={2}>
                        <Grid item>
                            <Button
                                disabled={image.previousId === null}
                                color="primary"
                                startIcon={<ArrowBackIcon />}
                                component={Link}
                                to={`/directory/${directoryId}/images/${image.previousId}`}
                            >
                                Précédent
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                disabled={image.nextId === null}
                                color="primary"
                                startIcon={<ArrowForwardIcon />}
                                component={Link}
                                to={`/directory/${directoryId}/images/${image.nextId}`}
                            >
                                Suivant
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                component={Link}
                                startIcon={<ArrowUpwardIcon />}
                                to={`/directory/${directoryId}?image=${image.id}#image${image.id}`}
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
                        {image.visible && (
                            <Grid item>
                                <Button onClick={handleSlideshow}>Diapo</Button>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            );
        }
        return <div>...</div>;
    }
);
