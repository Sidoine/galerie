import { observer } from "mobx-react-lite";
import { useMembersStore } from "../../stores/members";
import GalleryMemberCreate from "./gallery-member-create";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@mui/material";
import GalleryMemberEdit from "./gallery-member-edit";

export const GalleryMembers = observer(function GalleryMembers() {
    const membersStore = useMembersStore();
    const memberships = membersStore.members;
    return (
        <>
            <GalleryMemberCreate />
            {memberships && memberships.length > 0 && (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Galerie</TableCell>
                            <TableCell>Admin</TableCell>
                            <TableCell>Visibilité</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {memberships.map((m) => (
                            <GalleryMemberEdit key={m.id} selectedUser={m} />
                        ))}
                    </TableBody>
                </Table>
            )}
        </>
    );
});
