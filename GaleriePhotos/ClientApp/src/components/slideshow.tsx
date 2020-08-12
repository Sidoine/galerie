import { useStores } from "../stores";
import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { makeStyles, IconButton } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import CloseIcon from "@material-ui/icons/Close";

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
        height: "100vh",
        width: "100vw",
        backgroundColor: "black",
        textAlign: "center",
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
            if (image?.nextVisibleId)
                history.push(
                    `/directory/${directoryId}/images/${image?.nextVisibleId}/slideshow`
                );
            else history.push(`/directory/${directoryId}/images/${id}`);
        }, [history, directoryId, image, id]);
        const handleClose = useCallback(() => {
            history.push(`/directory/${directoryId}/images/${id}`);
        }, [history, directoryId, id]);

        if (image) {
            return (
                <div className={classes.root}>
                    <img
                        alt=""
                        src={directoriesStore.getImage(directoryId, id)}
                        className={classes.image}
                        onClick={handleNext}
                    />
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
