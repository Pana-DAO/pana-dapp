import { createTheme, responsiveFontSizes } from "@material-ui/core/styles";

import darkBackground from "../assets/images/bg-dark.png";
import fonts from "./fonts";
import commonSettings, { handleBackdropFilter } from "./global.js";

// TODO: Break repeated use color values out into list of consts declared here
// then set the values in darkTheme using the global color variables

const color_001 = "#CBCBCB";
const color_002 = "#F8CC82";
const color_003 = "#A3A3A3";
const color_004 = "#F4D092";
const color_005 = "#F5DDB4";
const color_006 = "#333333";
const color_007 = "255, 255, 255"; // #FFFFFF

const color_bg_000 = "0, 0, 0"; // #212121
const color_bg_001 = "20, 20, 20"; // #363840
const color_bg_002 = "#EDD8B4";
const color_bg_003 = "#24242699";
const color_bg_004 = "#00000038";
const color_bg_005 = "255, 255, 255"; // #FFFFFF
const color_bg_999 = "0, 0, 10"; // #00000a

const color_border_001 = "#FFFFFF";

const darkTheme = {
  color: color_001,
  gold: color_002,
  gray: color_003,
  textHighlightColor: color_004,
  backgroundColor: `rgba(${color_bg_000}, 1)`,
  backgroundImage: `url(${darkBackground})`,
  paperBg: `rgba(${color_bg_001}, 1)`,
  modalBg: color_bg_003,
  popoverBg: `rgba(${color_bg_001}, 0.99)`,
  menuBg: handleBackdropFilter(`rgba(${color_bg_001}, 0.5)`),
  backdropBg: `rgba(${color_bg_001}, 0.5)`,
  largeTextColor: color_004,
  activeLinkColor: color_005,
  activeLinkSvgColor:
    "brightness(0) saturate(100%) invert(84%) sepia(49%) saturate(307%) hue-rotate(326deg) brightness(106%) contrast(92%)",
  primaryButtonColor: color_006,
  primaryButtonBG: color_004,
  primaryButtonHoverBG: color_bg_002,
  secondaryButtonHoverBG: `rgba(${color_bg_001}, 1)`,
  outlinedPrimaryButtonHoverBG: color_002,
  outlinedPrimaryButtonHoverColor: color_006,
  outlinedSecondaryButtonHoverBG: "transparent",
  outlinedSecondaryButtonHoverColor: color_002,
  containedSecondaryButtonHoverBG: `rgba(${color_bg_005}, 0.15)`,
  graphStrokeColor: `rgba(${color_007}, .1)`,
  gridButtonHoverBackground: `rgba(${color_bg_005}, 0.6)`,
  gridButtonActiveBackground: color_bg_004,
  switchBg: color_006,
};

export const dark = responsiveFontSizes(
  createTheme(
    {
      primary: {
        main: darkTheme.color,
      },
      palette: {
        type: "dark",
        background: {
          default: darkTheme.backgroundColor,
          paper: darkTheme.paperBg,
        },
        contrastText: darkTheme.color,
        primary: {
          main: darkTheme.color,
        },
        neutral: {
          main: darkTheme.color,
          secondary: darkTheme.gray,
        },
        text: {
          primary: darkTheme.color,
          secondary: darkTheme.gray,
        },
        graphStrokeColor: darkTheme.graphStrokeColor,
        highlight: darkTheme.textHighlightColor,
      },
      typography: {
        fontFamily: "Square",
      },
      overrides: {
        MuiSwitch: {
          colorPrimary: {
            color: darkTheme.color,
            "&$checked": {
              color: darkTheme.switchBg,
              "& + $track": {
                backgroundColor: darkTheme.color,
                borderColor: darkTheme.color,
              },
            },
          },
          track: {
            border: `1px solid ${darkTheme.color}`,
            backgroundColor: darkTheme.switchBg,
          },
        },
        MuiCssBaseline: {
          "@global": {
            "@font-face": fonts,
            body: {
              background: darkTheme.background,
            },
            ".modalchild": {
              backgroundColor: darkTheme.paperBg,
            },
          },
        },
        MuiDrawer: {
          paper: {
            backgroundColor: darkTheme.paperBg,
            zIndex: 7,
            "@supports not ((-webkit-backdrop-filter: none) or (backdrop-filter: none))": {
              backgroundColor: `rgba(${color_bg_001}, 0.98)`,
            },
          },
        },
        MuiSelect: {
          select: {
            color: color_002,
          },
        },
        MuiPaper: {
          root: {
            backgroundColor: darkTheme.paperBg,
            "&.pana-card": {
              backgroundColor: darkTheme.paperBg,
            },
            "&.pana-modal": {
              backgroundColor: darkTheme.modalBg,
            },
            "&.modalspace": {
              backgroundColor: darkTheme.modalBg,
            },
            "&.pana-menu": {
              backgroundColor: darkTheme.menuBg,
              backdropFilter: "blur(33px)",
            },
            "&.pana-popover": {
              backgroundColor: darkTheme.popoverBg,
              color: darkTheme.color,
              // backdropFilter: "blur(15px)",
            },
          },
        },
        MuiBackdrop: {
          root: {
            backgroundColor: darkTheme.backdropBg,
          },
        },
        MuiLink: {
          root: {
            color: darkTheme.color,
            "&:hover": {
              color: darkTheme.textHighlightColor,
              textDecoration: "none",
              "&.active": {
                color: darkTheme.color,
              },
            },
            "&.active": {
              color: darkTheme.color,
              textDecoration: "underline",
            },
          },
        },
        MuiTableCell: {
          root: {
            color: darkTheme.color,
          },
        },
        MuiInputBase: {
          root: {
            // color: darkTheme.gold,
          },
        },
        MuiOutlinedInput: {
          notchedOutline: {
            // borderColor: `${darkTheme.gold} !important`,
            "&:hover": {
              // borderColor: `${darkTheme.gold} !important`,
            },
          },
        },
        MuiTab: {
          textColorPrimary: {
            color: darkTheme.gray,
            "&$selected": {
              color: darkTheme.gold,
            },
          },
        },
        PrivateTabIndicator: {
          colorPrimary: {
            backgroundColor: darkTheme.gold,
          },
        },
        MuiToggleButton: {
          root: {
            backgroundColor: darkTheme.paperBg,
            "&:hover": {
              color: darkTheme.color,
              backgroundColor: `${darkTheme.containedSecondaryButtonHoverBG} !important`,
            },
            selected: {
              backgroundColor: darkTheme.containedSecondaryButtonHoverBG,
            },
            "@media (hover:none)": {
              "&:hover": {
                color: darkTheme.color,
                backgroundColor: darkTheme.paperBg,
              },
              "&:focus": {
                color: darkTheme.color,
                backgroundColor: darkTheme.paperBg,
                borderColor: "transparent",
                outline: "#00000000",
              },
            },
          },
        },
        MuiButton: {
          containedPrimary: {
            color: darkTheme.primaryButtonColor,
            backgroundColor: darkTheme.gold,
            "&:hover": {
              backgroundColor: darkTheme.primaryButtonHoverBG,
              color: darkTheme.primaryButtonHoverColor,
            },
            "&:active": {
              backgroundColor: darkTheme.primaryButtonHoverBG,
              color: darkTheme.primaryButtonHoverColor,
            },
            "@media (hover:none)": {
              color: darkTheme.primaryButtonColor,
              backgroundColor: darkTheme.gold,
              "&:hover": {
                backgroundColor: darkTheme.primaryButtonHoverBG,
              },
            },
          },
          containedSecondary: {
            backgroundColor: darkTheme.paperBg,
            color: darkTheme.color,
            "&:hover": {
              backgroundColor: `${darkTheme.containedSecondaryButtonHoverBG} !important`,
            },
            "&:active": {
              backgroundColor: darkTheme.containedSecondaryButtonHoverBG,
            },
            "&:focus": {
              backgroundColor: darkTheme.paperBg,
            },
            "@media (hover:none)": {
              color: darkTheme.color,
              backgroundColor: darkTheme.paperBg,
              "&:hover": {
                backgroundColor: `${darkTheme.containedSecondaryButtonHoverBG} !important`,
              },
            },
          },
          outlinedPrimary: {
            color: darkTheme.gold,
            borderColor: darkTheme.gold,
            "&:hover": {
              color: darkTheme.outlinedPrimaryButtonHoverColor,
              backgroundColor: darkTheme.primaryButtonHoverBG,
            },
            "@media (hover:none)": {
              color: darkTheme.gold,
              borderColor: darkTheme.gold,
              "&:hover": {
                color: darkTheme.outlinedPrimaryButtonHoverColor,
                backgroundColor: `${darkTheme.primaryButtonHoverBG} !important`,
                textDecoration: "none !important",
              },
            },
          },
          outlinedSecondary: {
            color: darkTheme.color,
            borderColor: darkTheme.color,
            "&:hover": {
              color: darkTheme.outlinedSecondaryButtonHoverColor,
              backgroundColor: darkTheme.outlinedSecondaryButtonHoverBG,
              borderColor: darkTheme.gold,
            },
          },
          textPrimary: {
            color: color_003,
            "&:hover": {
              color: darkTheme.gold,
              backgroundColor: "#00000000",
            },
            "&:active": {
              color: darkTheme.gold,
              borderBottom: color_002,
            },
          },
          textSecondary: {
            color: darkTheme.color,
            "&:hover": {
              color: darkTheme.textHighlightColor,
            },
          },
        },
        MuiTypography: {
          root: {
            "&.grid-message-typography": {
              color: color_003,
            },
            "&.chain-highlight": {
              color: "#DADADA",
            },
            "&.current": {
              color: darkTheme.gold,
            },
          },
        },
        MuiGrid: {
          root: {
            "&.grid-button": {
              borderColor: `${color_border_001} !important`,
              "&:hover": {
                backgroundColor: darkTheme.gridButtonHoverBackground,
              },
              "&.current": {
                borderColor: `${darkTheme.gold} !important`,
                backgroundColor: darkTheme.gridButtonActiveBackground,
                "&:hover": {
                  backgroundColor: darkTheme.gridButtonHoverBackground,
                },
              },
            },
            "&.dapp-footer-logo-text-inner": {
              borderLeft: `0.5px solid ${color_003}`,
            },
            "&.box-dash": {
              margin: `5px`,
              // border: `0.5px solid  ${color_003}`,
              padding: `10px`,
              boxShadow: `1px 1px 2px 2px  ${darkTheme.gridButtonHoverBackground}`,
              borderRadius: `10px`,
            },
          },
        },
      },
    },
    commonSettings,
  ),
);
