import {
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    TableCell,
    TableRow,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { useMembersStore } from "../../stores/members";

import { GalleryMember } from "../../services/views";
import { DirectoryVisibility } from "../../services/enums";

function GalleryMemberEdit({ selectedUser }: { selectedUser: GalleryMember }) {
    const membersStore = useMembersStore();
    const visibilityValues = [
        DirectoryVisibility.None,
        DirectoryVisibility.Mylene,
        DirectoryVisibility.Sidoine,
        DirectoryVisibility.SidoineEtMylene,
    ];
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
                <Select
                    size="small"
                    value={selectedUser.directoryVisibility}
                    onChange={(e) =>
                        membersStore.setMembershipVisibility(
                            selectedUser,
                            e.target.value as DirectoryVisibility
                        )
                    }
                >
                    {visibilityValues.map((v) => (
                        <MenuItem key={v} value={v}>
                            {String(DirectoryVisibility[v])}
                        </MenuItem>
                    ))}
                </Select>
            </TableCell>
        </TableRow>
    );
}

export default observer(GalleryMemberEdit);
