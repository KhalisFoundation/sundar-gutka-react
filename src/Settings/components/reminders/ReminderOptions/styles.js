const createStyles = (theme) => ({
  viewColumn: { flexDirection: "column" },
  viewRow: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { fontSize: 24, color: theme.colors.primaryText },
  flexView: { flex: 1, backgroundColor: theme.colors.inactiveView },
  timeFont: { fontSize: 44, color: theme.colors.primaryText },
  accContentText: { fontSize: 14, color: theme.colors.componentColor },
  accContentWrapper: { flexDirection: "row", alignItems: "center", margin: 5 },
  modalSelectText: { fontSize: 28 },
  textInput: {
    height: 40,
    borderRadius: 5,
    borderColor: theme.colors.underlayColor,
    borderWidth: 1,
    padding: 5,
    color: theme.colors.primaryText,
  },
  labelModalWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  labelViewWrapper: { backgroundColor: theme.staticColors.WHITE_COLOR, padding: 20, width: 300 },
  labelText: { paddingBottom: 5, color: theme.colors.underlayColor },
  labelButtonWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 10,
  },
  modalBackColor: { backgroundColor: theme.colors.surfaceGrey },
});
export default createStyles;
