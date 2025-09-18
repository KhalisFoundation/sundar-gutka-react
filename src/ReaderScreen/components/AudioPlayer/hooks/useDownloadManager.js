import { useState, useEffect } from "react";
import { downloadTrack, deleteTrack } from "../utils/audioDownloader";

const useDownloadManager = (
  currentPlaying,
  addTrackToManifest,
  removeTrackFromManifest,
  isTrackDownloaded
) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Check download status when current track changes
  useEffect(() => {
    const checkDownloadStatus = () => {
      if (currentPlaying) {
        try {
          const downloaded = isTrackDownloaded(currentPlaying.id);
          setIsDownloaded(downloaded);
          console.log(`Track ${currentPlaying.id} download status:`, downloaded);
        } catch (error) {
          console.error("Error checking download status:", error);
        }
      }
    };

    checkDownloadStatus();
  }, [currentPlaying, isTrackDownloaded]);

  const handleDownload = async () => {
    if (!currentPlaying || isDownloading) return;
    try {
      setIsDownloading(true);

      const localPath = await downloadTrack(
        currentPlaying.audioUrl,
        currentPlaying.displayName,
        (progress) => {
          // Progress callback
          console.log(`Download progress: ${progress}%`);
        },
        (local) => {
          // Success callback
          setIsDownloaded(true);
          // showDownloadMessage(true, currentPlaying.displayName);
          addTrackToManifest(currentPlaying, local);
        },
        (error) => {
          console.log("Download error:", error);
          // Error callback
          // showDownloadMessage(false, currentPlaying.displayName, error.message);
        }
      );

      addTrackToManifest(currentPlaying, localPath);
    } catch (error) {
      console.error("Download error:", error);
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
        console.warn("File deletion failed, but track removed from manifest");
      }
    } catch (error) {
      console.error("Error deleting track:", error);
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
