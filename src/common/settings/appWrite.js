// Settings the APP writes on its own — a default filled in, a stored value
// normalised (HomeScreen validating the bani order against this build's
// banis, or resetting a language this build does not know). They are not the
// person choosing, and must not be synced as edits: stamped with a fresh
// clock they would outrank the account's own copy and overwrite it on every
// device.
//
// Wrap the dispatch: useSettingsSync's store watcher runs synchronously
// inside it and skips what changed while this is set.

let depth = 0;

export const asAppWrite = (write) => {
  depth += 1;
  try {
    return write();
  } finally {
    depth -= 1;
  }
};

export const isAppWrite = () => depth > 0;
