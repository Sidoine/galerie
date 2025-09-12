import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton, Menu, MenuItem, Stack, styled } from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useCallback, useState } from "react";
import { PhotoFull } from "../../services/views";
import { useUsersStore } from "../../stores/users";
import { useDirectoriesStore } from "../../stores/directories";

const WhiteButton = styled(IconButton)(({ theme }) => ({
    color: theme.palette.common.white,
}));

function TopActions({
    onDetailsToggle,
    onClose,
    directoryId,
    photo,
}: {
    onDetailsToggle: () => void;
    onClose: () => void;
    directoryId: number;
    photo: PhotoFull;
}) {
    const directoriesStore = useDirectoriesStore();
    const usersStore = useUsersStore();
    const handleMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleCloseMenu = useCallback(() => {
        setAnchorEl(null);
    }, []);
    const open = Boolean(anchorEl);
    const handleCoverClick = useCallback(async () => {
        handleCloseMenu();
        directoriesStore.patchDirectoryAndClearCache(directoryId, {
            coverPhotoId: photo.id,
        });
    }, [directoriesStore, directoryId, handleCloseMenu, photo.id]);
    const handleShareClick = useCallback(() => {
        handleCloseMenu();
        directoriesStore.setAccess(directoryId, photo, false);
    }, [directoriesStore, directoryId, handleCloseMenu, photo]);
    const handleUnshareClick = useCallback(() => {
        handleCloseMenu();
        directoriesStore.setAccess(directoryId, photo, true);
    }, [directoriesStore, directoryId, handleCloseMenu, photo]);
    const handleRotate = useCallback(
        async (angle: number) => {
            handleCloseMenu();
            await directoriesStore.rotatePhoto(directoryId, photo, angle);
        },
        [handleCloseMenu, directoriesStore, directoryId, photo]
    );
    const handleRotateLeft = useCallback(() => {
        handleRotate(270);
    }, [handleRotate]);

    const handleRotateRight = useCallback(() => {
        handleRotate(90);
    }, [handleRotate]);

    return (
        <Stack direction="row" justifyContent="space-between">
            <WhiteButton onClickCapture={onClose}>
                <ArrowBackIcon />
            </WhiteButton>
            <Stack direction="row" spacing={2}>
                <WhiteButton onClickCapture={onDetailsToggle}>
                    <InfoOutlined />
                </WhiteButton>
                {usersStore.isAdministrator && (
                    <WhiteButton onClickCapture={handleMenu}>
                        <MoreVertIcon />
                    </WhiteButton>
                )}
                <Menu
                    sx={{ zIndex: 4000 }}
                    onClose={handleCloseMenu}
                    open={open}
                    anchorEl={anchorEl}
                >
                    <MenuItem onClick={handleCoverClick}>
                        Utiliser comme couverture de l'album
                    </MenuItem>
                    <MenuItem onClick={handleRotateRight}>
                        Tourner à droite
                    </MenuItem>
                    <MenuItem onClick={handleRotateLeft}>
                        Tourner à gauche
                    </MenuItem>
                    {photo.private && (
                        <MenuItem onClick={handleShareClick}>Partager</MenuItem>
                    )}
                    {!photo.private && (
                        <MenuItem onClick={handleUnshareClick}>
                            Ne plus partager
                        </MenuItem>
                    )}
                </Menu>
            </Stack>
        </Stack>
    );
}

export default TopActions;
