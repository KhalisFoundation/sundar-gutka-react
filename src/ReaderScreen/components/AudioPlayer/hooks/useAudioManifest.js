import { useState, useEffect } from "react";
import { DocumentDirectoryPath } from "react-native-fs";
import { useSelector, useDispatch } from "react-redux";
import { actions, logError } from "@common";
import { fetchManifest } from "@service";

// Global cache to persist across component unmounts
const globalApiCache = {};

const useAudioManifest = (baniID) => {
  const [tracks, setTracks] = useState([]);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const defaultAudio = useSelector((state) => state.defaultAudio);

  const dispatch = useDispatch();
  const audioManifest = useSelector((state) => state.audioManifest);

  // Process manifest data (API or cached)
  const processManifestData = (manifest, existingData = null) => {
    let mappedData = null;

    if (existingData) {
      // Use existing Redux data
      mappedData = existingData.map((track) => {
        const fullLocalPath = `${DocumentDirectoryPath}/audio/${track.localURL}`;
        return {
          id: track.id,
          artistID: track.artistID,
          audioUrl: fullLocalPath,
          displayName: track.displayName,
          isDownloaded: true,
        };
      });
    } else if (manifest && manifest.data) {
      // Map API manifest data to our format
      mappedData = manifest.data.map((item) => ({
        id: item.track_id,
        track_id: item.track_id,
        artistID: item.artist_id,
        audioUrl: item.track_url,
        displayName: item.artist_name,
        trackLengthSec: item.track_length_seconds,
        trackSizeMB: item.track_size_mb,
      }));

      // Merge with downloaded tracks if available
      if (audioManifest[baniID] && audioManifest[baniID].length > 0) {
        const downloadedTracks = audioManifest[baniID];
        mappedData = mappedData.map((apiTrack) => {
          const downloadedTrack = downloadedTracks.find(
            (downloaded) => downloaded.id === apiTrack.id
          );

          if (downloadedTrack) {
            const fullLocalPath = `${DocumentDirectoryPath}/audio/${downloadedTrack.localURL}`;
            return {
              ...apiTrack,
              audioUrl: fullLocalPath,
              isDownloaded: true,
            };
          }
          return apiTrack;
        });
      }
    }

    if (mappedData && mappedData.length > 0) {
      setTracks(mappedData);

      // Set current playing based on default audio setting
      if (defaultAudio[baniID]) {
        const defaultTrack = mappedData.find(
          (track) => track.artistID.toString() === defaultAudio[baniID].artistID.toString()
        );
        if (defaultTrack && defaultTrack.audioUrl) {
          setCurrentPlaying(defaultTrack);
        } else {
          setCurrentPlaying(mappedData[0]);
        }
      } else {
        setCurrentPlaying(mappedData[0]);
      }
    }
  };

  const fetchAudioManifest = async () => {
    try {
      setIsLoading(true);

      // Check global cache first
      if (globalApiCache[baniID]) {
        const cachedData = globalApiCache[baniID];
        processManifestData(cachedData);
        return;
      }

      // Check if we have existing Redux data first
      if (audioManifest[baniID] && audioManifest[baniID].length > 0) {
        const existingData = audioManifest[baniID];
        processManifestData(null, existingData);
        return;
      }

      // Only make API call if no cached data
      // Add timeout to prevent hanging on slow networks
      const manifestPromise = fetchManifest(baniID);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Manifest fetch timeout")), 5000)
      );

      const manifest = await Promise.race([manifestPromise, timeoutPromise]);

      // Cache the API response globally
      if (manifest) {
        globalApiCache[baniID] = manifest;
      }

      processManifestData(manifest);
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
      // Only fetch if we don't have data for this baniID
      if (!tracks.length && !isLoading) {
        fetchAudioManifest();
      }
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
