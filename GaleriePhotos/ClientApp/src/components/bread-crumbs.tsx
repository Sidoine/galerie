import { Link as RouterLink, useParams } from "react-router";
import { useStores } from "../stores";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";

function BreadCrumbs() {
    const { directoryId } = useParams();
    const { directoriesStore } = useStores();
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
                Galerie
            </Link>
            {directory && directory.parent && directory.parent.name && (
                <Link
                    component={RouterLink}
                    to={`/directory/${directory.parent.id}`}
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
