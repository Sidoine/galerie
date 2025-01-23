import { observer } from "mobx-react-lite";
import { Box, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { MapContainer, TileLayer } from "react-leaflet";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { PhotoFull } from "../../services/views";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

export const ImageDetails = observer(function ImageDetails({
    image,
    open,
    onClose,
}: {
    image: PhotoFull;
    open: boolean;
    onClose: () => void;
}) {
    return (
        <Drawer
            open={open}
            anchor="right"
            onClose={onClose}
            sx={{ zIndex: 3000 }}
            hideBackdrop
            PaperProps={{
                sx: {
                    width: "360px",
                    p: 2,
                },
            }}
        >
            <Stack direction="column" spacing={2}>
                <Stack direction="row" alignItems="center">
                    <IconButton onClick={onClose}>
                        <CloseOutlinedIcon />
                    </IconButton>
                    <Typography variant="h6">Renseignements</Typography>
                </Stack>
                <Typography variant="caption" sx={{ mt: 2, mb: 1 }}>
                    Détails
                </Typography>
                {image.dateTime && (
                    <Stack direction="row" spacing={1}>
                        <CalendarTodayIcon />
                        <Typography>
                            {new Date(image.dateTime).toLocaleDateString()}
                        </Typography>
                    </Stack>
                )}
                {image.camera && (
                    <Stack direction="row" spacing={1}>
                        <CameraAltIcon />
                        <Typography>{image.camera}</Typography>
                    </Stack>
                )}
                <Stack direction="row" spacing={1}>
                    <ImageOutlinedIcon />
                    <Typography>{image.name}</Typography>
                </Stack>
                {image.latitude && image.longitude && (
                    <Box
                        component={MapContainer}
                        sx={{
                            width: "100%",
                            height: "20rem",
                            ml: -2,
                            mr: -2,
                        }}
                        center={[image.latitude, image.longitude]}
                        zoom={13}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        ></TileLayer>
                    </Box>
                )}
            </Stack>
        </Drawer>
    );
});
