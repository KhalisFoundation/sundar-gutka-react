import spacing from "./spacing";

const components = {
  header: {
    height: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    minHeight: 44,
  },
  card: {
    padding: spacing.lg,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: 12,
  },
  list: {
    itemPadding: spacing.lg,
    itemMargin: spacing.sm,
    sectionHeaderPadding: spacing.md,
  },
  modal: {
    padding: spacing.xl,
    borderRadius: 16,
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    minHeight: 44,
  },
};
export default components;
