import { useStores } from "../../stores";
import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Box, useTheme, Stack } from "@mui/material";
import { useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { ImageDetails } from "./image-details";
import { useSwipeable } from "react-swipeable";
import TopActions from "./top-actions";
import { useUi } from "../../stores/ui";

export default observer(function ImageView({
    directoryId,
}: {
    directoryId: number;
}) {
    const { id } = useParams();
    const { directoriesStore } = useStores();
    const photo =
        directoryId && id
            ? directoriesStore.imageLoader.getValue(
                  Number(directoryId),
                  Number(id)
              )
            : null;
    const { navigateToPhoto, navigateToDirectory } = useUi();
    const theme = useTheme();
    const handleNext = useCallback(() => {
        if (photo && photo.nextId) navigateToPhoto(directoryId, photo.nextId);
    }, [navigateToPhoto, directoryId, photo]);
    const handlePrevious = useCallback(() => {
        if (photo && photo.previousId)
            navigateToPhoto(directoryId, photo.previousId);
    }, [navigateToPhoto, directoryId, photo]);
    const handleClose = useCallback(() => {
        navigateToDirectory(directoryId);
    }, [navigateToDirectory, directoryId]);
    const handleKeyPress = useCallback(
        (e: KeyboardEvent) => {
            if (e.code === "ArrowLeft") {
                handlePrevious();
            } else if (e.code === "ArrowRight") {
                handleNext();
            }
        },
        [handleNext, handlePrevious]
    );
    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [handleKeyPress]);

    const [details, setDetails] = useState(false);
    const handleDetailsClose = useCallback(() => {
        setDetails(false);
    }, []);
    const handleDetailsToggle = useCallback(() => {
        setDetails((prev) => !prev);
    }, []);

    const handlers = useSwipeable({
        onSwipedLeft: handleNext,
        onSwipedRight: handlePrevious,
    });

    return (
        <Stack
            sx={{
                top: 0,
                left: 0,
                position: "fixed",
                height: "100%",
                width: "100%",
                backgroundColor: "black",
                textAlign: "center",
                overflow: "hidden",
                zIndex: 2000,
            }}
        >
            {photo && (
                <TopActions
                    onClose={handleClose}
                    onDetailsToggle={handleDetailsToggle}
                    directoryId={directoryId}
                    photo={photo}
                />
            )}
            {photo && (
                <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                        flex: "1 0",
                        maxHeight: "100%",
                        position: "relative",
                    }}
                    {...handlers}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            left: 0,
                            p: 2,
                            top: 0,
                            opacity: 0,
                            "&:hover": {
                                opacity: 1,
                            },
                            height: "100%",
                            width: theme.spacing(15),
                            color: theme.palette.common.white,
                            display: "flex",
                            alignItems: "center",
                            background:
                                "linear-gradient(to right, rgba(255,255,255,0.3), rgba(0,0,0,0))",
                        }}
                        onClick={handlePrevious}
                    >
                        <ArrowBackIcon />
                    </Box>
                    <Box
                        sx={{
                            position: "absolute",
                            right: 0,
                            padding: theme.spacing(2),
                            top: 0,
                            opacity: 0,
                            "&:hover": {
                                opacity: 1,
                            },
                            height: "100%",
                            width: theme.spacing(15),
                            color: theme.palette.common.white,
                            display: "flex",
                            alignItems: "center",
                            background:
                                "linear-gradient(to left, rgba(255,255,255,0.3), rgba(0,0,0,0))",
                        }}
                        onClick={handleNext}
                    >
                        <ArrowForwardIcon />
                    </Box>
                    {photo.video && (
                        <Box
                            component="video"
                            autoPlay
                            controls
                            src={directoriesStore.getImage(
                                Number(directoryId),
                                Number(id)
                            )}
                            sx={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                imageOrientation: "from-image",
                            }}
                        />
                    )}
                    {!photo.video && (
                        <Box
                            component="img"
                            alt=""
                            src={directoriesStore.getImage(
                                Number(directoryId),
                                Number(id)
                            )}
                            sx={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                imageOrientation: "from-image",
                            }}
                            onClick={handleNext}
                        />
                    )}
                </Stack>
            )}
            {photo && (
                <ImageDetails
                    image={photo}
                    onClose={handleDetailsClose}
                    open={details}
                />
            )}
        </Stack>
    );
});
