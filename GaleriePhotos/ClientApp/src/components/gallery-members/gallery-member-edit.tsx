import {
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    TableCell,
    TableRow,
    Box,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { useMembersStore } from "../../stores/members";
import { useDirectoryVisibilitiesStore } from "../../stores/directory-visibilities";

import { GalleryMember } from "../../services/views";
import { DirectoryVisibility } from "../../services/enums";

function GalleryMemberEdit({ selectedUser }: { selectedUser: GalleryMember }) {
    const membersStore = useMembersStore();
    const visibilitiesStore = useDirectoryVisibilitiesStore();
    
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
            </TableCell>
        </TableRow>
    );
}

export default observer(GalleryMemberEdit);
