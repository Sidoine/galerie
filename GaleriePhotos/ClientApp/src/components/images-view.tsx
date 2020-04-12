import { observer } from "mobx-react-lite";
import React, { useState, useCallback } from "react";
import { useStores } from "../stores";
import {
    makeStyles,
    Card,
    CardActionArea,
    CardMedia,
    Grid,
    CardActions,
    Switch,
} from "@material-ui/core";
import VisibilityIcon from "@material-ui/icons/Visibility";

import { Photo } from "../services/views";
import { Visibility } from "../atoms/visibility";
import { useHistory } from "react-router-dom";
const useStyles = makeStyles({
    root: {
        width: 270,
    },
    media: {
        height: 140,
    },
});

const ImageCard = observer(
    ({ value, directoryId }: { value: Photo; directoryId: number }) => {
        const classes = useStyles();
        const history = useHistory();
        const { directoriesStore, usersStore } = useStores();
        const handleSwitchVisible = useCallback(
            (_: unknown, checked: boolean) => {
                directoriesStore.patchPhoto(directoryId, value, {
                    visible: checked,
                });
            },
            [directoriesStore, directoryId, value]
        );

        return (
            <Card className={classes.root}>
                <CardActionArea
                    onClick={() =>
                        history.push(
                            `/directory/${directoryId}/images/${value.id}`
                        )
                    }
                >
                    <CardMedia
                        className={classes.media}
                        image={directoriesStore.getThumbnail(
                            directoryId,
                            value.id
                        )}
                        title={value.name}
                    />
                </CardActionArea>
                <CardActions>
                    {usersStore.isAdministrator && (
                        <>
                            <Switch
                                color="primary"
                                checked={value.visible}
                                onChange={handleSwitchVisible}
                            />
                            <VisibilityIcon />
                        </>
                    )}
                </CardActions>
            </Card>
        );
    }
);

export const ImagesView = observer(
    ({ directoryId }: { directoryId: number }) => {
        const { directoriesStore } = useStores();
        const [pages, setPages] = useState(1);
        const value =
            directoriesStore.contentLoader
                .getValue(directoryId)
                ?.slice(0, pages * 10) || [];
        return (
            <>
                <Grid container spacing={4} wrap="wrap">
                    {value.map((x) => (
                        <Grid item key={x.id}>
                            <ImageCard directoryId={directoryId} value={x} />
                        </Grid>
                    ))}
                </Grid>
                <Visibility
                    onChange={(x) => {
                        if (x) setPages(pages + 1);
                    }}
                />
            </>
        );
    }
);
