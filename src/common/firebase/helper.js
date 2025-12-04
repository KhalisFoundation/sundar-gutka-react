// eslint-disable-next-line import/prefer-default-export
export const sanitizeName = (value, maxLength, fallback = null) => {
  if (!value) return fallback;
  const normalized = String(value)
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, maxLength);
  if (!normalized) return fallback;
  return normalized;
};
