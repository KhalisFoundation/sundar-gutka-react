import typography from "./typography";
import spacing from "./spacing";
import components from "./components";
import staticColors from "./staticColors";

const darkTheme = {
  mode: "dark",
  colors: {
    primary: "#141a3c",
    surface: "#121212",
    primaryText: "#faf9f6",
    primaryVariant: "#99852c",
    surfaceGrey: "#464646",
    textDisabled: "#faf9f6",
    underlayColor: "#009bff",
    headerVariant: "#003436",
    baniDB: "#eaa040",
    shadow: "#fff",
    highlightTuk: "#77baff",
    activeView: "#2d2d2d",
    inactiveView: "#232323",
    componentColor: "#fefefe",
    enabledText: "#2581df",
    disabledText: "#a3a3a3",
  },
  typography,
  spacing,
  components,
  staticColors,
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
  },
  images: {
    khalisLogo: require("../../images/khalislogo150white.png"),
    baniDBLogo: require("../../images/banidblogo.png"),
  },
};

export default darkTheme;
