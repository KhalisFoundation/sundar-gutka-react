const createStyles = (theme) => ({
  baniDBLogoImage: { alignSelf: "center" },
  mainWrapper: { flex: 1, backgroundColor: theme.colors.surface },
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
    // shadow / elevation...
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    backgroundColor: theme.colors.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    marginRight: 12,
    color: theme.colors.primaryText,
  },
  button: {
    backgroundColor: theme.colors.baniDB,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.textDisabled,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  percentText: {
    position: "absolute",
    top: "40%",
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.primaryText,
  },
  headerTitleStyle: { color: theme.colors.primaryText, fontWeight: "normal", fontSize: 18 },
  headerStyle: { backgroundColor: theme.colors.baniDB },
  baniDBContainer: { flexDirection: "row", justifyContent: "center" },
  baniDBImage: { width: 100, height: 100, margin: 10 },
  baniDBText: { fontSize: 50, marginTop: 8, color: theme.colors.primaryText },
});

export default createStyles;
