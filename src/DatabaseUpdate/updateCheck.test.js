/* eslint-env jest */
import { resolveUpdateCheck, UPDATE_CHECK } from "./updateCheck";

const mockCheck = jest.fn();
const mockLogError = jest.fn();
const mockLogMessage = jest.fn();
jest.mock("@common", () => ({
  checkForBaniDBUpdate: (...a) => mockCheck(...a),
  isNetworkFailure: require("@common/networkFailure").isNetworkFailure,
  logError: (...a) => mockLogError(...a),
  logMessage: (...a) => mockLogMessage(...a),
}));

// An offline user opening this screen used to produce two Crashlytics
// non-fatals per visit and be told the database was up to date.
describe("resolveUpdateCheck", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not ask the network when offline, and reports nothing", async () => {
    expect(await resolveUpdateCheck({ isOnline: false })).toBe(UPDATE_CHECK.OFFLINE);
    expect(mockCheck).not.toHaveBeenCalled();
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it("maps the check's answer to available / up to date", async () => {
    mockCheck.mockResolvedValueOnce(true);
    expect(await resolveUpdateCheck({ isOnline: true })).toBe(UPDATE_CHECK.AVAILABLE);
    mockCheck.mockResolvedValueOnce(false);
    expect(await resolveUpdateCheck({ isOnline: true })).toBe(UPDATE_CHECK.UP_TO_DATE);
  });

  it("treats a failed request as offline — a message, never an error", async () => {
    mockCheck.mockRejectedValueOnce(new TypeError("Network request failed"));
    expect(await resolveUpdateCheck({ isOnline: true })).toBe(UPDATE_CHECK.OFFLINE);
    expect(mockLogError).not.toHaveBeenCalled();
    expect(mockLogMessage).toHaveBeenCalledTimes(1);
  });

  it("still reports a genuine failure as an error", async () => {
    mockCheck.mockRejectedValueOnce(new Error("Failed to fetch remote MD5 hash: 500 Server Error"));
    expect(await resolveUpdateCheck({ isOnline: true })).toBe(UPDATE_CHECK.FAILED);
    expect(mockLogError).toHaveBeenCalledTimes(1);
  });
});
