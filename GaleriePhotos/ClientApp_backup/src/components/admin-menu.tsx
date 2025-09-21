import { List, ListItemButton } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useLocation, Link } from "react-router";

function AdminMenu() {
    const location = useLocation();

    return (
        <List>
            <ListItemButton component={Link} to={`/`}>
                Retour
            </ListItemButton>

            <ListItemButton
                selected={location.pathname === "/settings/users"}
                component={Link}
                to={`/settings/users`}
            >
                Utilisateurs
            </ListItemButton>

            <ListItemButton
                selected={location.pathname === "/settings/galleries"}
                component={Link}
                to={`/settings/galleries`}
            >
                Galeries
            </ListItemButton>
        </List>
    );
}

export default observer(AdminMenu);
