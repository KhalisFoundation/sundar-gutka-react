/* eslint-env jest */
import { renderHook } from "@testing-library/react-native";
import { actions, showConfirm, showToast } from "@common";
import useDeletePothi from "./useDeletePothi";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
jest.mock("@common", () => ({
  actions: { deletePothi: jest.fn((id) => ({ type: "DELETE_POTHI", id })) },
  showConfirm: jest.fn(),
  showToast: jest.fn(),
  STRINGS: {
    CANCEL: "Cancel",
    POTHI_DELETE: "Delete",
    POTHI_DELETE_CONFIRM: "Delete {name} pothi?",
    POTHI_DELETED: "Pothi deleted",
    formatString: (s, vars) => s.replace("{name}", vars.name),
  },
  trackPothiEvent: jest.fn(),
}));

// One confirm-then-delete for both places that offer it. What matters is that
// deleting is never silent and never immediate — the deletion itself is local
// and reaches the account through the outbox when there is one.

const remove = () => renderHook(() => useDeletePothi()).result.current;

/** Runs whatever the confirm dialog would run if the user tapped Delete. */
const confirmIt = () => showConfirm.mock.calls[0][0].onConfirm();

beforeEach(() => jest.clearAllMocks());

describe("useDeletePothi", () => {
  it("asks first and deletes nothing until the confirm is answered", () => {
    remove()({ id: "p1", name: "Nitnem", count: 3 });

    expect(mockDispatch).not.toHaveBeenCalled();
    const dialog = showConfirm.mock.calls[0][0];
    expect(dialog.destructive).toBe(true);
    // Names the pothi in the question, and asks nothing else — no second line
    // of body text under it.
    expect(dialog.title).toBe("Delete Nitnem pothi?");
    expect(dialog.message).toBeUndefined();
  });

  it("deletes and reports success once confirmed", () => {
    remove()({ id: "p1", name: "Nitnem", count: 3 });
    confirmIt();

    expect(actions.deletePothi).toHaveBeenCalledWith("p1");
    expect(mockDispatch).toHaveBeenCalledWith({ type: "DELETE_POTHI", id: "p1" });
    expect(showToast).toHaveBeenCalledWith("Pothi deleted", "success");
  });

  it("runs the caller's callback after deleting, so the screen can leave", () => {
    const onDeleted = jest.fn();
    remove()({ id: "p1", name: "Nitnem", count: 0 }, onDeleted);
    confirmIt();

    expect(onDeleted).toHaveBeenCalled();
  });

  // Nothing here reads the session or the network. A guest's delete is a real
  // delete: the folder leaves the slice and leaves a tombstone, which the sync
  // layer sends only once there is an account that has heard of the folder.
  it("deletes with no session mocked at all", () => {
    const onDeleted = jest.fn();
    remove()({ id: "p1", name: "Nitnem", count: 3 }, onDeleted);
    confirmIt();

    expect(mockDispatch).toHaveBeenCalledWith({ type: "DELETE_POTHI", id: "p1" });
    expect(onDeleted).toHaveBeenCalled();
  });
});
