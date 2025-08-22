import { constant } from "@common";

export const createStyles = (theme) => ({
  rowItem: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginTop: 1,
    backgroundColor: theme.colors.surface,
  },
  text: {
    fontFamily: constant.GURBANI_AKHAR_TRUE,
    fontSize: 24,
    textAlign: "center",
    color: theme.colors.primaryText,
  },
  gestureHandlerRootView: {
    backgroundColor: theme.colors.primaryText,
    flex: 1,
  },
});

export const activeColor = (isActive, backColor, theme) => ({
  backgroundColor: isActive ? theme.staticColors.WHITE_COLOR : backColor,
});
