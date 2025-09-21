import { ImageListItem, Stack } from "@mui/material";
import { observer } from "mobx-react-lite";
import { Link } from "react-router";
import { Photo } from "../services/views";
import { useDirectoriesStore } from "../stores/directories";
import { useUi, createPhotoUrl } from "../stores/ui";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const ImageCard = observer(function ImageCard({ value }: { value: Photo }) {
    const directoriesStore = useDirectoriesStore();
    const { order } = useUi();

    return (
        <ImageListItem
            component={Link}
            to={createPhotoUrl(
                directoriesStore.galleryId,
                value.directoryId,
                value.id,
                order
            )}
            sx={{ minHeight: 200, position: "relative" }}
        >
            <img
                src={directoriesStore.getThumbnail(value.id)}
                alt={value.name}
                loading="lazy"
            />
            {value.video && (
                <Stack
                    sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}
                >
                    <PlayArrowIcon
                        sx={{
                            fontSize: 140,
                        }}
                    />
                </Stack>
            )}
        </ImageListItem>
    );
});

export default ImageCard;
