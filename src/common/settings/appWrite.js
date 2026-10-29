// Settings the APP writes on its own — a default filled in, a stored value
// normalised (HomeScreen validating the bani order against this build's
// banis, or resetting a language this build does not know). They are not the
// person choosing, and must not be synced as edits: stamped with a fresh
// clock they would outrank the account's own copy and overwrite it on every
// device.
//
// The same holds for reminders: the app filling an empty list with defaults,
// or switching them off because THIS phone lost a permission.
//
// Wrap the dispatch: the sync watchers (useSettingsSync, useRemindersSync) run
// synchronously inside it and skip what changed while this is set.

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
