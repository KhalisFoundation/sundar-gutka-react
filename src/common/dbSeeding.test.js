/* eslint-env jest */
/**
 * Seeding the bundled bani DB onto the device, on both platforms.
 *
 * iOS could never RE-seed. Its `copyFile` is NSFileManager's
 * `copyItemAtPath:`, which fails when the destination already exists, where
 * Android's `copyFileAssets` overwrites. So the second seed — an app update
 * shipping a newer bundled DB — threw on iOS only, and the throw took the
 * open path's retry, which opened a different, empty database. Every query
 * then came back "no such table": a blank bani list with nothing on it to
 * tap, on that launch and on every launch after it, because the marker that
 * records what was seeded is only written once the copy succeeds.
 */
import { Platform } from "react-native";
import { copyFile, copyFileAssets, exists, readFile, unlink } from "react-native-fs";
import { ensureDbExists } from "./rnfs";

jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/docs",
  MainBundlePath: "/bundle",
  readDir: jest.fn(async () => []),
  readFile: jest.fn(async () => "hash"),
  readFileAssets: jest.fn(async () => "hash"),
  writeFile: jest.fn(async () => {}),
  exists: jest.fn(async () => false),
  copyFile: jest.fn(async () => {}),
  copyFileAssets: jest.fn(async () => {}),
  unlink: jest.fn(async () => {}),
}));

jest.mock("@common", () => ({
  constant: { DB: "gutka_v01", REMOTE_DB_URL: "https://example.test/db" },
  logError: jest.fn(),
  logMessage: jest.fn(),
}));

const DB = "/docs/gutka_v01.db";
const MD5 = "/docs/gutka_v01.md5";
const MARKER = "/docs/gutka_v01.bundled.md5";

/** The bundled build ships `bundled`; the device was last seeded from `seeded`. */
const onDevice = ({ dbPresent, seeded, bundled = "new-hash" }) => {
  exists.mockImplementation(async (path) => {
    if (path === DB) return dbPresent;
    if (path === MARKER) return seeded !== null;
    return dbPresent;
  });
  readFile.mockImplementation(async (path) => (path.startsWith("/bundle") ? bundled : seeded));
};

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "ios";
});

it("clears the old copy first, so a re-seed cannot fail on iOS", async () => {
  onDevice({ dbPresent: true, seeded: "old-hash" });

  await ensureDbExists();

  expect(unlink).toHaveBeenCalledWith(DB);
  expect(unlink).toHaveBeenCalledWith(MD5);
  expect(copyFile).toHaveBeenCalledWith("/bundle/www/gutka_v01.db", DB);
});

it("does the same on Android, where the assets copy would have overwritten anyway", async () => {
  Platform.OS = "android";
  onDevice({ dbPresent: true, seeded: "old-hash" });

  await ensureDbExists();

  expect(copyFileAssets).toHaveBeenCalledWith("www/gutka_v01.db", DB);
});

it("seeds a fresh install, where there is nothing to clear", async () => {
  onDevice({ dbPresent: false, seeded: null });

  await ensureDbExists();

  expect(unlink).not.toHaveBeenCalled();
  expect(copyFile).toHaveBeenCalledWith("/bundle/www/gutka_v01.db", DB);
});

it("leaves a DB seeded from this same build alone", async () => {
  onDevice({ dbPresent: true, seeded: "new-hash" });

  await ensureDbExists();

  expect(unlink).not.toHaveBeenCalled();
  expect(copyFile).not.toHaveBeenCalled();
});
