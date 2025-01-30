import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton, Menu, MenuItem, Stack, styled } from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useCallback, useState } from "react";
import { useStores } from "../../stores";
import { PhotoFull } from "../../services/views";

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
    const { usersStore, directoriesStore } = useStores();
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
    }, [handleCloseMenu]);
    const handleShareClick = useCallback(() => {
        handleCloseMenu();
        directoriesStore.setAccess(directoryId, photo, false);
    }, [handleCloseMenu]);
    const handleUnshareClick = useCallback(() => {
        handleCloseMenu();
        directoriesStore.setAccess(directoryId, photo, true);
    }, [handleCloseMenu]);

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
