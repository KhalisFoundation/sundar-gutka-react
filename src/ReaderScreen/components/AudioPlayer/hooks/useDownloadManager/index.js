import { useState, useEffect } from "react";
import { logError } from "@common";
import { downloadTrack } from "../../utils/audioDownloader";

const useDownloadManager = (currentPlaying, addTrackToManifest, isTrackDownloaded) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const checkDownloadStatus = () => {
    if (currentPlaying?.id) {
      try {
        const downloaded = isTrackDownloaded(currentPlaying.id);
        return downloaded;
      } catch (error) {
        logError("Error checking download status:", error);
        return false;
      }
    }
    return false;
  };

  const handleDownload = async () => {
    if (!currentPlaying?.audioUrl || isDownloading) {
      return;
    }

    try {
      const downloaded = checkDownloadStatus();
      if (downloaded) {
        return;
      }

      setIsDownloading(true);
      const result = await downloadTrack(currentPlaying.audioUrl, currentPlaying.displayName);
      if (!result.audioRelativePath) {
        return;
      }
      setIsDownloaded(true);
      addTrackToManifest(currentPlaying, result.audioRelativePath, result.jsonRelativePath);
    } catch (error) {
      logError("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const autoDownload = async () => {
      const isDownloadedStatus = checkDownloadStatus();

      if (currentPlaying?.audioUrl && !isDownloadedStatus) {
        await handleDownload();
      } else {
        setIsDownloaded(true);
      }
    };

    if (currentPlaying?.audioUrl) {
      autoDownload();
    }
  }, [currentPlaying?.audioUrl]);

  return {
    isDownloading,
    isDownloaded,
    handleDownload,
  };
};

export default useDownloadManager;
