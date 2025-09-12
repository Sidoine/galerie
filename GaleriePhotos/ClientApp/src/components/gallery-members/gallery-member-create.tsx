import { observer } from "mobx-react-lite";
import { useMembersStore } from "../../stores/members";
import { useCallback, useMemo, useState } from "react";
import { DirectoryVisibility } from "../../services/enums";
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
    const [visibility, setVisibility] = useState(DirectoryVisibility.None);
    const [isAdmin, setIsAdmin] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const canSubmit = selectedUser && !submitting;
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setSubmitting(true);
        try {
            await membersStore.addMembership(selectedUser, visibility, isAdmin);
            setVisibility(DirectoryVisibility.None);
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
                <Select
                    size="small"
                    value={visibility}
                    onChange={(e) =>
                        setVisibility(e.target.value as DirectoryVisibility)
                    }
                >
                    <MenuItem value={DirectoryVisibility.None}>None</MenuItem>
                    <MenuItem value={DirectoryVisibility.Mylene}>
                        Mylene
                    </MenuItem>
                    <MenuItem value={DirectoryVisibility.Sidoine}>
                        Sidoine
                    </MenuItem>
                    <MenuItem value={DirectoryVisibility.SidoineEtMylene}>
                        SidoineEtMylene
                    </MenuItem>
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
