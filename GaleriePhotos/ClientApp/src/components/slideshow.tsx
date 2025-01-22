import { useStores } from "../stores";
import React, { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { IconButton, Box, useTheme, Stack, Icon, styled } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { ImageDetails } from "./image-details";

const WhiteButton = styled(IconButton)(({ theme }) => ({
    color: theme.palette.common.white,
}));

export const SlideShow = observer(function SlideShow({
    directoryId,
}: {
    directoryId: number;
}) {
    const { id } = useParams();
    const { directoriesStore } = useStores();
    const image =
        directoryId && id
            ? directoriesStore.imageLoader.getValue(
                  Number(directoryId),
                  Number(id)
              )
            : null;
    const theme = useTheme();
    const navigate = useNavigate();
    const handleNext = useCallback(() => {
        if (image && image.nextId)
            navigate(
                `/directory/${directoryId}/images/${image.nextId}/slideshow`
            );
        else navigate(`/directory/${directoryId}/images/${id}`);
    }, [navigate, directoryId, image, id]);
    const handlePrevious = useCallback(() => {
        if (image && image.previousId)
            navigate(
                `/directory/${directoryId}/images/${image.previousId}/slideshow`
            );
        else navigate(`/directory/${directoryId}/images/${id}`);
    }, [navigate, directoryId, image, id]);
    const handleClose = useCallback(() => {
        navigate(`/directory/${directoryId}`);
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

    const [details, setDetails] = useState(false);
    const handleDetailsClose = useCallback(() => {
        setDetails(false);
    }, []);

    const handleDetailsToggle = useCallback(() => {
        setDetails((x) => !x);
    }, []);

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
            <Stack direction="row" justifyContent="space-between">
                <WhiteButton onClickCapture={handleClose}>
                    <ArrowBackIcon />
                </WhiteButton>
                <WhiteButton onClickCapture={handleDetailsToggle}>
                    <InfoOutlined />
                </WhiteButton>
            </Stack>
            {image && (
                <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                        flex: "1 0",
                        maxHeight: "100%",
                        position: "relative",
                    }}
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
                </Stack>
            )}
            {image && (
                <ImageDetails
                    image={image}
                    onClose={handleDetailsClose}
                    open={details}
                />
            )}
        </Stack>
    );
});
