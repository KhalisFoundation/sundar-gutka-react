import React from "react";
import { useSelector } from "react-redux";
import useThemeRegistry from "@theme/reader/useThemeRegistry";
import PropTypes from "prop-types";
import { ThemeIcon } from "@common/icons";
import { STRINGS } from "@common";
import { themeLabel, themeOptions } from "../Themes/options";
import SettingsRow from "./comon/SettingsRow";

// The app's ONE appearance control.
//
// It pushes the theme grid rather than opening a sheet, because the choice is
// no longer a single word — each option is a page you can look at, and the
// grid is where the themes the backend adds, corrects or withdraws show up.
//
// The row's value is named the way the grid names its tiles: a bundled theme
// from the localisation file, a remote one from the names it carries. A stored
// id nothing can name any more (a theme withdrawn since it was chosen) shows
// as the raw id rather than an empty row.
const ThemeComponent = ({ navigate }) => {
  const theme = useSelector((state) => state.theme);
  const language = useSelector((state) => state.language);
  const registry = useThemeRegistry();
  const current = themeOptions(registry).find((option) => option.value === theme);
  const label = current ? themeLabel(current, language, STRINGS) : theme;

  return (
    <SettingsRow
      title={STRINGS.theme}
      value={label}
      IconComponent={ThemeIcon}
      onPress={() => navigate("Themes")}
    />
  );
};

ThemeComponent.propTypes = { navigate: PropTypes.func.isRequired };

export default ThemeComponent;
