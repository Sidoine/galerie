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
import { Link, useLocation, useNavigate } from "react-router-dom";

const ImageCard = observer(
    ({ value, directoryId }: { value: Photo; directoryId: number }) => {
        const { directoriesStore } = useStores();

        return (
            <ImageListItem
                component={Link}
                to={`/directory/${directoryId}/images/${value.id}`}
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
    }
);

function createUrl(directoryId: number, order: "date-desc" | "date-asc") {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.set("order", order);
    return `/directory/${directoryId}?${urlSearchParams}`;
}

export const ImagesView = observer(function ImagesView({
    directoryId,
}: {
    directoryId: number;
}) {
    const { directoriesStore, usersStore } = useStores();
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const order =
        params.get("order") === "date-desc" ? "date-desc" : "date-asc";
    const directoryContent =
        directoriesStore.contentLoader.getValue(directoryId);
    let values = directoryContent || [];
    const sortedValues =
        order === "date-desc" ? values.slice().reverse() : values;
    const handleSortDateDesc = useCallback(
        () => navigate(createUrl(directoryId, "date-desc")),
        [navigate, directoryId]
    );
    const handleSortDateAsc = useCallback(
        () => navigate(createUrl(directoryId, "date-asc")),
        [navigate, directoryId]
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
