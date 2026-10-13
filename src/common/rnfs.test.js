/* eslint-env jest */
import { Platform } from "react-native";

// An in-memory file system, so the seed can be driven through real sequences of
// copies, moves and deletes.
const mockFiles = new Map();
const mockFailNextMoveTo = { path: null };

jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/docs",
  MainBundlePath: "/bundle",
  readDir: jest.fn(async () => []),
  exists: jest.fn(async (p) => mockFiles.has(p)),
  readFile: jest.fn(async (p) => mockFiles.get(p)),
  readFileAssets: jest.fn(async () => "bundled-md5\n"),
  writeFile: jest.fn(async (p, v) => {
    mockFiles.set(p, v);
  }),
  unlink: jest.fn(async (p) => {
    if (!mockFiles.has(p)) throw new Error(`ENOENT ${p}`);
    mockFiles.delete(p);
  }),
  copyFile: jest.fn(async (from, to) => {
    mockFiles.set(to, `copy-of:${from}`);
  }),
  copyFileAssets: jest.fn(async (from, to) => {
    // Yield, so parallel callers genuinely interleave.
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
    mockFiles.set(to, `asset:${from}`);
  }),
  moveFile: jest.fn(async (from, to) => {
    if (mockFailNextMoveTo.path === to) {
      mockFailNextMoveTo.path = null;
      throw new Error("move failed");
    }
    if (!mockFiles.has(from)) throw new Error(`ENOENT ${from}`);
    mockFiles.set(to, mockFiles.get(from));
    mockFiles.delete(from);
  }),
  stat: jest.fn(async (p) => ({ size: mockFiles.has(p) ? 10 : 0 })),
  hash: jest.fn(async () => "bundled-md5"),
}));

jest.mock("@common", () => ({
  constant: { DB: "gutka_v01", REMOTE_DB_URL: "https://example.test/database" },
  logError: jest.fn(),
  logMessage: jest.fn(),
  logNetworkError: jest.fn(),
}));

const DB = "/docs/gutka_v01.db";

describe("ensureDbExists", () => {
  let fs;
  let ensureDbExists;

  beforeEach(() => {
    jest.resetModules();
    mockFiles.clear();
    mockFailNextMoveTo.path = null;
    Platform.OS = "android";
    fs = require("react-native-fs");
    jest.clearAllMocks();
    ({ ensureDbExists } = require("./rnfs"));
  });

  it("seeds once when several queries ask at the same time", async () => {
    await Promise.all([ensureDbExists(), ensureDbExists(), ensureDbExists()]);

    // One DB copy and one md5 copy, not one per caller.
    expect(fs.copyFileAssets).toHaveBeenCalledTimes(2);
    expect(mockFiles.get(DB)).toBe("asset:www/gutka_v01.db");
    expect(mockFiles.has(`${DB}.incoming`)).toBe(false);
  });

  it("does nothing more once seeded, while the file is still there", async () => {
    await ensureDbExists();
    fs.copyFileAssets.mockClear();

    await ensureDbExists();

    expect(fs.copyFileAssets).not.toHaveBeenCalled();
  });

  it("reseeds if the file disappears later in the session", async () => {
    await ensureDbExists();
    mockFiles.delete(DB);
    fs.copyFileAssets.mockClear();

    await ensureDbExists();

    expect(mockFiles.has(DB)).toBe(true);
  });

  it("keeps the existing database, and doesn't fail queries, when a refresh fails", async () => {
    mockFiles.set(DB, "known-good");
    mockFiles.set("/docs/gutka_v01.bundled.md5", "older-build-md5");
    mockFailNextMoveTo.path = DB;

    await expect(ensureDbExists()).resolves.toBeUndefined();

    expect(mockFiles.get(DB)).toBe("known-good");
    expect(mockFiles.has(`${DB}.previous`)).toBe(false);
    // Not marked as seeded, so the next launch tries again...
    expect(mockFiles.get("/docs/gutka_v01.bundled.md5")).toBe("older-build-md5");
    // ...but later queries in this launch don't redo the copy.
    fs.copyFileAssets.mockClear();
    await ensureDbExists();
    expect(fs.copyFileAssets).not.toHaveBeenCalled();
  });

  it("still fails when there is no database at all and seeding fails", async () => {
    mockFailNextMoveTo.path = DB;

    await expect(ensureDbExists()).rejects.toThrow("move failed");
  });

  it("first launch after upgrade: adopts a DB whose checksum is this build's (seeded or downloaded)", async () => {
    mockFiles.set(DB, "current-db");
    mockFiles.set("/docs/gutka_v01.md5", "bundled-md5");

    await ensureDbExists();

    expect(fs.copyFileAssets).not.toHaveBeenCalled();
    expect(mockFiles.get(DB)).toBe("current-db");
    expect(mockFiles.get("/docs/gutka_v01.bundled.md5")).toBe("bundled-md5");
  });

  it("first launch after upgrade: refreshes a stale DB whose checksum is older", async () => {
    mockFiles.set(DB, "stale-db");
    mockFiles.set("/docs/gutka_v01.md5", "pre-2025-md5");

    await ensureDbExists();

    expect(mockFiles.get(DB)).toBe("asset:www/gutka_v01.db");
    expect(mockFiles.get("/docs/gutka_v01.bundled.md5")).toBe("bundled-md5");
  });

  it("first launch after upgrade: refreshes when there is no saved checksum at all", async () => {
    mockFiles.set(DB, "unknown-db");

    await ensureDbExists();

    expect(mockFiles.get(DB)).toBe("asset:www/gutka_v01.db");
  });

  it("refreshes when a newer build ships a different bundled database", async () => {
    mockFiles.set(DB, "old-bundled");
    mockFiles.set("/docs/gutka_v01.bundled.md5", "older-build-md5");

    await ensureDbExists();

    expect(mockFiles.get(DB)).toBe("asset:www/gutka_v01.db");
    expect(mockFiles.get("/docs/gutka_v01.bundled.md5")).toBe("bundled-md5");
  });
});
