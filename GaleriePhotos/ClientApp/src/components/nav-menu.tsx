import React from "react";
import { useHistory } from "react-router-dom";
import { LoginMenu } from "./api-authorization/login-menu";
import { AppBar, Toolbar, Typography, makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        flexGrow: 1,
        cursor: "pointer",
    },
}));

export function NavMenu() {
    const classes = useStyles();
    const history = useHistory();
    return (
        <AppBar>
            <Toolbar>
                <Typography
                    onClick={() => history.push("/")}
                    variant="h6"
                    className={classes.title}
                >
                    Galerie photos
                </Typography>
                Merde
                <LoginMenu></LoginMenu>
            </Toolbar>
        </AppBar>
    );
}
