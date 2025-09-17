import { ChangeEvent, lazy, Suspense, useCallback } from "react";
import { observer } from "mobx-react-lite";
import {
    Container,
    Typography,
    CircularProgress,
    Stack,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    styled,
    Switch,
    useMediaQuery,
    useTheme,
    Box,
} from "@mui/material";
import { ImagesView } from "./images-view";
import {
    Route,
    Link as RouterLink,
    Routes,
    useNavigate,
    useParams,
} from "react-router-dom";
import { Directory } from "../services/views";
import placeholder from "../assets/placeholder.png";
import { useDirectoriesStore } from "../stores/directories";
import { useDirectoryVisibilitiesStore } from "../stores/directory-visibilities";
import { useMembersStore } from "../stores/members";
const ImageView = lazy(() => import("./image-view/image-view"));

export interface DirectoryViewProps {
    id: number;
}

const Image = styled("img")(({ theme }) => ({
    objectFit: "cover",
    width: "100%",
    height: "100%",
    borderRadius: theme.shape.borderRadius * 2,
}));

const SubdirectoryCard = observer(({ directory }: { directory: Directory }) => {
    const directoriesStore = useDirectoriesStore();
    const visibilitiesStore = useDirectoryVisibilitiesStore();
    const membersStore = useMembersStore();

    const visibilities = visibilitiesStore.visibilities;

    const handleVisibilityToggle = useCallback(
        (visibilityValue: number) =>
            (e: ChangeEvent<HTMLInputElement>, checked: boolean) => {
                let newVisibility = directory.visibility & ~visibilityValue;
                if (checked) newVisibility |= visibilityValue;
                directoriesStore.patchDirectory(directory, {
                    visibility: newVisibility,
                });
                e.preventDefault();
            },
        [directoriesStore, directory]
    );

    return (
        <ImageListItem sx={{ color: "inherit", textDecoration: "none" }}>
            <RouterLink to={`directory/${directory.id}`}>
                {directory.coverPhotoId && (
                    <Image
                        src={directoriesStore.getThumbnail(
                            directory.id,
                            directory.coverPhotoId
                        )}
                        alt={directory.name}
                        loading="lazy"
                        sx={{ height: 260, objectFit: "cover" }}
                    />
                )}
                {!directory.coverPhotoId && (
                    <Image
                        src={placeholder}
                        alt={directory.name}
                        loading="lazy"
                        sx={{ height: 260 }}
                    />
                )}
            </RouterLink>
            <ImageListItemBar
                title={directory.name}
                subtitle={
                    <Stack direction="row" alignItems="center" flexWrap="wrap">
                        {directory.numberOfPhotos > 0 && (
                            <>
                                {directory.numberOfPhotos} élément
                                {directory.numberOfPhotos > 1 ? "s" : ""}{" "}
                                {" · "}
                            </>
                        )}
                        {directory.numberOfSubDirectories > 0 && (
                            <>
                                {directory.numberOfSubDirectories} album
                                {directory.numberOfSubDirectories > 1
                                    ? "s"
                                    : ""}
                                {" · "}
                            </>
                        )}
                        {membersStore.administrator &&
                            visibilities.map((visibility) => (
                                <Box
                                    key={visibility.id}
                                    display="flex"
                                    alignItems="center"
                                >
                                    <Switch
                                        color="primary"
                                        size="small"
                                        checked={
                                            (directory.visibility &
                                                visibility.value) >
                                            0
                                        }
                                        onChange={handleVisibilityToggle(
                                            visibility.value
                                        )}
                                    />
                                    <Box
                                        component="span"
                                        dangerouslySetInnerHTML={{
                                            __html: visibility.icon,
                                        }}
                                        sx={{ ml: -1, mr: 0.5 }}
                                    />
                                </Box>
                            ))}
                    </Stack>
                }
                position="below"
            />
        </ImageListItem>
    );
});

const Subdirectories = observer(({ id }: { id: number }) => {
    const directoriesStore = useDirectoriesStore();
    const directories = directoriesStore.subDirectoriesLoader.getValue(id);
    const theme = useTheme();
    const matchDownMd = useMediaQuery(theme.breakpoints.down("md"));
    if (!directories) return <CircularProgress />;
    if (directories.length === 0) return <></>;
    return (
        <>
            <Typography variant="h5">Albums</Typography>
            <ImageList cols={matchDownMd ? 2 : 4} gap={16}>
                {directories.map((x) => (
                    <SubdirectoryCard key={x.id} directory={x} />
                ))}
            </ImageList>
        </>
    );
});

export const DirectoryView = observer(({ id }: { id: number }) => {
    return (
        <>
            <Container maxWidth="lg">
                <Stack direction="column" spacing={2}>
                    <Subdirectories id={Number(id)} />
                    <ImagesView directoryId={Number(id)} />
                </Stack>
            </Container>
            <Routes>
                <Route
                    path="images/:id"
                    element={
                        <Suspense>
                            <ImageView directoryId={id} />
                        </Suspense>
                    }
                />
            </Routes>
        </>
    );
});

export function DirectoryPage() {
    const { id } = useParams();
    return <DirectoryView id={Number(id)} />;
}

export const RootDirectoryPage = observer(function RootDirectoryPage() {
    const directoriesStore = useDirectoriesStore();
    const root = directoriesStore.root;
    const navigate = useNavigate();
    if (!root) {
        if (directoriesStore.isInError) {
            navigate(`/g/${directoriesStore.galleryId}/settings/gallery`, {
                replace: true,
            });
        }
        return <CircularProgress />;
    }
    return <DirectoryView id={root.id} />;
});
