import {
    useMediaQuery,
    CircularProgress,
    Typography,
    ImageList,
    useTheme,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { useDirectoriesStore } from "../stores/directories";
import SubdirectoryCard from "./subdirectory-card";

const SubdirectoriesView = observer(function SubdirectoriesView({
    id,
}: {
    id: number;
}) {
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
export default SubdirectoriesView;
