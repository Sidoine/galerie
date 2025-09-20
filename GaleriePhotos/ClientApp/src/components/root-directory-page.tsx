import { CircularProgress } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router";
import { useDirectoriesStore } from "../stores/directories";
import { DirectoryView } from "./directory-view";

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
