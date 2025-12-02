import borderRadius from "./borderRadius";
import components from "./components";
import spacing from "./spacing";
import staticColors from "./staticColors";
import typography from "./typography";

const darkTheme = {
  mode: "dark",
  colors: {
    primary: "#113979",
    surface: "rgba(18, 18, 18, 1)",
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
    primaryHeader: "#121212",
    primaryHeaderVariant: "#faf9f6",
    actionButton: "#121F35",
    audioPlayer: "#BED2F2",
    overlay: staticColors.NIGHT_BLACK,
    audioTitleText: "#BED2F2",
    trackBorderColor: "#464646",
    trackBackgroundColor: "rgba(37, 105, 214, 0.2)",
    controlBarBackgroundColor: "#000000",
    separator: "rgba(190, 210, 242, 0.23)",
    transparentOverlay: "rgba(18, 18, 18, 0.95)",
    audioSettingsModalText: "#faf9f6",
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
  borderRadius,
};

export default darkTheme;
