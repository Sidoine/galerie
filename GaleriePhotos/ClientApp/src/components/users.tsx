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
    Select,
    MenuItem,
    SelectChangeEvent,
} from "@mui/material";
import { DirectoryVisibility } from "../services/enums";
import { User } from "../services/views";

const UserRow = observer(({ user }: { user: User }) => {
    const { usersStore } = useStores();
    const handleToggleCheck = useCallback(
        (e: unknown, checked: boolean) => {
            usersStore.patch(user, { administrator: checked });
        },
        [usersStore, user]
    );
    const handleChangeVisibility = useCallback(
        (e: SelectChangeEvent<DirectoryVisibility>) => {
            usersStore.patch(user, {
                directoryVisibility: e.target.value as DirectoryVisibility,
            });
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
            <TableCell>
                <Select<DirectoryVisibility>
                    value={user.directoryVisibility}
                    onChange={handleChangeVisibility}
                >
                    <MenuItem value={DirectoryVisibility.None}>Aucune</MenuItem>
                    <MenuItem value={DirectoryVisibility.Mylene}>
                        Mylène
                    </MenuItem>
                    <MenuItem value={DirectoryVisibility.Sidoine}>
                        Sidoine
                    </MenuItem>
                </Select>
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
                        <TableCell>Visibilité</TableCell>
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
