import staticColors from "./staticColors";
import typography from "./typography";
import spacing from "./spacing";
import components from "./components";

const lightTheme = {
  mode: "light",
  colors: {
    primary: "#2a3381",
    surface: "#faf9f6",
    primaryText: "#121212",
    primaryVariant: "#DEBB0A",
    surfaceGrey: "#faf9f6",
    textDisabled: "#a3a3a3",
    underlayColor: "#009bff",
    headerVariant: "#003436",
    baniDB: "#eaa040",
    shadow: "#000",
    highlightTuk: "#0066ff",
    activeView: "#C7C7D7",
    inactiveView: "#e9e9ee",
    componentColor: "#232323",
    enabledText: "#0066ff",
    disabledText: "#a3a3a3",
  },
  staticColors,
  typography,
  spacing,
  components,
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
  },
  images: {
    khalisLogo: require("../../images/khalislogo150.png"),
    baniDBLogo: require("../../images/banidblogo.png"),
  },
};

export default lightTheme;
