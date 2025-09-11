import { Link as RouterLink, useParams } from "react-router";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useDirectoriesStore } from "../stores/directories";

function BreadCrumbs() {
    const { directoryId, galleryId } = useParams();
    const directoriesStore = useDirectoriesStore();
    const directory =
        directoryId &&
        directoriesStore.infoLoader.getValue(Number(directoryId));
    return (
        <Breadcrumbs>
            <Link
                component={RouterLink}
                sx={{ color: (theme) => theme.palette.common.white }}
                to="/"
            >
                Galeries
            </Link>
            {galleryId && (
                <Link
                    component={RouterLink}
                    sx={{ color: (theme) => theme.palette.common.white }}
                    to={`/g/${galleryId}`}
                >
                    Galerie
                </Link>
            )}
            {directory && directory.parent && directory.parent.name && (
                <Link
                    component={RouterLink}
                    to={`/g/${galleryId}/directory/${directory.parent.id}`}
                    sx={{ color: (theme) => theme.palette.common.white }}
                >
                    {directory.parent.name}
                </Link>
            )}
            {directory && directory.name && (
                <Typography color="white">{directory.name}</Typography>
            )}
        </Breadcrumbs>
    );
}

export default observer(BreadCrumbs);
