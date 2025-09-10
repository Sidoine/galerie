import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores";
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

const UserRow = observer(({ user }: { user: User }) => {
    const { usersStore } = useStores();
    const handleToggleCheck = useCallback(
        (e: unknown, checked: boolean) => {
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
    const { usersStore } = useStores();
    const users = usersStore.usersLoader.getValue() || [];
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Administrator</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map((x) => (
                        <UserRow key={x.id} user={x} />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
});
