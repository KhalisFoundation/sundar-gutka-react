// A react-redux stand-in backed by a REAL Redux store.
//
// react-redux's ESM build is not transformed under this project's jest
// config, which is why setupTests stubs the library app-wide with a static
// state object. Tests that need the real reducer to run — an outbox that
// drains, clocks that stamp, a list that changes under a subscription — use
// this instead: the same four exports the app uses, implemented over whatever
// store the test passes to `Provider`.
//
// Usage:
//   jest.mock("react-redux", () => require("@common/test-utils/mocks/storeRedux").mock);
const React = require("react");

const StoreContext = React.createContext(null);

const Provider = ({ store, children }) =>
  React.createElement(StoreContext.Provider, { value: store }, children);

const useStore = () => React.useContext(StoreContext);
const useDispatch = () => React.useContext(StoreContext).dispatch;
const useSelector = (selector) => {
  const store = React.useContext(StoreContext);
  return React.useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
};

module.exports = { mock: { Provider, useStore, useDispatch, useSelector } };
