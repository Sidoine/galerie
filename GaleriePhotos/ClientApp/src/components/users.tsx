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
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    CircularProgress,
    FormControlLabel,
    Checkbox,
    Select,
    MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DirectoryVisibility } from "../services/enums";
import { useState } from "react";
import { useUsersStore } from "../stores/users";

const AddMembershipForm = observer(() => {
    const usersStore = useUsersStore();
    const [galleryId, setGalleryId] = useState(0);
    const [visibility, setVisibility] = useState(DirectoryVisibility.None);
    const [isAdmin, setIsAdmin] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const canSubmit = usersStore.selectedUser && galleryId > 0 && !submitting;
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usersStore.selectedUser) return;
        setSubmitting(true);
        try {
            await usersStore.addMembership(
                usersStore.selectedUser,
                galleryId,
                visibility,
                isAdmin
            );
            setGalleryId(0);
            setVisibility(DirectoryVisibility.None);
            setIsAdmin(false);
        } finally {
            setSubmitting(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
            <Typography variant="subtitle1" gutterBottom>
                Ajouter une appartenance à une galerie
            </Typography>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Select
                    size="small"
                    value={galleryId}
                    onChange={(e) => setGalleryId(Number(e.target.value))}
                    displayEmpty
                >
                    <MenuItem value={0} disabled>
                        Galerie Id
                    </MenuItem>
                    {/* Id saisi manuellement pour l'instant; une liste de galeries pourrait être ajoutée si un endpoint existe */}
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
                <button disabled={!canSubmit} type="submit">
                    {submitting ? "Ajout..." : "Ajouter"}
                </button>
            </div>
        </form>
    );
});

const UserRow = observer(({ user }: { user: User }) => {
    const usersStore = useUsersStore();
    const handleToggleCheck = useCallback(
        (_: unknown, checked: boolean) => {
            usersStore.patch(user, { administrator: checked });
        },
        [usersStore, user]
    );
    const selected = usersStore.selectedUser?.id === user.id;
    const toggleSelect = () => usersStore.selectUser(selected ? null : user);
    return (
        <TableRow hover onClick={toggleSelect} style={{ cursor: "pointer" }}>
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
    const memberships = usersStore.memberships;
    const loading = usersStore.loadingMemberships;
    const visibilityValues = [
        DirectoryVisibility.None,
        DirectoryVisibility.Mylene,
        DirectoryVisibility.Sidoine,
        DirectoryVisibility.SidoineEtMylene,
    ];
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
            {usersStore.selectedUser && (
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>
                            Droits sur les galeries -{" "}
                            {usersStore.selectedUser.name}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {usersStore.selectedUser && <AddMembershipForm />}
                        {loading && <CircularProgress />}
                        {!loading &&
                            memberships &&
                            memberships.length === 0 && (
                                <Typography>
                                    Aucune appartenance à une galerie.
                                </Typography>
                            )}
                        {!loading && memberships && memberships.length > 0 && (
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
                                        <TableRow key={m.id}>
                                            <TableCell>
                                                {m.galleryName}
                                            </TableCell>
                                            <TableCell>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={
                                                                m.isAdministrator
                                                            }
                                                            onChange={(e) =>
                                                                usersStore.setMembershipAdmin(
                                                                    m,
                                                                    e.target
                                                                        .checked
                                                                )
                                                            }
                                                        />
                                                    }
                                                    label=""
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    size="small"
                                                    value={
                                                        m.directoryVisibility
                                                    }
                                                    onChange={(e) =>
                                                        usersStore.setMembershipVisibility(
                                                            m,
                                                            e.target
                                                                .value as DirectoryVisibility
                                                        )
                                                    }
                                                >
                                                    {visibilityValues.map(
                                                        (v) => (
                                                            <MenuItem
                                                                key={v}
                                                                value={v}
                                                            >
                                                                {String(
                                                                    DirectoryVisibility[
                                                                        v
                                                                    ]
                                                                )}
                                                            </MenuItem>
                                                        )
                                                    )}
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </AccordionDetails>
                </Accordion>
            )}
        </>
    );
});
