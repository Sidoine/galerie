import { useStores } from "../stores";
import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { IconButton, Box, useTheme } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export const SlideShow = observer(() => {
    const { directoryId, id } = useParams();
    const { directoriesStore } = useStores();
    const image = directoriesStore.imageLoader.getValue(
        Number(directoryId),
        Number(id)
    );
    const theme = useTheme();
    const navigate = useNavigate();
    const handleNext = useCallback(() => {
        if (image && image.nextVisibleId)
            navigate(
                `/directory/${directoryId}/images/${image.nextVisibleId}/slideshow`
            );
        else navigate(`/directory/${directoryId}/images/${id}`);
    }, [navigate, directoryId, image, id]);
    const handlePrevious = useCallback(() => {
        if (image && image.previousVisibleId)
            navigate(
                `/directory/${directoryId}/images/${image.previousVisibleId}/slideshow`
            );
        else navigate(`/directory/${directoryId}/images/${id}`);
    }, [navigate, directoryId, image, id]);
    const handleClose = useCallback(() => {
        navigate(`/directory/${directoryId}/images/${id}`);
    }, [navigate, directoryId, id]);
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

    if (image) {
        return (
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    position: "absolute",
                    height: "100%",
                    width: "100%",
                    backgroundColor: "black",
                    textAlign: "center",
                    overflow: "hidden",
                }}
            >
                {image.video && (
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
                {!image.video && (
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
                <IconButton
                    color="primary"
                    onClickCapture={handleClose}
                    sx={{
                        position: "absolute",
                        right: theme.spacing(2),
                        top: theme.spacing(2),
                        opacity: 0,
                        "&:hover": {
                            opacity: 1,
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>
        );
    }
    return <div>...</div>;
});
