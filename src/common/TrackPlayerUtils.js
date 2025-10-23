import TrackPlayer, { RepeatMode } from "react-native-track-player";
import { logError } from "./index";

export const TrackPlayerSetup = async () => {
  try {
    // Setup the player
    await TrackPlayer.setupPlayer();

    // Set repeat mode
    await TrackPlayer.setRepeatMode(RepeatMode.Off);
  } catch (error) {
    logError(error);
  }
};

export const addTrack = async (track) => {
  try {
    // Validate track object
    if (!track.url) {
      throw new Error("Track URL is missing or empty");
    }
    if (!track.id) {
      logError("Track ID is missing");
    }

    await TrackPlayer.add(track);

    // Get queue to verify track was added
    // const queue = await TrackPlayer.getQueue();
  } catch (error) {
    logError("❌ Error adding track to TrackPlayer:", error);
    throw error; // Re-throw to handle upstream
  }
};

export const playTrack = async () => {
  try {
    await TrackPlayer.play();
  } catch (error) {
    logError(error);
  }
};

export const pauseTrack = async () => {
  try {
    await TrackPlayer.pause();
  } catch (error) {
    logError("Error pausing track:", error);
  }
};

export const stopTrack = async () => {
  try {
    await TrackPlayer.stop();
  } catch (error) {
    logError("Error stopping track:", error);
  }
};

export const resetPlayer = async () => {
  try {
    await TrackPlayer.reset();
  } catch (error) {
    logError("Error resetting player:", error);
  }
};
