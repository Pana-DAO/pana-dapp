import "./topbar.scss";

// import { i18n } from "@lingui/core";
// import { t } from "@lingui/macro";
import { AppBar, Box, Button, SvgIcon, Toolbar } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { ReactComponent as MenuIcon } from "../../assets/icons/hamburger.svg";
// import { locales, selectLocale } from "../../locales";
import ThemeSwitcher from "./ThemeSwitch";

import Wallet from "./Wallet";

const useStyles = makeStyles(theme => ({
  appBar: {
    [theme.breakpoints.up("sm")]: {
      width: "100%",
      padding: "10px",
    },
    justifyContent: "flex-end",
    alignItems: "flex-end",
    background: "transparent",
    backdropFilter: "none",
    zIndex: 10,
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(981)]: {
      display: "none",
    },
  },
}));

interface TopBarProps {
  theme: string;
  toggleTheme: (e: KeyboardEvent) => void;
  handleDrawerToggle: () => void;
}

function TopBar({ theme, toggleTheme, handleDrawerToggle }: TopBarProps) {
  const classes = useStyles();

  return (
    <AppBar position="sticky" className={classes.appBar} elevation={0}>
      <Toolbar disableGutters className="dapp-topbar">      
        
        <Button
          id="hamburger"
          aria-label="open drawer"
          size="large"
          variant="contained"
          color="secondary"
          onClick={handleDrawerToggle}
          className={classes.menuButton}
        >
          <SvgIcon component={MenuIcon} />
        </Button>
        <Box display="flex">
          <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
          <Wallet />
        </Box>
      </Toolbar>
      <div className="marquee">
        <div className="marquee__inner" aria-hidden="true">
          <span>Please Note! Free Streaming of PANA through Staking Pools will be stopped at the end of phase 2(Oct 17th 2022). Please unstake your assets and keep bonding to earn rebase rewards.</span>
        </div>
      </div>
     
    </AppBar>
  );
}

export default TopBar;
