import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useStores } from "../stores";
import {
    Button,
    CircularProgress,
    ImageList,
    ImageListItem,
    Stack,
    Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Photo } from "../services/views";
import { Link } from "react-router-dom";
import { createPhotoUrl, useUi } from "../stores/ui";

const ImageCard = observer(function ImageCard({
    value,
    directoryId,
}: {
    value: Photo;
    directoryId: number;
}) {
    const { directoriesStore } = useStores();
    const { order } = useUi();

    return (
        <ImageListItem
            component={Link}
            to={createPhotoUrl(directoryId, value.id, order)}
            sx={{ minHeight: 200, position: "relative" }}
        >
            <img
                src={directoriesStore.getThumbnail(directoryId, value.id)}
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

export const ImagesView = observer(function ImagesView({
    directoryId,
}: {
    directoryId: number;
}) {
    const { directoriesStore, usersStore } = useStores();
    const { order, navigateToDirectory } = useUi();
    const directoryContent =
        directoriesStore.contentLoader.getValue(directoryId);
    const values = directoryContent || [];
    const sortedValues =
        order === "date-desc" ? values.slice().reverse() : values;
    const handleSortDateDesc = useCallback(
        () => navigateToDirectory(directoryId, "date-desc"),
        [directoryId]
    );
    const handleSortDateAsc = useCallback(
        () => navigateToDirectory(directoryId, "date-asc"),
        [directoryId]
    );

    if (values.length === 0) return <></>;
    return (
        <>
            <Typography variant="h4">Photos</Typography>
            <Stack spacing={1}>
                {directoryContent === null && <CircularProgress />}
                {values.length > 0 && usersStore.isAdministrator && <></>}
                {values.length > 0 && (
                    <Stack direction="row" spacing={1}>
                        <Button
                            onClick={handleSortDateDesc}
                            color={
                                order === "date-desc" ? "primary" : "inherit"
                            }
                            variant="contained"
                        >
                            Plus récent en premier
                        </Button>
                        <Button
                            onClick={handleSortDateAsc}
                            color={
                                order !== "date-desc" ? "primary" : "inherit"
                            }
                            variant="contained"
                        >
                            Plus ancien en premier
                        </Button>
                    </Stack>
                )}
            </Stack>
            <ImageList>
                {sortedValues.map((x) => (
                    <ImageCard directoryId={directoryId} value={x} key={x.id} />
                ))}
            </ImageList>
        </>
    );
});
