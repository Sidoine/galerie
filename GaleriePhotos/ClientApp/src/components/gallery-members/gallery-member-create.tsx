import { observer } from "mobx-react-lite";
import { useMembersStore } from "../../stores/members";
import { useDirectoryVisibilitiesStore } from "../../stores/directory-visibilities";
import { useCallback, useMemo, useState } from "react";
import { DirectoryVisibility } from "../../services/enums";
import {
    Button,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    Typography,
    Box,
} from "@mui/material";
import { useUsersStore } from "../../stores/users";
import { User } from "../../services/views";

function GalleryMemberCreate() {
    const membersStore = useMembersStore();
    const usersStore = useUsersStore();
    const visibilitiesStore = useDirectoryVisibilitiesStore();
    const [visibility, setVisibility] = useState(DirectoryVisibility.None);
    const [isAdmin, setIsAdmin] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const canSubmit = selectedUser && !submitting;
    
    const visibilities = visibilitiesStore.visibilities;
    
    // Generate all possible visibility combinations
    const getVisibilityOptions = () => {
        const options = [{ value: DirectoryVisibility.None, name: "None", icons: [] }];
        
        // Generate all combinations of visibilities (power set)
        for (let i = 1; i < (1 << visibilities.length); i++) {
            let value = 0;
            let names: string[] = [];
            let icons: string[] = [];
            
            for (let j = 0; j < visibilities.length; j++) {
                if (i & (1 << j)) {
                    value |= visibilities[j].value;
                    names.push(visibilities[j].name);
                    icons.push(visibilities[j].icon);
                }
            }
            
            options.push({
                value,
                name: names.join(" & "),
                icons
            });
        }
        
        return options.sort((a, b) => a.value - b.value);
    };

    const visibilityOptions = getVisibilityOptions();
    
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
                    {visibilityOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                                {option.icons.map((icon, idx) => (
                                    <Box 
                                        key={idx}
                                        component="span" 
                                        dangerouslySetInnerHTML={{ __html: icon }}
                                        sx={{ fontSize: '16px' }}
                                    />
                                ))}
                                {option.name}
                            </Box>
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
