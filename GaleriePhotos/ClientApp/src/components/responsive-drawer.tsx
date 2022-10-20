import React from "react";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";
import { Box, useTheme } from "@mui/material";
import { LoginMenu } from "folke-service-helpers";

const drawerWidth = 240;

export const ResponsiveDrawer = observer(
    ({
        children,
        menu,
        title,
    }: {
        children: React.ReactNode;
        menu: JSX.Element;
        title: string;
    }) => {
        const theme = useTheme();
        const [mobileOpen, setMobileOpen] = React.useState(false);

        const handleDrawerToggle = () => {
            setMobileOpen(!mobileOpen);
        };

        const drawer = (
            <div>
                <Box sx={{ width: drawerWidth }} />
                <Divider />
                {menu}
            </div>
        );

        return (
            <Box sx={{ display: "flex" }}>
                <CssBaseline />
                <AppBar
                    position="fixed"
                    sx={{
                        width: { sm: `calc(100% - ${drawerWidth}px)` },
                        marginLeft: { sm: drawerWidth },
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{
                                marginRight: theme.spacing(2),
                                display: { sm: "none" },
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                            {title}
                        </Typography>
                        <LoginMenu />
                    </Toolbar>
                </AppBar>
                <Box
                    component="nav"
                    sx={{
                        width: { sm: drawerWidth },
                        flexShrink: { sm: 0 },
                    }}
                    aria-label="mailbox folders"
                >
                    {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
                    <Drawer
                        sx={{
                            display: { xs: "block", sm: "none" },
                        }}
                        variant="temporary"
                        anchor={theme.direction === "rtl" ? "right" : "left"}
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile.
                        }}
                    >
                        {drawer}
                    </Drawer>
                    <Drawer
                        variant="permanent"
                        open
                        sx={{
                            display: { xs: "none", sm: "block" },
                        }}
                    >
                        {drawer}
                    </Drawer>
                </Box>
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        width: {
                            xs: "100%",
                            sm: `calc(100% - ${drawerWidth}px)`,
                        },
                    }}
                >
                    <Box sx={theme.mixins.toolbar} />
                    {children}
                </Box>
            </Box>
        );
    }
);
