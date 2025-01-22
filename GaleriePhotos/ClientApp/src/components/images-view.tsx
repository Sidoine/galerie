import { observer } from "mobx-react-lite";
import { useState, useCallback, useEffect } from "react";
import { useStores } from "../stores";
import {
    Button,
    CircularProgress,
    ImageList,
    ImageListItem,
    Stack,
    Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Photo } from "../services/views";
import { useVisibility } from "../atoms/visibility";
import { Link, useLocation, useNavigate } from "react-router-dom";

const ImageCard = observer(
    ({ value, directoryId }: { value: Photo; directoryId: number }) => {
        const { directoriesStore } = useStores();

        return (
            <ImageListItem
                component={Link}
                to={`/directory/${directoryId}/images/${value.id}`}
                sx={{ minHeight: 200 }}
            >
                <img
                    src={directoriesStore.getThumbnail(directoryId, value.id)}
                    alt={value.name}
                    loading="lazy"
                />
                {value.video && <PlayArrowIcon sx={{ fontSize: 140 }} />}
            </ImageListItem>
        );
    }
);

function createUrl(
    directoryId: number,
    order: "date-desc" | "date-asc",
    image: number
) {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.set("order", order);
    urlSearchParams.set("image", image.toString());
    return `/directory/${directoryId}?${urlSearchParams}`;
}

export const ImagesView = observer(function ImagesView({
    directoryId,
}: {
    directoryId: number;
}) {
    const { directoriesStore, usersStore } = useStores();
    const [needNextPage, setNextPageNeeded] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const order =
        params.get("order") === "date-desc" ? "date-desc" : "date-asc";
    const [image, setImage] = useState(parseInt(params.get("image") || "0"));
    const directoryContent =
        directoriesStore.contentLoader.getValue(directoryId);
    let values = directoryContent || [];
    const sortedValues = order === "date-desc" ? values.reverse() : values;
    const pageSize = 9;
    let imageIndex = sortedValues.findIndex((x) => x.id === image);
    if (imageIndex < 0) imageIndex = 0;
    const page = sortedValues.slice(0, imageIndex + pageSize);
    const hasMorePages = page.length < sortedValues.length;
    const handleSortDateDesc = useCallback(
        () => navigate(createUrl(directoryId, "date-desc", image)),
        [navigate, directoryId, image]
    );
    const handleSortDateAsc = useCallback(
        () => navigate(createUrl(directoryId, "date-asc", image)),
        [navigate, directoryId, image]
    );
    const handleNextPage = useCallback(() => {
        setNextPageNeeded(true);
        const newImageIndex = Math.min(
            sortedValues.length - pageSize,
            imageIndex + pageSize
        );
        const newImageId = sortedValues[newImageIndex].id;
        setImage(newImageId);
        navigate(createUrl(directoryId, order, newImageId), {
            replace: true,
        });
        setTimeout(() => setNextPageNeeded(false), 100);
    }, [sortedValues, imageIndex, navigate, directoryId, order]);
    const [ref, visible] = useVisibility<HTMLDivElement>();

    useEffect(() => {
        if (visible && hasMorePages && !needNextPage) {
            console.log("need next page");
            handleNextPage();
        }
    }, [handleNextPage, hasMorePages, needNextPage, visible]);

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
                        >
                            Plus récent en premier
                        </Button>
                        <Button
                            onClick={handleSortDateAsc}
                            color={
                                order !== "date-desc" ? "primary" : "inherit"
                            }
                        >
                            Plus ancien en premier
                        </Button>
                    </Stack>
                )}
            </Stack>
            <ImageList>
                {page.map((x) => (
                    <ImageCard directoryId={directoryId} value={x} key={x.id} />
                ))}
            </ImageList>
            {hasMorePages && (
                <div ref={ref}>
                    {visible && <CircularProgress />}
                    {!visible && <VisibilityIcon />}
                </div>
            )}
        </>
    );
});
