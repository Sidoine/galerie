import { useParams } from "react-router";
import { DirectoryView } from "./directory-view";

export function DirectoryPage() {
    const { id } = useParams();
    return <DirectoryView id={Number(id)} />;
}
