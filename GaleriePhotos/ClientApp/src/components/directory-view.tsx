import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores";
import {
    Switch,
    Container,
    SvgIcon,
    Grid,
    Card,
    CardActions,
    Typography,
    makeStyles,
    CardActionArea,
    Breadcrumbs,
    Link,
    CircularProgress,
} from "@material-ui/core";
import { ImagesView } from "./images-view";
import { useHistory, Link as RouterLink } from "react-router-dom";
import { Directory } from "../services/views";
import { DirectoryVisibility } from "../services/enums";

export interface DirectoryViewProps {
    id: number;
}

const Woman = () => (
    <SvgIcon>
        <path
            fill="currentColor"
            d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M10.5,22V16H7.5L10.09,8.41C10.34,7.59 11.1,7 12,7C12.9,7 13.66,7.59 13.91,8.41L16.5,16H13.5V22H10.5Z"
        />
    </SvgIcon>
);

const Man = () => {
    return (
        <SvgIcon>
            <path
                fill="currentColor"
                d="M11.95,9.27C13.96,9.27 15.59,7.64 15.59,5.63C15.59,3.63 13.96,2 11.95,2C9.94,2 8.32,3.63 8.32,5.63C8.32,7.64 9.94,9.27 11.95,9.27M9.36,12.97C9.36,12.97 8.27,15.94 7.96,16.5C7.85,16.71 7.87,16.77 7.6,16.77C7.33,16.77 6.91,16.5 6.91,16.5C6.91,16.5 6.71,16.37 6.79,16.14C7.03,15.4 8.12,11.08 8.35,10.25C8.6,9.36 9.28,9.39 9.28,9.39H9.93L12.03,13.04L14.14,9.39H14.92C14.92,9.39 15.23,9.43 15.46,9.7C15.7,9.97 15.75,10.44 15.75,10.44L17.14,15.84C17.14,15.84 17.24,16.22 17.21,16.33C17.17,16.5 17.08,16.5 17.08,16.5C17.08,16.5 16.69,16.62 16.47,16.69C16.07,16.82 16,16.44 16,16.44L14.7,13.04L14.55,22H12.6L12.27,16.89C12.27,16.89 12.21,16.76 12.03,16.76C11.86,16.76 11.8,16.89 11.8,16.89L11.45,22H9.5L9.37,12.97H9.36Z"
            />
        </SvgIcon>
    );
};

const useStyles = makeStyles({
    card: {
        width: "300px",
    },
});

const SubdirectoryCard = observer(({ directory }: { directory: Directory }) => {
    const history = useHistory();
    const classes = useStyles();
    const { directoriesStore, usersStore } = useStores();
    const handleMyleneSwitch = useCallback(
        (e: unknown, checked: boolean) => {
            let visibility = directory.visibility & ~DirectoryVisibility.Mylene;
            if (checked) visibility |= DirectoryVisibility.Mylene;
            directoriesStore.patchDirectory(directory, { visibility });
        },
        [directoriesStore, directory]
    );
    const handleSidoineSwitch = useCallback(
        (e: unknown, checked: boolean) => {
            let visibility =
                directory.visibility & ~DirectoryVisibility.Sidoine;
            if (checked) visibility |= DirectoryVisibility.Sidoine;
            directoriesStore.patchDirectory(directory, { visibility });
        },
        [directoriesStore, directory]
    );

    return (
        <Card className={classes.card}>
            <CardActionArea
                onClick={() => history.push(`/directory/${directory.id}`)}
            >
                <Typography variant="h6">{directory.name}</Typography>{" "}
            </CardActionArea>
            <CardActions>
                {usersStore.isAdministrator && (
                    <>
                        <Switch
                            color="primary"
                            checked={
                                (directory.visibility &
                                    DirectoryVisibility.Mylene) >
                                0
                            }
                            onChange={handleMyleneSwitch}
                        />
                        <Woman />
                        <Switch
                            color="secondary"
                            checked={
                                (directory.visibility &
                                    DirectoryVisibility.Sidoine) >
                                0
                            }
                            onChange={handleSidoineSwitch}
                        />
                        <Man />
                    </>
                )}
            </CardActions>
        </Card>
    );
});

const Subdirectories = observer(({ id }: { id: number }) => {
    const { directoriesStore } = useStores();
    const directories = directoriesStore.subDirectoriesLoader.getValue(id);
    if (!directories) return <CircularProgress />;
    return (
        <Grid container spacing={4}>
            {directories.map((x) => (
                <Grid item key={x.id}>
                    <SubdirectoryCard directory={x} />
                </Grid>
            ))}
        </Grid>
    );
});

export const DirectoryView = observer(({ id }: DirectoryViewProps) => {
    const { directoriesStore } = useStores();
    const directory = directoriesStore.infoLoader.getValue(id);
    return (
        <Container maxWidth="lg">
            <Grid container direction="column" spacing={2}>
                <Grid item>
                    <Breadcrumbs>
                        <Link component={RouterLink} to="/">
                            Galerie
                        </Link>
                        {directory &&
                            directory.parent &&
                            directory.parent.name && (
                                <Link
                                    component={RouterLink}
                                    to={`/directory/${directory.parent.id}`}
                                >
                                    {directory.parent.name}
                                </Link>
                            )}
                        {directory && directory.name && (
                            <Typography color="textPrimary">
                                {directory.name}
                            </Typography>
                        )}
                    </Breadcrumbs>
                </Grid>
                <Grid item>
                    <Subdirectories id={id} />
                </Grid>
                <Grid item>
                    <ImagesView directoryId={id} />
                </Grid>
            </Grid>
        </Container>
    );
});

export const RootDirectoryView = observer(() => {
    const { directoriesStore } = useStores();
    const root = directoriesStore.rootLoader.getValue();
    if (!root) return <></>;
    return <DirectoryView id={root.id} />;
});
