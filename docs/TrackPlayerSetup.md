# React Native Track Player Setup

This project now includes a complete setup for `react-native-track-player` to handle audio playback functionality with user-controlled audio settings.

## What's Included

### 1. TrackPlayer Service (`src/services/TrackPlayerService.js`)

- Handles remote control events (play, pause, stop, next, previous)
- Manages background playback controls
- Handles seek operations

### 2. TrackPlayer Utils (`src/utils/TrackPlayerUtils.js`)

- `TrackPlayerSetup()` - Initializes the player with default configuration
- `addTrack(track)` - Adds a track to the queue
- `playTrack()` - Starts playback
- `pauseTrack()` - Pauses playback
- `stopTrack()` - Stops playback
- `resetPlayer()` - Clears the queue

### 3. Custom Hook (`src/hooks/useTrackPlayer.js`)

Provides an easy-to-use interface for components with audio setting support:

```javascript
const {
  isPlaying,
  playbackState,
  progress,
  play,
  pause,
  stop,
  reset,
  addAndPlayTrack,
  seekTo,
  isAudioEnabled,
} = useTrackPlayer();
```

### 4. Audio Settings

- **Redux State**: `isAudio` - Controls whether audio functionality is enabled
- **Settings Component**: `src/Settings/components/audio.jsx` - Toggle switch in settings
- **User Control**: Users can enable/disable audio functionality from the app settings

### 5. Example Component (`src/components/AudioPlayer.jsx`)

A complete audio player component with:

- Play/pause controls
- Progress slider
- Time display
- Stop functionality
- Audio setting awareness (disabled state when audio is off)

## Platform Configuration

### Android Permissions

Added to `android/app/src/main/AndroidManifest.xml`:

- `WAKE_LOCK` - Keeps device awake during playback
- `FOREGROUND_SERVICE` - Allows background playback
- `FOREGROUND_SERVICE_MEDIA_PLAYBACK` - Specific media playback permission

### iOS Configuration

The TrackPlayer service is automatically registered and configured for iOS background audio.

## Usage Examples

### Basic Usage with Audio Setting

```javascript
import useTrackPlayer from "../hooks/useTrackPlayer";

const MyComponent = () => {
  const { isPlaying, play, pause, addAndPlayTrack, isAudioEnabled } = useTrackPlayer();

  const playAudio = async () => {
    if (!isAudioEnabled) {
      alert("Audio is disabled. Please enable it in Settings.");
      return;
    }

    const track = {
      id: "1",
      url: "https://example.com/audio.mp3",
      title: "Song Title",
      artist: "Artist Name",
    };

    await addAndPlayTrack(track);
  };

  return (
    <Button
      title={isPlaying ? "Pause" : "Play"}
      onPress={isPlaying ? pause : playAudio}
      disabled={!isAudioEnabled}
    />
  );
};
```

### Using the AudioPlayer Component

```javascript
import AudioPlayer from "../components/AudioPlayer";

const MyScreen = () => {
  return (
    <AudioPlayer
      audioUrl="https://example.com/audio.mp3"
      title="Track Title"
      artist="Artist Name"
    />
  );
};
```

### Checking Audio Setting in Components

```javascript
import { useSelector } from "react-redux";

const MyAudioComponent = () => {
  const isAudioEnabled = useSelector((state) => state.isAudio);

  if (!isAudioEnabled) {
    return (
      <View>
        <Text>Audio is disabled. Enable it in Settings to use audio features.</Text>
      </View>
    );
  }

  return (
    // Your audio component here
  );
};
```

## Audio Settings Feature

### How it Works

1. **User Control**: Users can toggle audio on/off in the app settings
2. **Global State**: The setting is stored in Redux state (`isAudio`)
3. **Hook Integration**: `useTrackPlayer` hook respects the audio setting
4. **Component Awareness**: Audio components show disabled state when audio is off
5. **Graceful Degradation**: Audio functions return early when audio is disabled

### Benefits

- **User Choice**: Users can disable audio if they prefer text-only experience
- **Performance**: Prevents unnecessary audio processing when disabled
- **Accessibility**: Clear visual feedback when audio features are unavailable
- **Battery Saving**: Audio processing is skipped when disabled

## Track Object Format

```javascript
const track = {
  id: "unique-id", // Required: Unique identifier
  url: "audio-url", // Required: Audio file URL
  title: "Track Title", // Optional: Display title
  artist: "Artist Name", // Optional: Artist name
  album: "Album Name", // Optional: Album name
  artwork: "image-url", // Optional: Album artwork URL
  duration: 180, // Optional: Duration in seconds
};
```

## Features

- Background audio playback
- Lock screen controls
- Notification controls on Android
- Control Center integration on iOS
- Seek functionality
- Progress tracking
- Multiple track support
- **User-controlled audio settings**
- **Graceful degradation when audio is disabled**

## Installation Complete

The package is already installed and configured. The TrackPlayer service is automatically initialized when the app starts, and the audio setting is available in the app settings.

## Next Steps

1. Use the `useTrackPlayer` hook in your components
2. Check `isAudioEnabled` before audio operations
3. Create track objects with your audio URLs
4. Customize the `AudioPlayer` component as needed
5. Add additional controls or features as required

For more advanced usage, refer to the [react-native-track-player documentation](https://react-native-track-player.js.org/).
