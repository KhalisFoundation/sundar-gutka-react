/* eslint-env jest */
/**
 * Content corrections reach every install through migrations, fresh ones
 * included: the bundled DB is never edited, because its checksum is what both
 * seeding and the in-app update compare against.
 */

let mockVersion = 0;
const mockExecuteSql = jest.fn(async (sql) => {
  if (/^PRAGMA user_version$/.test(sql.trim())) {
    return [{ rows: { item: () => ({ user_version: mockVersion }) } }];
  }
  return [{ rows: { length: 0 } }];
});

jest.mock("react-native-sqlite-storage", () => ({
  enablePromise: jest.fn(),
  openDatabase: jest.fn(async () => ({ executeSql: (...a) => mockExecuteSql(...a) })),
}));
jest.mock("@common", () => ({
  constant: { DB: "gutka_v01" },
  logError: jest.fn(),
  logMessage: jest.fn(),
  ensureDbExists: jest.fn(async () => {}),
  LOCAL_DB_PATH: "/docs/gutka_v01.db",
}));

const statements = () => mockExecuteSql.mock.calls.map(([sql]) => sql.replace(/\s+/g, " "));

beforeEach(() => {
  jest.resetModules();
  mockExecuteSql.mockClear();
});

const open = async () => {
  // eslint-disable-next-line global-require
  const initDB = require("./connect").default;
  await initDB();
};

it("applies both corrections to a fresh install's DB", async () => {
  mockVersion = 0;
  await open();
  const sql = statements();
  expect(sql.some((s) => /UPDATE mv_Banis_Shabad .*ਬਾਰਹ ਮਾਹਾ/.test(s))).toBe(true);
  expect(sql.some((s) => /UPDATE Banis_Bookmarks .*ਰਾਤੀ ਰੁਤੀ ਥਿਤੀ ਵਾਰ/.test(s))).toBe(true);
  expect(sql).toContain("PRAGMA user_version = 2");
});

it("applies only the newer one to a DB the previous release migrated", async () => {
  mockVersion = 1;
  await open();
  const sql = statements();
  expect(sql.some((s) => /UPDATE mv_Banis_Shabad/.test(s))).toBe(false);
  expect(sql.some((s) => /UPDATE Banis_Bookmarks/.test(s))).toBe(true);
});

it("leaves a migrated DB alone", async () => {
  mockVersion = 2;
  await open();
  expect(statements().some((s) => /UPDATE/.test(s))).toBe(false);
});
