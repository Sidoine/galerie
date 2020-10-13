import { useStores } from "../stores";
import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { makeStyles, IconButton } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import CloseIcon from "@material-ui/icons/Close";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";

const useStyles = makeStyles((x) => ({
    image: {
        maxWidth: "100%",
        maxHeight: "100%",
        imageOrientation: "from-image",
    },
    root: {
        top: 0,
        left: 0,
        position: "absolute",
        height: "100%",
        width: "100%",
        backgroundColor: "black",
        textAlign: "center",
        overflow: "hidden",
    },
    close: {
        position: "absolute",
        right: x.spacing(2),
        top: x.spacing(2),
        opacity: 0,
        "&:hover": {
            opacity: 1,
        },
    },
    previous: {
        position: "absolute",
        left: 0,
        padding: x.spacing(2),
        top: 0,
        opacity: 0,
        "&:hover": {
            opacity: 1,
        },
        height: "100%",
        width: x.spacing(15),
        color: x.palette.common.white,
        display: "flex",
        alignItems: "center",
        background:
            "linear-gradient(to right, rgba(255,255,255,0.3), rgba(0,0,0,0))",
    },
    next: {
        position: "absolute",
        right: 0,
        padding: x.spacing(2),
        top: 0,
        opacity: 0,
        "&:hover": {
            opacity: 1,
        },
        height: "100%",
        width: x.spacing(15),
        color: x.palette.common.white,
        display: "flex",
        alignItems: "center",
        background:
            "linear-gradient(to left, rgba(255,255,255,0.3), rgba(0,0,0,0))",
    },
}));

export const SlideShow = observer(
    ({ id, directoryId }: { id: number; directoryId: number }) => {
        const { directoriesStore } = useStores();
        const classes = useStyles();
        const image = directoriesStore.imageLoader.getValue({
            directoryId,
            id,
        });
        const history = useHistory();
        const handleNext = useCallback(() => {
            if (image && image.nextVisibleId)
                history.push(
                    `/directory/${directoryId}/images/${image.nextVisibleId}/slideshow`
                );
            else history.push(`/directory/${directoryId}/images/${id}`);
        }, [history, directoryId, image, id]);
        const handlePrevious = useCallback(() => {
            if (image && image.previousVisibleId)
                history.push(
                    `/directory/${directoryId}/images/${image.previousVisibleId}/slideshow`
                );
            else history.push(`/directory/${directoryId}/images/${id}`);
        }, [history, directoryId, image, id]);
        const handleClose = useCallback(() => {
            history.push(`/directory/${directoryId}/images/${id}`);
        }, [history, directoryId, id]);
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
                <div className={classes.root}>
                    {image.video && (
                        <video
                            autoPlay
                            controls
                            src={directoriesStore.getImage(directoryId, id)}
                            className={classes.image}
                        />
                    )}
                    {!image.video && (
                        <img
                            alt=""
                            src={directoriesStore.getImage(directoryId, id)}
                            className={classes.image}
                            onClick={handleNext}
                        />
                    )}
                    <div className={classes.previous} onClick={handlePrevious}>
                        <ArrowBackIcon />
                    </div>
                    <div className={classes.next} onClick={handleNext}>
                        <ArrowForwardIcon />
                    </div>
                    <IconButton
                        color="primary"
                        onClickCapture={handleClose}
                        className={classes.close}
                    >
                        <CloseIcon />
                    </IconButton>
                </div>
            );
        }
        return <div>...</div>;
    }
);
