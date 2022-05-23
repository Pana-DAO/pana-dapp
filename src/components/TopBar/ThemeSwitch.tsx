import { t } from "@lingui/macro";
import ToggleButton from "@material-ui/lab/ToggleButton";
import { SvgIcon } from "@material-ui/core";
import { Brightness2, WbSunny } from "@material-ui/icons";

interface IThemeSwitcherProps {
  theme: string;
  toggleTheme: (e: any) => void;
}

function ThemeSwitcher({ theme, toggleTheme }: IThemeSwitcherProps) {
  return (
    <ToggleButton className="toggle-button" type="button" title={t`Change Theme`} value="check" onClick={toggleTheme}>
      {theme === "dark" ? (
        <SvgIcon
          viewBox="0 0 23 23"
          style={{ transform: "rotate(130deg)" }}
          component={Brightness2}
          color={"primary"}
        />
      ) : (
        <SvgIcon viewBox="0 0 23 23" component={WbSunny} color={"primary"} />
      )}
    </ToggleButton>
  );
}

export default ThemeSwitcher;
