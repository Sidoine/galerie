import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import {
    Button,
    CircularProgress,
    ImageList,
    Stack,
    Typography,
} from "@mui/material";
import { useUi } from "../stores/ui";
import { useDirectoriesStore } from "../stores/directories";
import { useMembersStore } from "../stores/members";
import ImageCard from "./image-card";

export const DirectoryImagesView = observer(function DirectoryImagesView({
    directoryId,
}: {
    directoryId: number;
}) {
    const directoriesStore = useDirectoriesStore();
    const membersStore = useMembersStore();
    const { order, navigateToDirectory } = useUi();
    const directoryContent =
        directoriesStore.contentLoader.getValue(directoryId);
    const values = directoryContent || [];
    const sortedValues =
        order === "date-desc" ? values.slice().reverse() : values;
    const handleSortDateDesc = useCallback(
        () => navigateToDirectory(directoryId, "date-desc"),
        [directoryId, navigateToDirectory]
    );
    const handleSortDateAsc = useCallback(
        () => navigateToDirectory(directoryId, "date-asc"),
        [directoryId, navigateToDirectory]
    );

    if (values.length === 0) return <></>;
    return (
        <>
            <Typography variant="h4">Photos</Typography>
            <Stack spacing={1}>
                {directoryContent === null && <CircularProgress />}
                {values.length > 0 && membersStore.administrator && <></>}
                {values.length > 0 && (
                    <Stack direction="row" spacing={1}>
                        <Button
                            onClick={handleSortDateDesc}
                            color={
                                order === "date-desc" ? "primary" : "inherit"
                            }
                            variant="contained"
                        >
                            Plus récent en premier
                        </Button>
                        <Button
                            onClick={handleSortDateAsc}
                            color={
                                order !== "date-desc" ? "primary" : "inherit"
                            }
                            variant="contained"
                        >
                            Plus ancien en premier
                        </Button>
                    </Stack>
                )}
            </Stack>
            <ImageList>
                {sortedValues.map((x) => (
                    <ImageCard value={x} key={x.id} />
                ))}
            </ImageList>
        </>
    );
});
