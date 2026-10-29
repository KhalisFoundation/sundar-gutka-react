import {
  isTrackDownloaded,
  getLocalTrackPath,
  getFullLocalTrackPath,
  getLocalJsonPath,
  getFullLocalJsonPath,
  downloadAudioOnly,
  downloadLyricsOnly,
} from "./audioDownloader";

// Mock react-native-fs
const mockExists = jest.fn();
const mockMkdir = jest.fn();
const mockUnlink = jest.fn();
const mockDownloadFile = jest.fn();
const mockStat = jest.fn();
const mockStopDownload = jest.fn();
// The downloaded lyrics file's contents; valid JSON unless a test says not.
const mockReadFile = jest.fn(() => Promise.resolve("[]"));

jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/test/documents",
  exists: (...args) => mockExists(...args),
  mkdir: (...args) => mockMkdir(...args),
  unlink: (...args) => mockUnlink(...args),
  downloadFile: (config) => mockDownloadFile(config),
  stat: (...args) => mockStat(...args),
  stopDownload: (...args) => mockStopDownload(...args),
  readFile: (...args) => mockReadFile(...args),
}));

// Mock checkHelper
const mockCheckIsAudioRemoteExists = jest.fn();
const mockCheckIsJsonRemoteExists = jest.fn();

jest.mock("./checkHelper", () => ({
  checkIsAudioRemoteExists: (...args) => mockCheckIsAudioRemoteExists(...args),
  checkIsJsonRemoteExists: (...args) => mockCheckIsJsonRemoteExists(...args),
}));

// Mock @common logging functions
const mockLogError = jest.fn();
const mockLogMessage = jest.fn();

jest.mock("@common", () => ({
  logError: (...args) => mockLogError(...args),
  logMessage: (...args) => mockLogMessage(...args),
}));

describe("audioDownloader", () => {
  const mockUrl = "https://example.com/artist/track.m4a";
  const mockTrackTitle = "Test Track";
  const AUDIO_DIRECTORY = "/test/documents/audio";

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockExists.mockResolvedValue(false);
    mockMkdir.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    mockStat.mockResolvedValue({ size: 5000000 }); // 5MB default — valid M4A
    mockCheckIsAudioRemoteExists.mockResolvedValue(true);
    mockCheckIsJsonRemoteExists.mockResolvedValue(true);
  });

  describe("getLocalTrackPath", () => {
    it("should return relative path for audio file", () => {
      const path = getLocalTrackPath(mockUrl);
      expect(path).toBe("artist/track.m4a");
    });

    it("should handle URLs with different structures", () => {
      const url = "https://example.com/path/to/artist/file.m4a";
      const path = getLocalTrackPath(url);
      expect(path).toBe("artist/file.m4a");
    });
  });

  describe("getFullLocalTrackPath", () => {
    it("should return full path for audio file", () => {
      const path = getFullLocalTrackPath(mockUrl);
      expect(path).toBe(`${AUDIO_DIRECTORY}/artist/track.m4a`);
    });
  });

  describe("getLocalJsonPath", () => {
    it("should return relative path for JSON file", () => {
      const path = getLocalJsonPath(mockUrl);
      expect(path).toBe("artist/track.json");
    });

    it("should replace audio extension with .json", () => {
      const url = "https://example.com/artist/track.m4a";
      const path = getLocalJsonPath(url);
      expect(path).toBe("artist/track.json");
    });
  });

  describe("getFullLocalJsonPath", () => {
    it("should return full path for JSON file", () => {
      const path = getFullLocalJsonPath(mockUrl);
      expect(path).toBe(`${AUDIO_DIRECTORY}/artist/track.json`);
    });
  });

  describe("isTrackDownloaded", () => {
    it("should return true when both audio and JSON files exist", async () => {
      mockExists.mockImplementation((path) => {
        if (path.includes("track.m4a") || path.includes("track.json")) {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const result = await isTrackDownloaded(mockUrl);
      expect(result).toEqual({ audioFileExists: true, jsonFileExists: true });
    });

    it("should return false when audio file is missing", async () => {
      mockExists.mockImplementation((path) => {
        if (path.includes("track.json")) {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const result = await isTrackDownloaded(mockUrl);
      expect(result).toEqual({ audioFileExists: false, jsonFileExists: true });
    });

    it("should return false when JSON file is missing", async () => {
      mockExists.mockImplementation((path) => {
        if (path.includes("track.m4a")) {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const result = await isTrackDownloaded(mockUrl);
      expect(result).toEqual({ audioFileExists: true, jsonFileExists: false });
    });

    it("should return false and log error on exception", async () => {
      mockExists.mockRejectedValue(new Error("File system error"));

      const result = await isTrackDownloaded(mockUrl);
      expect(result).toEqual({ audioFileExists: false, jsonFileExists: false });
      expect(mockLogError).toHaveBeenCalledWith(
        expect.stringContaining("Error checking if track is downloaded")
      );
    });
  });

  describe("downloadAudioOnly", () => {
    it("should return early if audio file already exists", async () => {
      mockExists.mockImplementation((path) => {
        if (path === AUDIO_DIRECTORY) return Promise.resolve(true);
        if (path === `${AUDIO_DIRECTORY}/artist`) return Promise.resolve(true);
        if (path.includes("track.m4a")) return Promise.resolve(true);
        return Promise.resolve(false);
      });

      const result = await downloadAudioOnly(mockUrl, mockTrackTitle);

      expect(result).toEqual({
        relativePath: "artist/track.m4a",
        alreadyExists: true,
        downloaded: false,
        jobId: null,
      });
      expect(mockLogMessage).toHaveBeenCalledWith(
        expect.stringContaining("Audio already downloaded")
      );
      expect(mockDownloadFile).not.toHaveBeenCalled();
    });

    it("should create directories if they don't exist", async () => {
      let callCount = 0;
      mockExists.mockImplementation((path) => {
        // First call: check audio directory
        if (path === AUDIO_DIRECTORY && callCount === 0) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Second call: check artist directory
        if (path === `${AUDIO_DIRECTORY}/artist` && callCount === 1) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Third call: check if audio file exists (before download)
        if (path.includes("track.m4a") && callCount === 2) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Fourth call: check if audio file exists (after download)
        if (path.includes("track.m4a") && callCount === 3) {
          callCount += 1;
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const mockPromise = Promise.resolve({ statusCode: 200 });
      mockDownloadFile.mockReturnValue({ promise: mockPromise, jobId: 42 });

      await downloadAudioOnly(mockUrl, mockTrackTitle);

      expect(mockMkdir).toHaveBeenCalledWith(AUDIO_DIRECTORY, {
        NSURLIsExcludedFromBackupKey: true,
      });
      expect(mockMkdir).toHaveBeenCalledWith(`${AUDIO_DIRECTORY}/artist`, {
        NSURLIsExcludedFromBackupKey: true,
      });
    });

    it("should skip directory setup when skipDirectorySetup is true", async () => {
      let callCount = 0;
      mockExists.mockImplementation((path) => {
        // First call: check if audio file exists (before download)
        if (path.includes("track.m4a") && callCount === 0) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Second call: check if audio file exists (after download)
        if (path.includes("track.m4a") && callCount === 1) {
          callCount += 1;
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const mockPromise = Promise.resolve({ statusCode: 200 });
      mockDownloadFile.mockReturnValue({ promise: mockPromise, jobId: 42 });

      await downloadAudioOnly(mockUrl, mockTrackTitle, { skipDirectorySetup: true });

      expect(mockMkdir).not.toHaveBeenCalled();
    });

    it("should download audio file successfully", async () => {
      let callCount = 0;
      mockExists.mockImplementation((path) => {
        // Directory checks
        if (path === AUDIO_DIRECTORY && callCount < 2) {
          callCount += 1;
          return Promise.resolve(true);
        }
        if (path === `${AUDIO_DIRECTORY}/artist` && callCount < 2) {
          callCount += 1;
          return Promise.resolve(true);
        }
        // Check if audio file exists (before download)
        if (path.includes("track.m4a") && callCount === 2) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Check if audio file exists (after download)
        if (path.includes("track.m4a") && callCount === 3) {
          callCount += 1;
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const mockPromise = Promise.resolve({ statusCode: 200 });
      mockDownloadFile.mockReturnValue({ promise: mockPromise, jobId: 42 });

      const result = await downloadAudioOnly(mockUrl, mockTrackTitle);

      expect(mockDownloadFile).toHaveBeenCalledWith({
        fromUrl: mockUrl,
        toFile: `${AUDIO_DIRECTORY}/artist/track.m4a`,
        progressDivider: 20,
        begin: expect.any(Function),
      });
      expect(result).toEqual({
        relativePath: "artist/track.m4a",
        alreadyExists: false,
        downloaded: true,
        jobId: 42,
      });
      expect(mockLogMessage).toHaveBeenCalledWith(
        expect.stringContaining("Audio download completed")
      );
    });
  });

  describe("downloadLyricsOnly", () => {
    it("should return early if JSON file already exists", async () => {
      mockExists.mockImplementation((path) => {
        if (path === AUDIO_DIRECTORY) return Promise.resolve(true);
        if (path === `${AUDIO_DIRECTORY}/artist`) return Promise.resolve(true);
        if (path.includes("track.json")) return Promise.resolve(true);
        return Promise.resolve(false);
      });

      const result = await downloadLyricsOnly(mockUrl, mockTrackTitle);

      expect(result).toEqual({
        relativePath: "artist/track.json",
        alreadyExists: true,
        downloaded: false,
        remoteMissing: false,
      });
      expect(mockLogMessage).toHaveBeenCalledWith(
        expect.stringContaining("Lyrics already downloaded")
      );
      expect(mockDownloadFile).not.toHaveBeenCalled();
    });

    it("should return early if JSON remote does not exist", async () => {
      mockCheckIsJsonRemoteExists.mockResolvedValue(false);
      mockExists.mockResolvedValue(false);

      const result = await downloadLyricsOnly(mockUrl, mockTrackTitle);

      expect(result).toEqual({
        relativePath: "artist/track.json",
        alreadyExists: false,
        downloaded: false,
        remoteMissing: true,
      });
      expect(mockLogMessage).toHaveBeenCalledWith(
        expect.stringContaining("Lyrics not available for download")
      );
      expect(mockDownloadFile).not.toHaveBeenCalled();
    });

    it("should download JSON file successfully", async () => {
      let callCount = 0;
      mockExists.mockImplementation((path) => {
        // Directory checks
        if (path === AUDIO_DIRECTORY && callCount < 2) {
          callCount += 1;
          return Promise.resolve(true);
        }
        if (path === `${AUDIO_DIRECTORY}/artist` && callCount < 2) {
          callCount += 1;
          return Promise.resolve(true);
        }
        // Check if JSON file exists (before download)
        if (path.includes("track.json") && callCount === 2) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Check if JSON file exists (after download)
        if (path.includes("track.json") && callCount === 3) {
          callCount += 1;
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });
      mockCheckIsJsonRemoteExists.mockResolvedValue(true);
      const mockPromise = Promise.resolve({ statusCode: 200 });
      mockDownloadFile.mockReturnValue({ promise: mockPromise });

      const result = await downloadLyricsOnly(mockUrl, mockTrackTitle);

      expect(mockDownloadFile).toHaveBeenCalledWith({
        fromUrl: "https://example.com/artist/track.json",
        toFile: `${AUDIO_DIRECTORY}/artist/track.json`,
        progressDivider: 20,
        begin: expect.any(Function),
      });
      expect(result).toEqual({
        relativePath: "artist/track.json",
        alreadyExists: false,
        downloaded: true,
        remoteMissing: false,
      });
      expect(mockLogMessage).toHaveBeenCalledWith(
        expect.stringContaining("Lyrics download completed")
      );
    });

    // RNFS writes the response body whatever the status, so an error page (or a
    // captive portal's 200 HTML) must not be left behind as the lyrics.
    it.each([
      ["a non-200 response", { statusCode: 500 }, "[]"],
      ["a body that is not JSON", { statusCode: 200 }, "<html>Sign in to Wi-Fi</html>"],
    ])("deletes the file and reports no download on %s", async (_case, response, body) => {
      mockExists.mockResolvedValue(false);
      mockCheckIsJsonRemoteExists.mockResolvedValue(true);
      mockDownloadFile.mockReturnValue({ promise: Promise.resolve(response) });
      mockReadFile.mockReset();
      mockReadFile.mockResolvedValue(body);

      const result = await downloadLyricsOnly(mockUrl, mockTrackTitle);

      expect(result.downloaded).toBe(false);
      expect(mockUnlink).toHaveBeenCalledWith(`${AUDIO_DIRECTORY}/artist/track.json`);
      mockReadFile.mockResolvedValue("[]");
    });
  });
});
