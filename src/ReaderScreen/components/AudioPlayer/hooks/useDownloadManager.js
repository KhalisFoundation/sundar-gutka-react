import { useState } from "react";
import { logError, logMessage } from "@common";
import { downloadTrack, deleteTrack } from "../utils/audioDownloader";

const useDownloadManager = (
  currentPlaying,
  addTrackToManifest,
  removeTrackFromManifest,
  isTrackDownloaded
) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const checkDownloadStatus = () => {
    if (currentPlaying) {
      try {
        const downloaded = isTrackDownloaded(currentPlaying.id);
        setIsDownloaded(downloaded);
        return downloaded;
      } catch (error) {
        setIsDownloaded(false);
        logError("Error checking download status:", error);
        return false;
      }
    }
    return false;
  };

  const handleDownload = async () => {
    if (!currentPlaying || isDownloading) return;

    try {
      const downloaded = checkDownloadStatus();
      if (downloaded) return;
      setIsDownloading(true);

      const localPath = await downloadTrack(
        currentPlaying.audioUrl,
        currentPlaying.displayName,
        (local) => {
          // Success callback
          setIsDownloaded(true);
          // showDownloadMessage(true, currentPlaying.displayName);
          addTrackToManifest(currentPlaying, local);
        },
        (error) => {
          logError("Download error:", error);
          // Error callback
          // showDownloadMessage(false, currentPlaying.displayName, error.message);
        }
      );

      addTrackToManifest(currentPlaying, localPath);
    } catch (error) {
      logError("Download error:", error);
      // showDownloadMessage(false, currentPlaying.displayName, error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteDownload = async () => {
    if (!currentPlaying || isDownloading) return;

    try {
      // Remove track from Redux manifest
      removeTrackFromManifest(currentPlaying.id);
      setIsDownloaded(false);

      // Also delete the actual file
      const success = await deleteTrack(currentPlaying.audioUrl);

      if (!success) {
        logMessage("File deletion failed, but track removed from manifest");
      }
    } catch (error) {
      logError("Error deleting track:", error);
    }
  };

  return {
    isDownloading,
    isDownloaded,
    handleDownload,
    handleDeleteDownload,
  };
};

export default useDownloadManager;
