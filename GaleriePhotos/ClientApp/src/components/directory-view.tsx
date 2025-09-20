import { lazy, Suspense } from "react";
import { observer } from "mobx-react-lite";
import { Container, Stack } from "@mui/material";
import { DirectoryImagesView } from "./directory-images-view";
import { Route, Routes } from "react-router-dom";
import SubdirectoriesView from "./subdirectories-view";
const ImageView = lazy(() => import("./image-view/image-view"));

export interface DirectoryViewProps {
    id: number;
}

export const DirectoryView = observer(({ id }: { id: number }) => {
    return (
        <>
            <Container maxWidth="lg">
                <Stack direction="column" spacing={2}>
                    <SubdirectoriesView id={Number(id)} />
                    <DirectoryImagesView directoryId={Number(id)} />
                </Stack>
            </Container>
            <Routes>
                <Route
                    path="images/:id"
                    element={
                        <Suspense>
                            <ImageView />
                        </Suspense>
                    }
                />
            </Routes>
        </>
    );
});
