import {
  downloadTrack,
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

jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/test/documents",
  exists: (...args) => mockExists(...args),
  mkdir: (...args) => mockMkdir(...args),
  unlink: (...args) => mockUnlink(...args),
  downloadFile: (config) => mockDownloadFile(config),
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
  const mockUrl = "https://example.com/artist/track.mp3";
  const mockTrackTitle = "Test Track";
  const AUDIO_DIRECTORY = "/test/documents/audio";

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockExists.mockResolvedValue(false);
    mockMkdir.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    mockCheckIsAudioRemoteExists.mockResolvedValue(true);
    mockCheckIsJsonRemoteExists.mockResolvedValue(true);
  });

  describe("getLocalTrackPath", () => {
    it("should return relative path for audio file", () => {
      const path = getLocalTrackPath(mockUrl);
      expect(path).toBe("artist/track.mp3");
    });

    it("should handle URLs with different structures", () => {
      const url = "https://example.com/path/to/artist/file.mp3";
      const path = getLocalTrackPath(url);
      expect(path).toBe("artist/file.mp3");
    });
  });

  describe("getFullLocalTrackPath", () => {
    it("should return full path for audio file", () => {
      const path = getFullLocalTrackPath(mockUrl);
      expect(path).toBe(`${AUDIO_DIRECTORY}/artist/track.mp3`);
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
        if (path.includes("track.mp3") || path.includes("track.json")) {
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
        if (path.includes("track.mp3")) {
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
        if (path.includes("track.mp3")) return Promise.resolve(true);
        return Promise.resolve(false);
      });

      const result = await downloadAudioOnly(mockUrl, mockTrackTitle);

      expect(result).toEqual({
        relativePath: "artist/track.mp3",
        alreadyExists: true,
        downloaded: false,
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
        if (path.includes("track.mp3") && callCount === 2) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Fourth call: check if audio file exists (after download)
        if (path.includes("track.mp3") && callCount === 3) {
          callCount += 1;
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const mockPromise = Promise.resolve({ statusCode: 200 });
      mockDownloadFile.mockReturnValue({ promise: mockPromise });

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
        if (path.includes("track.mp3") && callCount === 0) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Second call: check if audio file exists (after download)
        if (path.includes("track.mp3") && callCount === 1) {
          callCount += 1;
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const mockPromise = Promise.resolve({ statusCode: 200 });
      mockDownloadFile.mockReturnValue({ promise: mockPromise });

      await downloadAudioOnly(mockUrl, mockTrackTitle, { skipDirectorySetup: true });

      expect(mockMkdir).not.toHaveBeenCalled();
    });

    it("should throw error if audio remote does not exist", async () => {
      mockCheckIsAudioRemoteExists.mockResolvedValue(false);

      await expect(downloadAudioOnly(mockUrl, mockTrackTitle)).rejects.toThrow(
        "Audio source missing"
      );
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
        if (path.includes("track.mp3") && callCount === 2) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Check if audio file exists (after download)
        if (path.includes("track.mp3") && callCount === 3) {
          callCount += 1;
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const mockPromise = Promise.resolve({ statusCode: 200 });
      mockDownloadFile.mockReturnValue({ promise: mockPromise });

      const result = await downloadAudioOnly(mockUrl, mockTrackTitle);

      expect(mockDownloadFile).toHaveBeenCalledWith({
        fromUrl: mockUrl,
        toFile: `${AUDIO_DIRECTORY}/artist/track.mp3`,
        progressDivider: 1,
        begin: expect.any(Function),
      });
      expect(result).toEqual({
        relativePath: "artist/track.mp3",
        alreadyExists: false,
        downloaded: true,
      });
      expect(mockLogMessage).toHaveBeenCalledWith(
        expect.stringContaining("Audio download completed")
      );
    });

    it("should throw error if download fails with non-200 status", async () => {
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
        if (path.includes("track.mp3") && callCount === 2) {
          callCount += 1;
          return Promise.resolve(false);
        }
        return Promise.resolve(false);
      });
      const mockPromise = Promise.resolve({ statusCode: 404 });
      mockDownloadFile.mockReturnValue({ promise: mockPromise });

      await expect(downloadAudioOnly(mockUrl, mockTrackTitle)).rejects.toThrow(
        "Audio download failed with status code: 404"
      );
    });

    it("should throw error if file is not created after download", async () => {
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
        if (path.includes("track.mp3") && callCount === 2) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Check if audio file exists (after download) - return false to simulate failure
        if (path.includes("track.mp3") && callCount === 3) {
          callCount += 1;
          return Promise.resolve(false);
        }
        return Promise.resolve(false);
      });
      const mockPromise = Promise.resolve({ statusCode: 200 });
      mockDownloadFile.mockReturnValue({ promise: mockPromise });

      await expect(downloadAudioOnly(mockUrl, mockTrackTitle)).rejects.toThrow(
        "Audio download completed but file was not created"
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
        progressDivider: 1,
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

    it("should throw error if download fails with non-200 status", async () => {
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
        return Promise.resolve(false);
      });
      mockCheckIsJsonRemoteExists.mockResolvedValue(true);
      const mockPromise = Promise.resolve({ statusCode: 500 });
      mockDownloadFile.mockReturnValue({ promise: mockPromise });

      await expect(downloadLyricsOnly(mockUrl, mockTrackTitle)).rejects.toThrow(
        "Lyrics download failed with status code: 500"
      );
    });

    it("should throw error if file is not created after download", async () => {
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
        // Check if JSON file exists (after download) - return false to simulate failure
        if (path.includes("track.json") && callCount === 3) {
          callCount += 1;
          return Promise.resolve(false);
        }
        return Promise.resolve(false);
      });
      mockCheckIsJsonRemoteExists.mockResolvedValue(true);
      const mockPromise = Promise.resolve({ statusCode: 200 });
      mockDownloadFile.mockReturnValue({ promise: mockPromise });

      await expect(downloadLyricsOnly(mockUrl, mockTrackTitle)).rejects.toThrow(
        "Lyrics download completed but file was not created"
      );
    });
  });

  describe("downloadTrack", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return early if both audio and lyrics already exist", async () => {
      mockExists.mockImplementation((path) => {
        if (path === AUDIO_DIRECTORY) return Promise.resolve(true);
        if (path === `${AUDIO_DIRECTORY}/artist`) return Promise.resolve(true);
        if (path.includes("track.mp3") || path.includes("track.json")) {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      const result = await downloadTrack(mockUrl, mockTrackTitle);

      expect(result).toEqual({
        audioRelativePath: "artist/track.mp3",
        jsonRelativePath: "artist/track.json",
      });
      expect(mockLogMessage).toHaveBeenCalledWith(
        expect.stringContaining("Track already downloaded with lyrics")
      );
    });

    it("should return early if audio exists and lyrics are not available remotely", async () => {
      mockExists.mockImplementation((path) => {
        if (path === AUDIO_DIRECTORY) return Promise.resolve(true);
        if (path === `${AUDIO_DIRECTORY}/artist`) return Promise.resolve(true);
        if (path.includes("track.mp3")) return Promise.resolve(true);
        return Promise.resolve(false);
      });
      mockCheckIsJsonRemoteExists.mockResolvedValue(false);

      const result = await downloadTrack(mockUrl, mockTrackTitle);

      expect(result).toEqual({
        audioRelativePath: "artist/track.mp3",
        jsonRelativePath: null,
      });
      expect(mockLogMessage).toHaveBeenCalledWith(
        expect.stringContaining("Track already downloaded")
      );
    });

    it("should download both audio and lyrics when neither exists", async () => {
      let callCount = 0;
      mockExists.mockImplementation((path) => {
        // Directory checks (multiple times for both audio and lyrics)
        if (path === AUDIO_DIRECTORY) {
          return Promise.resolve(true);
        }
        if (path === `${AUDIO_DIRECTORY}/artist`) {
          return Promise.resolve(true);
        }
        // Check if audio file exists (before download)
        if (path.includes("track.mp3") && callCount < 1) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Check if audio file exists (after download)
        if (path.includes("track.mp3") && callCount === 1) {
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

      const audioPromise = Promise.resolve({ statusCode: 200 });
      const jsonPromise = Promise.resolve({ statusCode: 200 });

      mockDownloadFile.mockImplementation((config) => {
        if (config.fromUrl.includes(".mp3")) {
          return { promise: audioPromise };
        }
        return { promise: jsonPromise };
      });

      const result = await downloadTrack(mockUrl, mockTrackTitle);

      expect(mockDownloadFile).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        audioRelativePath: "artist/track.mp3",
        jsonRelativePath: "artist/track.json",
      });
      expect(mockLogMessage).toHaveBeenCalledWith(
        expect.stringContaining("Download completed: track.mp3 and track.json")
      );
    });

    it("should download only audio when lyrics are not available remotely", async () => {
      let callCount = 0;
      mockExists.mockImplementation((path) => {
        // Directory checks
        if (path === AUDIO_DIRECTORY) {
          return Promise.resolve(true);
        }
        if (path === `${AUDIO_DIRECTORY}/artist`) {
          return Promise.resolve(true);
        }
        // Check if audio file exists (before download)
        if (path.includes("track.mp3") && callCount === 0) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Check if audio file exists (after download)
        if (path.includes("track.mp3") && callCount === 1) {
          callCount += 1;
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });
      mockCheckIsJsonRemoteExists.mockResolvedValue(false);

      const audioPromise = Promise.resolve({ statusCode: 200 });
      mockDownloadFile.mockReturnValue({ promise: audioPromise });

      const result = await downloadTrack(mockUrl, mockTrackTitle);

      expect(mockDownloadFile).toHaveBeenCalledTimes(1);
      expect(mockDownloadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fromUrl: mockUrl,
        })
      );
      expect(result).toEqual({
        audioRelativePath: "artist/track.mp3",
        jsonRelativePath: null,
      });
      expect(mockLogMessage).toHaveBeenCalledWith(
        expect.stringContaining("Download completed: track.mp3 (no lyrics available)")
      );
    });

    it("should download only lyrics when audio already exists", async () => {
      let callCount = 0;
      mockExists.mockImplementation((path) => {
        // Directory checks
        if (path === AUDIO_DIRECTORY) {
          return Promise.resolve(true);
        }
        if (path === `${AUDIO_DIRECTORY}/artist`) {
          return Promise.resolve(true);
        }
        // Check if audio file exists (before download) - should return true
        if (path.includes("track.mp3") && callCount === 0) {
          callCount += 1;
          return Promise.resolve(true);
        }
        // Check if JSON file exists (before download)
        if (path.includes("track.json") && callCount === 1) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // Check if JSON file exists (after download)
        if (path.includes("track.json") && callCount === 2) {
          callCount += 1;
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });
      mockCheckIsJsonRemoteExists.mockResolvedValue(true);

      const jsonPromise = Promise.resolve({ statusCode: 200 });
      mockDownloadFile.mockReturnValue({ promise: jsonPromise });

      const result = await downloadTrack(mockUrl, mockTrackTitle);

      expect(mockDownloadFile).toHaveBeenCalledTimes(1);
      expect(mockDownloadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fromUrl: "https://example.com/artist/track.json",
        })
      );
      expect(result).toEqual({
        audioRelativePath: "artist/track.mp3",
        jsonRelativePath: "artist/track.json",
      });
    });

    it("should throw error and clean up files on download failure", async () => {
      let callCount = 0;
      let downloadAttempted = false;
      mockExists.mockImplementation((path) => {
        // Directory checks
        if (path === AUDIO_DIRECTORY) {
          return Promise.resolve(true);
        }
        if (path === `${AUDIO_DIRECTORY}/artist`) {
          return Promise.resolve(true);
        }
        // Check if audio file exists (before download)
        if (path.includes("track.mp3") && callCount === 0) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // After download fails, check for cleanup
        if (path.includes("track.mp3") && downloadAttempted) {
          return Promise.resolve(true); // Simulate partial download
        }
        if (path.includes("track.json") && downloadAttempted) {
          return Promise.resolve(true); // Simulate partial download
        }
        return Promise.resolve(false);
      });

      const error = new Error("Download failed");
      mockDownloadFile.mockImplementation(() => {
        downloadAttempted = true;
        throw error;
      });

      await expect(downloadTrack(mockUrl, mockTrackTitle)).rejects.toThrow("Download failed");

      expect(mockLogError).toHaveBeenCalledWith(
        expect.stringContaining("Download error for Test Track")
      );
      expect(mockUnlink).toHaveBeenCalledTimes(2); // Clean up both files
    });

    it("should handle cleanup errors gracefully", async () => {
      let callCount = 0;
      let downloadAttempted = false;
      mockExists.mockImplementation((path) => {
        // Directory checks
        if (path === AUDIO_DIRECTORY) {
          return Promise.resolve(true);
        }
        if (path === `${AUDIO_DIRECTORY}/artist`) {
          return Promise.resolve(true);
        }
        // Check if audio file exists (before download)
        if (path.includes("track.mp3") && callCount === 0) {
          callCount += 1;
          return Promise.resolve(false);
        }
        // After download fails, check for cleanup
        if (path.includes("track.mp3") && downloadAttempted) {
          return Promise.resolve(true); // Simulate partial download
        }
        if (path.includes("track.json") && downloadAttempted) {
          return Promise.resolve(true); // Simulate partial download
        }
        return Promise.resolve(false);
      });

      const error = new Error("Download failed");
      mockDownloadFile.mockImplementation(() => {
        downloadAttempted = true;
        throw error;
      });

      mockUnlink.mockRejectedValue(new Error("Cleanup failed"));

      await expect(downloadTrack(mockUrl, mockTrackTitle)).rejects.toThrow("Download failed");

      expect(mockLogError).toHaveBeenCalledWith(
        expect.stringContaining("Error cleaning up failed download")
      );
    });

    it("should handle audio download failure from downloadAudioOnly", async () => {
      mockExists.mockImplementation((path) => {
        // Directory checks
        if (path === AUDIO_DIRECTORY) {
          return Promise.resolve(true);
        }
        if (path === `${AUDIO_DIRECTORY}/artist`) {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });
      mockCheckIsAudioRemoteExists.mockResolvedValue(false);

      await expect(downloadTrack(mockUrl, mockTrackTitle)).rejects.toThrow("Audio source missing");

      expect(mockLogError).toHaveBeenCalledWith(
        expect.stringContaining("Download error for Test Track")
      );
    });
  });
});
