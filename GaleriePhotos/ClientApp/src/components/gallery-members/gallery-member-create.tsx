import { observer } from "mobx-react-lite";
import { useMembersStore } from "../../stores/members";
import { useCallback, useMemo, useState } from "react";
import {
    Button,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import { useUsersStore } from "../../stores/users";
import { User } from "../../services/views";

function GalleryMemberCreate() {
    const membersStore = useMembersStore();
    const usersStore = useUsersStore();
    const [isAdmin, setIsAdmin] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const canSubmit = selectedUser && !submitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setSubmitting(true);
        try {
            await membersStore.addMembership(selectedUser, 0, isAdmin);
            setIsAdmin(false);
        } finally {
            setSubmitting(false);
        }
    };
    const handleSelectUser = useCallback((user: User | null) => {
        setSelectedUser(user);
    }, []);
    const usersThatAreNotMembers = useMemo(
        () =>
            usersStore.users.filter(
                (u) => !membersStore.members.some((m) => m.userId === u.id)
            ),
        [usersStore.users, membersStore.members]
    );
    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
            <Typography variant="subtitle1" gutterBottom>
                Ajouter une appartenance à une galerie
            </Typography>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Select size="small" value={selectedUser?.id || ""}>
                    {usersThatAreNotMembers.map((user) => (
                        <MenuItem
                            key={user.id}
                            value={user.id}
                            onClick={() => handleSelectUser(user)}
                        >
                            {user.name}
                        </MenuItem>
                    ))}
                </Select>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={isAdmin}
                            onChange={(e) => setIsAdmin(e.target.checked)}
                        />
                    }
                    label="Admin"
                />
                <Button disabled={!canSubmit} type="submit">
                    {submitting ? "Ajout..." : "Ajouter"}
                </Button>
            </div>
        </form>
    );
}

export default observer(GalleryMemberCreate);
