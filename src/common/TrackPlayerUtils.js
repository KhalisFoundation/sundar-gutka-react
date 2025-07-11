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
    await TrackPlayer.add(track);
  } catch (error) {
    console.error("Error adding track:", error);
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
