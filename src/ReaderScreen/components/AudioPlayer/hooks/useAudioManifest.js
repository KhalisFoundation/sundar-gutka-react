import { useState, useEffect } from "react";
import { DocumentDirectoryPath } from "react-native-fs";
import { useSelector, useDispatch } from "react-redux";
import { actions, logError } from "@common";
import { fetchManifest } from "@service";

const useAudioManifest = (baniID) => {
  const [tracks, setTracks] = useState([]);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const defaultAudio = useSelector((state) => state.defaultAudio);

  const dispatch = useDispatch();
  const audioManifest = useSelector((state) => state.audioManifest);

  // Map API manifest data to our track format
  const mapApiDataToTracks = (manifest) => {
    if (!manifest?.data || manifest.data.length === 0) {
      return null;
    }

    return manifest.data.map((item) => ({
      id: item.track_id,
      track_id: item.track_id,
      artistID: item.artist_id,
      audioUrl: item.track_url,
      displayName: item.artist_name,
      trackLengthSec: item.track_length_seconds,
      trackSizeMB: item.track_size_mb,
    }));
  };

  // Merge downloaded tracks with API tracks
  const mergeDownloadedTracks = (apiTracks, downloadedTracks) => {
    if (!apiTracks) {
      // If no API data, use downloaded tracks
      return downloadedTracks.map((track) => {
        const fullLocalPath = `${DocumentDirectoryPath}/audio/${track.localURL}`;
        return {
          id: track.id,
          artistID: track.artistID,
          audioUrl: fullLocalPath,
          displayName: track.displayName,
          isDownloaded: true,
        };
      });
    }

    // Merge downloaded tracks with API tracks
    return apiTracks.map((apiTrack) => {
      const downloadedTrack = downloadedTracks.find((downloaded) => downloaded.id === apiTrack.id);

      if (downloadedTrack) {
        // Use local URL if track is downloaded
        const fullLocalPath = `${DocumentDirectoryPath}/audio/${downloadedTrack.localURL}`;
        return {
          ...apiTrack,
          audioUrl: fullLocalPath,
          isDownloaded: true,
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
        return;
      }
    }

    // Otherwise, use the first track
    setCurrentPlaying(trackList[0]);
  };

  const fetchAudioManifest = async () => {
    try {
      setIsLoading(true);

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
      }
    } catch (error) {
      logError("Error fetching manifest:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTrackToManifest = (track, localPath) => {
    const trackData = {
      id: track.id,
      artistID: track.artistID,
      remoteURL: track.audioUrl,
      localURL: localPath,
      displayName: track.displayName,
    };

    const existingTracks = audioManifest[baniID] || [];
    const trackExists = existingTracks.some((existingTrack) => existingTrack.id === trackData.id);

    if (!trackExists) {
      dispatch(actions.setAudioManifest(baniID, [...existingTracks, trackData]));
    }
  };

  const removeTrackFromManifest = (trackId) => {
    const existingTracks = audioManifest[baniID] || [];
    const updatedTracks = existingTracks.filter((track) => track.id !== trackId);

    dispatch(actions.setAudioManifest(baniID, updatedTracks));
  };

  const isTrackDownloaded = (trackId) => {
    const existingTracks = audioManifest[baniID] || [];
    const track = existingTracks.find((t) => t.id === trackId);
    if (track && track.localURL) {
      // Check if the file actually exists
      // const fullPath = `${DocumentDirectoryPath}/audio/${track.localURL}`;
      return true;
    }
    return false;
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
    isLoading,
    addTrackToManifest,
    removeTrackFromManifest,
    isTrackDownloaded,
  };
};

export default useAudioManifest;
