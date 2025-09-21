import {
    Checkbox,
    FormControlLabel,
    TableCell,
    TableRow,
    Box,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { useMembersStore } from "../../stores/members";
import { useDirectoryVisibilitiesStore } from "../../stores/directory-visibilities";

import { GalleryMember } from "../../services/views";

function GalleryMemberEdit({ selectedUser }: { selectedUser: GalleryMember }) {
    const membersStore = useMembersStore();
    const visibilitiesStore = useDirectoryVisibilitiesStore();
    const visibilityOptions = visibilitiesStore.visibilities;

    return (
        <TableRow>
            <TableCell>{selectedUser.userName}</TableCell>
            <TableCell>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={selectedUser.isAdministrator}
                            onChange={(e) =>
                                membersStore.setMembershipAdmin(
                                    selectedUser,
                                    e.target.checked
                                )
                            }
                        />
                    }
                    label=""
                />
            </TableCell>
            <TableCell>
                {visibilityOptions.map((option) => (
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        key={option.id}
                    >
                        <Checkbox
                            checked={
                                (selectedUser.directoryVisibility &
                                    option.value) >
                                0
                            }
                            onChange={(e) =>
                                membersStore.setMembershipVisibility(
                                    selectedUser,
                                    e.target.checked
                                        ? selectedUser.directoryVisibility |
                                              option.value
                                        : selectedUser.directoryVisibility &
                                              ~option.value
                                )
                            }
                        />
                        <Box component="span" sx={{ fontSize: "16px" }}>
                            {option.icon}
                        </Box>
                        {option.name}
                    </Box>
                ))}
            </TableCell>
        </TableRow>
    );
}

export default observer(GalleryMemberEdit);
