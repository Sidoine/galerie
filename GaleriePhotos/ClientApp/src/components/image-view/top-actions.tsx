import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
    IconButton,
    Menu,
    MenuItem,
    Stack,
    styled,
    Tooltip,
} from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TagFacesOutlined from "@mui/icons-material/TagFacesOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { useCallback, useState } from "react";
import { PhotoFull } from "../../services/views";
import { useDirectoriesStore } from "../../stores/directories";
import { useMembersStore } from "../../stores/members";
import { FaceDetectionStatus } from "../../services/enums";

const WhiteButton = styled(IconButton)(({ theme }) => ({
    color: theme.palette.common.white,
}));

function TopActions({
    onDetailsToggle,
    onFacesToggle,
    showFaces,
    onClose,
    photo,
}: {
    onDetailsToggle: () => void;
    onFacesToggle: () => void;
    showFaces?: boolean;
    onClose: () => void;
    photo: PhotoFull;
}) {
    const directoriesStore = useDirectoriesStore();
    const membersStore = useMembersStore();
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
        directoriesStore.patchDirectoryAndClearCache(photo.directoryId, {
            coverPhotoId: photo.id,
        });
    }, [directoriesStore, handleCloseMenu, photo.directoryId, photo.id]);
    const handleShareClick = useCallback(() => {
        handleCloseMenu();
        directoriesStore.setAccess(photo, false);
    }, [directoriesStore, handleCloseMenu, photo]);
    const handleUnshareClick = useCallback(() => {
        handleCloseMenu();
        directoriesStore.setAccess(photo, true);
    }, [directoriesStore, handleCloseMenu, photo]);
    const handleRotate = useCallback(
        async (angle: number) => {
            handleCloseMenu();
            await directoriesStore.rotatePhoto(photo, angle);
        },
        [handleCloseMenu, directoriesStore, photo]
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
                {photo.faceDetectionStatus ===
                    FaceDetectionStatus.Completed && (
                    <Tooltip
                        arrow
                        title={
                            showFaces ? "Visages affichés" : "Visages masqués"
                        }
                    >
                        <WhiteButton onClickCapture={onFacesToggle}>
                            {showFaces ? (
                                <TagFacesOutlined />
                            ) : (
                                <VisibilityOffOutlined />
                            )}
                        </WhiteButton>
                    </Tooltip>
                )}
                {membersStore.administrator && (
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
