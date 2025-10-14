import components from "./components";
import spacing from "./spacing";
import staticColors from "./staticColors";
import typography from "./typography";

const lightTheme = {
  mode: "light",
  colors: {
    primary: "#113979",
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
    primaryHeader: "#113979",
    primaryHeaderVariant: "#113979",
    actionButton: "#D3E1F7",
    audioPlayer: "rgba(17, 57, 121, 0.5)",
    overlay: staticColors.SEMI_TRANSPARENT,
    audioTitleText: "#113979",
    trackBorderColor: staticColors.TRACK_COLOR,
    trackBackgroundColor: staticColors.TRACK_COLOR,
    controlBarBackgroundColor: "#ffffff",
    separator: "#eeeeee",
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
