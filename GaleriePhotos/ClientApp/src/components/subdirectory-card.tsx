import {
    ImageListItem,
    ImageListItemBar,
    Stack,
    Box,
    Switch,
    styled,
    IconButton,
    Menu,
    MenuItem,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { useCallback, ChangeEvent, useState } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Directory } from "../services/views";
import { useDirectoriesStore } from "../stores/directories";
import { useDirectoryVisibilitiesStore } from "../stores/directory-visibilities";
import { useMembersStore } from "../stores/members";
import { Link as RouterLink } from "react-router-dom";
import placeholder from "../assets/placeholder.png";

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

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleUseAsParentCover = useCallback(async () => {
        handleMenuClose();
        try {
            await directoriesStore.setParentCover(directory.id);
        } catch (error) {
            console.error("Failed to set parent cover:", error);
        }
    }, [directory.id, handleMenuClose, directoriesStore]);

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
            <RouterLink
                to={`/g/${directoriesStore.galleryId}/directory/${directory.id}`}
            >
                {directory.coverPhotoId && (
                    <Image
                        src={directoriesStore.getThumbnail(
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
                actionIcon={
                    membersStore.administrator && (
                        <IconButton
                            color="inherit"
                            onClick={handleMenuClick}
                            size="small"
                        >
                            <MoreVertIcon />
                        </IconButton>
                    )
                }
                position="below"
            />
            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleUseAsParentCover}>
                    Utiliser cette couverture pour le répertoire parent
                </MenuItem>
            </Menu>
        </ImageListItem>
    );
});

export default SubdirectoryCard;
