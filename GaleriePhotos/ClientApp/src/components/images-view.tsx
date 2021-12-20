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
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from "@material-ui/core";
import VisibilityIcon from "@material-ui/icons/Visibility";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { Photo } from "../services/views";
import { Visibility } from "../atoms/visibility";
import { Link, useHistory, useLocation } from "react-router-dom";

const useStyles = makeStyles({
  root: {
    width: 270,
  },
  media: {
    height: 140,
  },
  video: {
    fontSize: 140,
  },
  action: {
    textAlign: "center",
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
          className={classes.action}
          component={Link}
          to={`/directory/${directoryId}/images/${value.id}`}
        >
          <CardMedia
            className={classes.media}
            image={directoriesStore.getThumbnail(directoryId, value.id)}
            title={value.name}
          >
            {value.video && <PlayArrowIcon className={classes.video} />}
          </CardMedia>
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

enum DialogMode {
  Closed,
  SeeAll,
  HideAll,
}

function createUrl(
  directoryId: number,
  order: "date-desc" | "date-asc",
  pages: number
) {
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.set("order", order);
  urlSearchParams.set("page", pages.toString());
  return `/directory/${directoryId}?${urlSearchParams}`;
}

export const ImagesView = observer(
  ({ directoryId }: { directoryId: number }) => {
    const { directoriesStore, usersStore } = useStores();
    const [needNextPage, setNextPageNeeded] = useState(false);
    const history = useHistory();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const order =
      params.get("order") === "date-desc" ? "date-desc" : "date-asc";
    const [pages, setPages] = useState(parseInt(params.get("page") || "1"));
    const directoryContent =
      directoriesStore.contentLoader.getValue(directoryId);
    let values = directoryContent || [];
    const [onlyHidden, setOnlyHidden] = useState(false);
    const handleSetOnlyHidden = useCallback((_: unknown, checked: boolean) => {
      setOnlyHidden(checked);
    }, []);
    if (onlyHidden) {
      values = values.filter((x) => !x.visible);
    }
    const sortedValues = order === "date-desc" ? values.reverse() : values;
    const pageSize = 9;
    const page = sortedValues.slice(0, pages * pageSize);
    const [dialogMode, setDialogMode] = useState(DialogMode.Closed);
    const handleConfirm = useCallback(async () => {
      if (dialogMode === DialogMode.SeeAll) {
        await directoriesStore.patchAll(directoryId, { visible: true });
      } else if (dialogMode === DialogMode.HideAll) {
        await directoriesStore.patchAll(directoryId, {
          visible: false,
        });
      }
      setDialogMode(DialogMode.Closed);
    }, [directoriesStore, directoryId, dialogMode]);
    const handleCancel = useCallback(() => {
      setDialogMode(DialogMode.Closed);
    }, []);
    const handleShowAll = useCallback(() => {
      setDialogMode(DialogMode.SeeAll);
    }, []);
    const handleHideAll = useCallback(() => {
      setDialogMode(DialogMode.HideAll);
    }, []);
    const handleSortDateDesc = useCallback(
      () => history.push(createUrl(directoryId, "date-desc", pages)),
      [history, directoryId]
    );
    const handleSortDateAsc = useCallback(
      () => history.push(createUrl(directoryId, "date-asc", pages)),
      [history, directoryId]
    );
    const handleNextPage = useCallback(
      (visible) => {
        setNextPageNeeded(visible);
        setPages(pages + 1);
        history.replace(createUrl(directoryId, order, pages + 1));
        setTimeout(() => setNextPageNeeded(false), 0);
      },
      [pages]
    );
    return (
      <>
        <Dialog open={dialogMode !== DialogMode.Closed} onClose={handleCancel}>
          <DialogTitle>Veuillez confirmer</DialogTitle>
          <DialogContent>
            {dialogMode === DialogMode.HideAll
              ? "Cacher toutes les photos ?"
              : "Montrer toutes les photos ?"}
          </DialogContent>
          <DialogActions>
            <Button color="secondary" onClick={handleCancel}>
              Annuler
            </Button>
            <Button color="primary" onClick={handleConfirm}>
              Confirmer
            </Button>
          </DialogActions>
        </Dialog>
        <Grid container spacing={1}>
          {directoryContent === null && <CircularProgress />}
          {values.length > 0 && usersStore.isAdministrator && (
            <>
              <Grid item>
                <Button onClick={handleShowAll}>Tout montrer</Button>
              </Grid>
              <Grid item>
                <Button onClick={handleHideAll}>Tout cacher</Button>
              </Grid>
              <Grid item>
                <FormControlLabel
                  label="Que les cachées"
                  control={
                    <Checkbox
                      checked={onlyHidden}
                      onChange={handleSetOnlyHidden}
                    />
                  }
                />
              </Grid>
            </>
          )}
          {values.length > 0 && (
            <Grid item>
              <Button
                onClick={handleSortDateDesc}
                color={order === "date-desc" ? "primary" : "default"}
              >
                Plus récent en premier
              </Button>
              <Button
                onClick={handleSortDateAsc}
                color={order !== "date-desc" ? "primary" : "default"}
              >
                Plus ancien en premier
              </Button>
            </Grid>
          )}
        </Grid>
        <Grid container spacing={4} wrap="wrap">
          {page.map((x) => (
            <Grid item key={x.id}>
              <ImageCard directoryId={directoryId} value={x} />
            </Grid>
          ))}
        </Grid>
        {pages * pageSize < values.length && (
          <Visibility onChange={handleNextPage} visible={needNextPage} />
        )}
      </>
    );
  }
);
