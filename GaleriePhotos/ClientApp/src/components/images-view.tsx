import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { useStores } from "../stores";
import {
  makeStyles,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  Grid,
  Container
} from "@material-ui/core";
import { Photo } from "../services/views";
import InfiniteScroll from "react-infinite-scroller";
const useStyles = makeStyles({
  root: {
    maxWidth: 345
  },
  media: {
    height: 140
  }
});

function ImageCard({ value }: { value: Photo }) {
  const classes = useStyles();
  return (
    <Card className={classes.root}>
      <CardActionArea>
        <CardMedia
          className={classes.media}
          image={value.url}
          title={value.name}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="h2">
            {value.name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export const ImagesView = observer(({ path }: { path: string | null }) => {
  const { directoriesStore } = useStores();
  const [pages, setPages] = useState(1);
  const value =
    directoriesStore.contentLoader.getValue(path)?.slice(0, pages * 10) || [];
  return (
    <Container maxWidth="lg">
      <InfiniteScroll
        pageStart={0}
        loadMore={p => setPages(p)}
        hasMore={pages <= value.length / 10}
      >
        <Grid container spacing={4} wrap="wrap">
          {value.map(x => (
            <Grid item>
              {" "}
              <ImageCard value={x} key={x.name} />
            </Grid>
          ))}
        </Grid>
      </InfiniteScroll>
    </Container>
  );
});
