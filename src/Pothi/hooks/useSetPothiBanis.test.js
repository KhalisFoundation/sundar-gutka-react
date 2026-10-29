/* eslint-env jest */
import { renderHook } from "@testing-library/react-native";
import { actions } from "@common";
import useSetPothiBanis from "./useSetPothiBanis";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
jest.mock("@common", () => ({
  actions: {
    addBaniToPothi: jest.fn((id, item) => ({ type: "ADD", id, baaniId: item.baaniId })),
    removeBaniFromPothi: jest.fn((id, baaniId) => ({ type: "REMOVE", id, baaniId })),
  },
  trackPothiEvent: jest.fn(),
}));

// One apply for the Add Banis sheet and the Dashboard's Nitnem editor. The
// point of it is that a pothi is edited by DIFFERENCE: a whole-list write would
// re-stamp `updatedAt` on items nobody touched and lose them to the other
// device's copy on the next merge.

const apply = () => renderHook(() => useSetPothiBanis()).result.current;
const item = (baaniId) => ({ id: `i${baaniId}`, type: "bani", baaniId, title: `B${baaniId}` });
const pothi = { id: "p1", items: [item(2), item(4)] };

const dispatched = () => mockDispatch.mock.calls.map((call) => call[0]);

beforeEach(() => jest.clearAllMocks());

describe("useSetPothiBanis", () => {
  it("dispatches only the difference, leaving untouched banis alone", () => {
    expect(apply()(pothi, [item(2), item(9)])).toBe(true);

    // 2 was already there and is not rewritten; 9 is added and 4 removed.
    expect(dispatched()).toEqual([
      { type: "ADD", id: "p1", baaniId: 9 },
      { type: "REMOVE", id: "p1", baaniId: 4 },
    ]);
  });

  it("writes nothing when the selection has not changed", () => {
    apply()(pothi, [item(2), item(4)]);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("removes every bani when the selection is emptied", () => {
    apply()(pothi, []);
    expect(dispatched()).toEqual([
      { type: "REMOVE", id: "p1", baaniId: 2 },
      { type: "REMOVE", id: "p1", baaniId: 4 },
    ]);
  });

  // The hook does not read the store or the network at all any more, so there
  // is nothing to stub: an edit made signed out is applied exactly as one made
  // signed in, and waits in the slice for an account to carry it.
  it("applies the edit with no session mocked at all", () => {
    expect(apply()(pothi, [item(9)])).toBe(true);
    expect(dispatched()).toEqual([
      { type: "ADD", id: "p1", baaniId: 9 },
      { type: "REMOVE", id: "p1", baaniId: 2 },
      { type: "REMOVE", id: "p1", baaniId: 4 },
    ]);
  });

  // A shabad added to the pothi on the web has no baaniId. It must not look
  // "unticked" to the diff: that dispatched a remove for an undefined id, which
  // stripped every shabad from the pothi and then from the account.
  it("leaves items that are not banis out of the difference", () => {
    const shabad = { id: "s1", type: "shabad", shabadId: 123, title: "S" };
    apply()({ id: "p1", items: [item(2), shabad, item(4)] }, [item(2)]);
    expect(dispatched()).toEqual([{ type: "REMOVE", id: "p1", baaniId: 4 }]);
  });

  it("does nothing without a pothi to write to", () => {
    expect(apply()(null, [item(9)])).toBe(false);
    expect(actions.addBaniToPothi).not.toHaveBeenCalled();
  });
});
