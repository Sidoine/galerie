import React from "react";
import {
    Avatar,
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
    ListItemIcon,
} from "@mui/material";
import Logout from "@mui/icons-material/Logout";
import LockReset from "@mui/icons-material/LockReset";
import { observer } from "mobx-react-lite";
import { useMeStore } from "../stores/me";

/**
 * Menu de compte utilisateur (changer mot de passe, déconnexion)
 */
const UserAccountMenu = observer(function UserAccountMenu() {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const meStore = useMeStore();
    const initial = meStore.me?.name?.[0]?.toUpperCase() || "U";

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => setAnchorEl(null);

    const handleChangePassword = () => {
        window.location.href = "/Identity/Account/Manage/ChangePassword";
    };

    const handleLogout = () => {
        window.location.href = "/Identity/Account/Logout";
    };

    return (
        <>
            <Tooltip title="Compte">
                <IconButton
                    onClick={handleOpen}
                    size="small"
                    sx={{ ml: 2 }}
                    aria-controls={open ? "account-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                    color="inherit"
                >
                    <Avatar sx={{ width: 32, height: 32 }}>{initial}</Avatar>
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        mt: 1.5,
                        overflow: "visible",
                        filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                        "&:before": {
                            content: '""',
                            display: "block",
                            position: "absolute",
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: "background.paper",
                            transform: "translateY(-50%) rotate(45deg)",
                            zIndex: 0,
                        },
                    },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
                <MenuItem onClick={handleChangePassword}>
                    <ListItemIcon>
                        <LockReset fontSize="small" />
                    </ListItemIcon>
                    Changer le mot de passe
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>
                    Se déconnecter
                </MenuItem>
            </Menu>
        </>
    );
});

export default UserAccountMenu;
