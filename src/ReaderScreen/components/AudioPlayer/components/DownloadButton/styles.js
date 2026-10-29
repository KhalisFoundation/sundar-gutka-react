export const createStyles = (theme) => ({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: theme.spacing.xs ?? 4,
    gap: 4,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: theme.spacing.xs ?? 4,
    gap: 4,
  },
  ringContainer: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.xs ?? 11,
    color: theme.c.textPrimary,
    flexShrink: 1,
  },
  errorLabel: {
    color: theme.c.error,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
