import { useState, useEffect } from "react";
import { DocumentDirectoryPath } from "react-native-fs";
import { useSelector, useDispatch } from "react-redux";
import { actions, logError, STRINGS } from "@common";
import { fetchManifest } from "@service";

const useAudioManifest = (baniID) => {
  const [tracks, setTracks] = useState([]);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [isTracksLoading, setIsLoading] = useState(false);
  const [manifestError, setManifestError] = useState(null);
  const defaultAudio = useSelector((state) => state.defaultAudio);

  const dispatch = useDispatch();
  const audioManifest = useSelector((state) => state.audioManifest);

  // Map API manifest data to our track format
  const mapApiDataToTracks = (manifest) => {
    if (!manifest?.data || manifest.data.length === 0) {
      return null;
    }

    return manifest.data
      .filter((item) => item != null)
      .map((item) => ({
        id: item.track_id,
        track_id: item.track_id,
        artistID: item.artist_id,
        audioUrl: item.track_url,
        displayName: item.artist_name,
        trackLengthSec: item.track_length_seconds,
        trackSizeMB: item.track_size_mb,
        lyricsUrl: item.track_url ? item.track_url.replace(".mp3", ".json") : null,
      }));
  };

  // Merge downloaded tracks with API tracks
  const mergeDownloadedTracks = (apiTracks, downloadedTracks) => {
    if (!apiTracks || apiTracks.length === 0) {
      // If no API data, use downloaded tracks
      if (!downloadedTracks || downloadedTracks.length === 0) {
        return [];
      }
      return downloadedTracks.map((track) => {
        const fullLocalPath = `${DocumentDirectoryPath}/audio/${track.audioUrl}`;
        const lyricsUrlPath = `${DocumentDirectoryPath}/audio/${track.lyricsUrl}`;
        return {
          id: track.id,
          track_id: track.track_id,
          artistID: track.artistID,
          audioUrl: fullLocalPath,
          displayName: track.displayName,
          trackLengthSec: track.trackLengthSec,
          trackSizeMB: track.trackSizeMB,
          lyricsUrl: track.lyricsUrl ? lyricsUrlPath : null,
        };
      });
    }

    // Merge downloaded tracks with API tracks
    return apiTracks.map((apiTrack) => {
      const downloadedTrack = downloadedTracks.find((downloaded) => downloaded.id === apiTrack.id);

      if (downloadedTrack) {
        // Use local URL if track is downloaded
        const fullLocalPath = `${DocumentDirectoryPath}/audio/${downloadedTrack.audioUrl}`;
        const lyricsUrlPath = `${DocumentDirectoryPath}/audio/${downloadedTrack.lyricsUrl}`;
        return {
          ...apiTrack,
          audioUrl: fullLocalPath,
          lyricsUrl: downloadedTrack.lyricsUrl ? lyricsUrlPath : null,
        };
      }
      return apiTrack;
    });
  };

  // Set default track based on user preferences
  const setDefaultTrack = (trackList) => {
    if (!trackList || trackList.length === 0) {
      return;
    }

    // Check if user has a preferred audio for this bani
    if (defaultAudio[baniID]) {
      // Find track with matching artist ID
      const defaultTrack = trackList.find(
        (track) => track.artistID.toString() === defaultAudio[baniID].artistID.toString()
      );
      if (defaultTrack && defaultTrack.audioUrl) {
        setCurrentPlaying(defaultTrack);
      }
    }
  };

  const fetchAudioManifest = async () => {
    try {
      setIsLoading(true);
      setManifestError(null);

      // Fetch manifest from API
      const manifest = await fetchManifest(baniID);

      // Map API data to tracks
      let mappedData = mapApiDataToTracks(manifest);
      // Get downloaded tracks from Redux
      const downloadedTracks = audioManifest[baniID];
      // Merge downloaded tracks with API tracks if available
      if (downloadedTracks && downloadedTracks.length > 0) {
        mappedData = mergeDownloadedTracks(mappedData, downloadedTracks);
      }
      // Set tracks and default playing track
      if (mappedData && mappedData.length > 0) {
        setTracks(mappedData);
        setDefaultTrack(mappedData);
        setManifestError(null);
      }
    } catch (error) {
      logError("Error fetching manifest:", error);
      setManifestError(error?.message || STRINGS.NETWORK_ERROR || STRINGS.PLEASE_TRY_AGAIN);
    } finally {
      setIsLoading(false);
    }
  };

  const addTrackToManifest = (track, localPath, jsonPath) => {
    const trackData = {
      id: track.id,
      track_id: track.track_id,
      artistID: track.artistID,
      audioUrl: localPath,
      displayName: track.displayName,
      trackLengthSec: track.trackLengthSec,
      trackSizeMB: track.trackSizeMB,
      lyricsUrl: jsonPath,
    };

    const existingTracks = audioManifest[baniID] || [];
    const trackExists = existingTracks.some((existingTrack) => existingTrack.id === trackData.id);

    if (!trackExists) {
      dispatch(actions.setAudioManifest(baniID, [...existingTracks, trackData]));
    }
  };

  const isTrackDownloaded = (trackId) => {
    try {
      const existingTracks = audioManifest[baniID] || [];
      const track = existingTracks.find((t) => t.id === trackId);

      if (!track) {
        return false;
      }

      // Check if audio is downloaded (not a remote URL)
      const isAudioDownloaded =
        track.audioUrl &&
        !track.audioUrl.startsWith("http://") &&
        !track.audioUrl.startsWith("https://");

      // Check if lyrics are downloaded (lyricsUrl exists and is not a remote URL)
      // Note: lyricsUrl can be null if lyrics aren't available remotely, which is acceptable
      const isLyricsDownloaded =
        track.lyricsUrl &&
        !track.lyricsUrl.startsWith("http://") &&
        !track.lyricsUrl.startsWith("https://");

      // Track is considered downloaded if:
      // 1. Audio is downloaded AND
      // 2. (Lyrics are downloaded OR lyrics aren't available/needed)
      return isAudioDownloaded && (isLyricsDownloaded || !track.lyricsUrl);
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    if (baniID) {
      fetchAudioManifest();
    }
  }, [baniID]);

  return {
    tracks,
    currentPlaying,
    setCurrentPlaying,
    isTracksLoading,
    addTrackToManifest,
    isTrackDownloaded,
    manifestError,
    refetchManifest: fetchAudioManifest,
  };
};

export default useAudioManifest;
