import TrackPlayer, { RepeatMode, AppKilledPlaybackBehavior } from "react-native-track-player";
import { logError, logMessage } from "./index";

// Singleton service to manage TrackPlayer initialization
class TrackPlayerService {
  constructor() {
    this.isInitialized = false;
    this.initPromise = null;
    this.activeListeners = new Set();
  }

  async initialize() {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.isInitialized) {
      return Promise.resolve();
    }

    // Create initialization promise
    this.initPromise = (async () => {
      try {
        logMessage("Initializing TrackPlayer service...");

        // Setup the player with optimized configuration
        // setupPlayer() will throw if already initialized, so we catch it
        await TrackPlayer.setupPlayer({
          waitForBuffer: false, // Don't wait for buffer on startup for better performance
          maxCacheSize: 512, // Reduced cache for faster startup
          iosCategory: "playback",
          alwaysPauseOnInterruption: true,
        });

        // Set repeat mode
        await TrackPlayer.setRepeatMode(RepeatMode.Off);

        // Configure capabilities
        await TrackPlayer.updateOptions({
          android: {
            appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
          },
          capabilities: [
            TrackPlayer.Capability.Play,
            TrackPlayer.Capability.Pause,
            TrackPlayer.Capability.SkipToNext,
            TrackPlayer.Capability.SkipToPrevious,
            TrackPlayer.Capability.Stop,
            TrackPlayer.Capability.SeekTo,
          ],
          compactCapabilities: [
            TrackPlayer.Capability.Play,
            TrackPlayer.Capability.Pause,
            TrackPlayer.Capability.SkipToNext,
          ],
        });

        this.isInitialized = true;
        logMessage("TrackPlayer service initialized successfully");
      } catch (error) {
        // If setupPlayer throws because it's already initialized, that's okay
        if (
          error?.message?.includes("already initialized") ||
          error?.code === "player_already_initialized"
        ) {
          this.isInitialized = true;
          logMessage("TrackPlayer already initialized");
        } else {
          logError(`TrackPlayer initialization failed: ${error?.message || "Unknown error"}`);
          this.isInitialized = false;
          throw error;
        }
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  async cleanup() {
    try {
      logMessage("Cleaning up TrackPlayer service...");

      // Stop any active playback
      await TrackPlayer.stop();
      await TrackPlayer.reset();

      this.isInitialized = false;
      logMessage("TrackPlayer service cleaned up successfully");
    } catch (error) {
      logError(`TrackPlayer cleanup failed: ${error?.message || "Unknown error"}`);
    }
  }

  getState() {
    return {
      isInitialized: this.isInitialized,
    };
  }
}

// Export singleton instance
const trackPlayerService = new TrackPlayerService();

export const TrackPlayerSetup = async () => {
  return trackPlayerService.initialize();
};

export const TrackPlayerCleanup = async () => {
  return trackPlayerService.cleanup();
};

export const getTrackPlayerState = () => {
  return trackPlayerService.getState();
};

export const addTrack = async (track) => {
  try {
    // Validate track object
    if (!track.url) {
      logError("Track URL is missing or empty");
      throw new Error("Track URL is missing or empty");
    }
    if (!track.id) {
      logError("Track ID is missing");
    }

    await TrackPlayer.add(track);
  } catch (error) {
    logError(`❌ Error adding track to TrackPlayer: ${error}`);
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
    logError(`Error pausing track: ${error}`);
  }
};

export const stopTrack = async () => {
  try {
    await TrackPlayer.stop();
  } catch (error) {
    logError(`Error stopping track: ${error}`);
  }
};

export const resetPlayer = async () => {
  try {
    await TrackPlayer.reset();
  } catch (error) {
    logError(`Error resetting player: ${error}`);
  }
};
