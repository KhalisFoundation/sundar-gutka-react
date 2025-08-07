import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DocumentDirectoryPath } from "react-native-fs";
import { fetchManifest } from "@service";
import { actions } from "@common";

const useAudioManifest = (baniID) => {
  const [tracks, setTracks] = useState([]);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const defaultAudio = useSelector((state) => state.defaultAudio);

  const dispatch = useDispatch();
  const audioManifest = useSelector((state) => state.audioManifest);

  const fetchAudioManifest = async () => {
    try {
      setIsLoading(true);
      const manifest = await fetchManifest(baniID);

      let mappedData = null;
      if (manifest === null) {
        // If no manifest from API, use existing Redux data
        mappedData = audioManifest[baniID] || null;
      } else {
        // Map API manifest data to our format
        mappedData = manifest.data.map((item) => {
          return {
            id: item.ID,
            artistID: item.artist_id,
            audioUrl: `${item.base_audio_url}${baniID}.mp3`,
            displayName: item.displayName,
          };
        });
      }

      // If we have downloaded tracks in Redux, merge them with API data
      if (audioManifest[baniID] && audioManifest[baniID].length > 0) {
        const downloadedTracks = audioManifest[baniID];

        if (mappedData) {
          // Merge downloaded tracks with API tracks
          mappedData = mappedData.map((apiTrack) => {
            const downloadedTrack = downloadedTracks.find(
              (downloaded) => downloaded.id === apiTrack.id
            );

            if (downloadedTrack) {
              // Use local URL if track is downloaded
              const fullLocalPath = `${DocumentDirectoryPath}/audio/${downloadedTrack.localURL}`;
              console.log("Converting to full path:", {
                relativePath: downloadedTrack.localURL,
                fullLocalPath,
              });
              return {
                ...apiTrack,
                audioUrl: fullLocalPath,
                isDownloaded: true,
              };
            }
            return apiTrack;
          });
        } else {
          // If no API data, use downloaded tracks
          mappedData = downloadedTracks.map((track) => {
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
      }

      if (mappedData && mappedData.length > 0) {
        setTracks(mappedData);

        // Set current playing based on default audio setting
        if (defaultAudio && defaultAudio !== "") {
          // Find track with matching artist ID
          const defaultTrack = mappedData.find(
            (track) => track.artistID.toString() === defaultAudio
          );
          if (defaultTrack) {
            setCurrentPlaying(defaultTrack);
          } else {
            setCurrentPlaying(mappedData[0]);
          }
        } else {
          setCurrentPlaying(mappedData[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching manifest:", error);
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
      const fullPath = `${DocumentDirectoryPath}/audio/${track.localURL}`;
      return fullPath;
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
