import React, { createContext, useContext } from "react";
import PropTypes from "prop-types";

// Applies one screen's colours to a whole subtree.
//
// The alternative is a colour prop on every primitive the subtree contains —
// `Row` taking a divider colour, `Text` taking a title colour, the checkmark
// taking its own — which is exactly the inline overriding the token layer
// exists to remove. Here a screen declares WHICH palette its subtree is on, and
// `useTokens` resolves the same role names to that palette's values, so the
// primitives inside need no change at all.
//
// This is the seam a user-selectable theme drops into later: a theme swaps what
// `rolesFor` returns, and every subtree already asking for its screen's roles
// follows automatically.
//
// The default is null — no override — so a component outside a provider reads
// the semantic layer exactly as before.

const ScreenRolesContext = createContext(null);

/**
 * The screen whose role overrides apply here, or null outside a provider.
 * Read by `useTokens`; components should not need this directly.
 */
export const useScreenRolesScope = () => useContext(ScreenRolesContext);

const ScreenRolesProvider = ({ screen = null, children }) => (
  <ScreenRolesContext.Provider value={screen}>{children}</ScreenRolesContext.Provider>
);

/**
 * Puts a whole screen on one palette, for use at a route definition.
 *
 *   const SettingsScoped = withScreenRoles(Settings, "settings");
 *
 * Declaring it at the route keeps the scope with the navigation graph — the one
 * place that already says which screens belong together — instead of each
 * screen file having to remember to wrap itself.
 */
export const withScreenRoles = (Component, screen) => {
  const Scoped = (props) => (
    <ScreenRolesProvider screen={screen}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...props} />
    </ScreenRolesProvider>
  );
  Scoped.displayName = `withScreenRoles(${Component.displayName || Component.name || "Component"})`;
  return Scoped;
};

ScreenRolesProvider.propTypes = {
  /**
   * A key in the screen role registry — see theme/screenPalettes.
   *
   * Null opts a subtree back OUT of an enclosing scope, for content that sits
   * inside a scoped screen without belonging to it — an app-wide dialog raised
   * from a scoped sheet, which should look like every other dialog rather than
   * like the sheet it happened to be opened from.
   */
  screen: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default ScreenRolesProvider;
