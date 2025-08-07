import TrackPlayer, { RepeatMode } from "react-native-track-player";

export const TrackPlayerSetup = async () => {
  try {
    // Setup the player
    await TrackPlayer.setupPlayer({
      // Optional: customize player options
      // waitForBuffer: true,
      // maxCacheSize: 1024,
    });

    // Set repeat mode
    await TrackPlayer.setRepeatMode(RepeatMode.Off);
  } catch (error) {
    console.error("Error setting up TrackPlayer:", error);
  }
};

export const addTrack = async (track) => {
  try {
    // Validate track object
    if (!track.url) {
      throw new Error("Track URL is missing or empty");
    }
    if (!track.id) {
      console.warn("Track ID is missing");
    }

    await TrackPlayer.add(track);

    // Get queue to verify track was added
    const queue = await TrackPlayer.getQueue();
  } catch (error) {
    console.error("❌ Error adding track to TrackPlayer:", error);
    console.error("Error details:", error.message);
    console.error("Error code:", error.code);
    throw error; // Re-throw to handle upstream
  }
};

export const playTrack = async () => {
  try {
    await TrackPlayer.play();
  } catch (error) {
    console.error("Error playing track:", error);
  }
};

export const pauseTrack = async () => {
  try {
    await TrackPlayer.pause();
  } catch (error) {
    console.error("Error pausing track:", error);
  }
};

export const stopTrack = async () => {
  try {
    await TrackPlayer.stop();
  } catch (error) {
    console.error("Error stopping track:", error);
  }
};

export const resetPlayer = async () => {
  try {
    await TrackPlayer.reset();
  } catch (error) {
    console.error("Error resetting player:", error);
  }
};
