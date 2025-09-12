import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import {
    Table,
    TableHead,
    TableContainer,
    Paper,
    TableRow,
    TableCell,
    TableBody,
    Switch,
} from "@mui/material";
import { User } from "../services/views";
import { useUsersStore } from "../stores/users";

const UserRow = observer(({ user }: { user: User }) => {
    const usersStore = useUsersStore();
    const handleToggleCheck = useCallback(
        (_: unknown, checked: boolean) => {
            usersStore.patch(user, { administrator: checked });
        },
        [usersStore, user]
    );
    return (
        <TableRow>
            <TableCell>{user.name}</TableCell>
            <TableCell>
                <Switch
                    checked={user.administrator}
                    onChange={handleToggleCheck}
                />
            </TableCell>
        </TableRow>
    );
});

export const Users = observer(() => {
    const usersStore = useUsersStore();
    const users = usersStore.usersLoader.getValue() || [];

    return (
        <>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom</TableCell>
                            <TableCell>Administrator global</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((x) => (
                            <UserRow key={x.id} user={x} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
});
