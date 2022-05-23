// import { t } from "@lingui/macro";
// import ToggleButton from "@material-ui/lab/ToggleButton";
// import { SvgIcon } from "@material-ui/core";
// import { Brightness2,WbSunny } from "@material-ui/icons";
import { i18n } from "@lingui/core";
// import { ar, en, es, fr, ko, tr, vi, zh } from "make-plural/plurals";
import { Menu, MenuItem, Fade } from "@material-ui/core";
import ToggleButton from "@material-ui/lab/ToggleButton";
import React from "react";
import "flag-icon-css/css/flag-icon.min.css";
import { locales, selectLocale } from "./../../locales";

function LocaleSwitcher() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const onSelectLanguage = (key: string) => {
    selectLocale(key);
    handleClose();
  };

  return (
    <div>
      <ToggleButton
        aria-controls="fade-menu"
        aria-haspopup="true"
        className="toggle-button"
        type="button"
        value="check"
        onClick={handleClick}
      >
        <span className={`flag-icon flag-icon-${locales[i18n.locale].flag}`}></span>
      </ToggleButton>

      <Menu id="fade-menu" anchorEl={anchorEl} keepMounted open={open} onClose={handleClose} TransitionComponent={Fade}>
        {Object.keys(locales).map((key: string, value) => (
          <MenuItem onClick={() => onSelectLanguage(key)}>
            <span className={`flag-icon flag-icon-${locales[key].flag}`}></span>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}

export default LocaleSwitcher;
